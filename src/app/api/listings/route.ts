import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getSessionUser, requireRole } from '../../../lib/auth';
import { uploadFileToDrive } from '../../../lib/services/drive-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get('category');
    const subcategorySlug = searchParams.get('subcategory');
    const query = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minRating = searchParams.get('minRating');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const sellerId = searchParams.get('sellerId');
    const pricing = searchParams.get('pricing'); // 'all', 'free', 'paid'

    const andConditions: any[] = [];

    if (sellerId) {
      andConditions.push({ sellerId });
    } else {
      andConditions.push({ status: 'APPROVED' });
    }

    if (subcategorySlug && subcategorySlug !== 'all') {
      andConditions.push({
        category: { slug: { equals: subcategorySlug, mode: 'insensitive' } },
      });
    } else if (categorySlug && categorySlug !== 'all') {
      andConditions.push({
        OR: [
          { category: { slug: { equals: categorySlug, mode: 'insensitive' } } },
          { category: { parent: { slug: { equals: categorySlug, mode: 'insensitive' } } } },
        ],
      });
    }

    if (pricing === 'free') {
      andConditions.push({ isFree: true });
    } else if (pricing === 'paid') {
      andConditions.push({ isFree: false });
    }

    if (query && query.trim()) {
      const q = query.trim();
      andConditions.push({
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { tags: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    if (minPrice || maxPrice) {
      const priceCond: any = {};
      if (minPrice && !isNaN(parseFloat(minPrice))) priceCond.gte = parseFloat(minPrice);
      if (maxPrice && !isNaN(parseFloat(maxPrice))) priceCond.lte = parseFloat(maxPrice);
      andConditions.push({ price: priceCond });
    }

    if (minRating && !isNaN(parseFloat(minRating))) {
      andConditions.push({ ratingAvg: { gte: parseFloat(minRating) } });
    }

    const where = { AND: andConditions };

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price_asc') orderBy = { price: 'asc' };
    if (sortBy === 'price_desc') orderBy = { price: 'desc' };
    if (sortBy === 'rating') orderBy = { ratingAvg: 'desc' };
    if (sortBy === 'popular') orderBy = { downloadCount: 'desc' };

    const listings = await db.listing.findMany({
      where,
      orderBy,
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true, parentId: true, parent: { select: { name: true, slug: true } } } },
        seller: { select: { id: true, name: true, businessName: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ listings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch listings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    const authCheck = requireRole(session, ['SELLER', 'ADMIN']);

    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: 403 });
    }

    const currentSeller = await db.user.findUnique({ where: { id: session!.userId } });
    if (currentSeller?.status === 'SUSPENDED') {
      return NextResponse.json({ error: 'Your seller account is currently suspended. Please pay the required penalty fine to unlock publishing.' }, { status: 403 });
    }

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const isFree = formData.get('isFree') === 'true';
    const priceInput = formData.get('price') as string;
    const price = isFree ? 0 : parseFloat(priceInput);
    const categoryId = formData.get('categoryId') as string;
    const tagsString = formData.get('tags') as string || '[]';
    
    const zipFile = formData.get('zipFile') as File | null;
    
    // Support multiple preview files (min 1, max 4)
    let rawPreviewFiles = formData.getAll('previewFiles') as File[];
    if (rawPreviewFiles.length === 0) {
      const singlePreview = formData.get('previewFile') as File | null;
      if (singlePreview) rawPreviewFiles = [singlePreview];
    }
    // Filter out non-File or empty entries
    const previewFiles = rawPreviewFiles.filter(f => f && typeof f === 'object' && f.name);

    if (!title || !description || (!isFree && isNaN(price)) || !categoryId) {
      return NextResponse.json({ error: 'Title, description, price, and category are required' }, { status: 400 });
    }

    if (!zipFile && !formData.get('existingZipDriveId')) {
      return NextResponse.json({ error: 'A product ZIP file is required for the listing' }, { status: 400 });
    }

    if (zipFile) {
      const zipName = zipFile.name.toLowerCase();
      const validZipExts = ['.zip', '.rar', '.7z'];
      if (!validZipExts.some((ext) => zipName.endsWith(ext))) {
        return NextResponse.json({ error: `Invalid product file "${zipFile.name}". Only .zip, .rar, or .7z archives are allowed.` }, { status: 400 });
      }
    }

    if (previewFiles.length < 1 || previewFiles.length > 4) {
      return NextResponse.json({ error: 'Minimum 1 and maximum 4 preview images are required.' }, { status: 400 });
    }

    const validImgExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const invalidImg = previewFiles.find((f) => !validImgExts.some((ext) => f.name.toLowerCase().endsWith(ext)));
    if (invalidImg) {
      return NextResponse.json({ error: `Invalid preview image "${invalidImg.name}". Only JPG, PNG, and WEBP preview images are allowed.` }, { status: 400 });
    }

    let zipDriveFileId = formData.get('existingZipDriveId') as string || '';
    let previewDriveFileId = formData.get('existingPreviewDriveId') as string || '';
    let fileSizeBytes = 0;
    let previewUrl: string | undefined = undefined;
    const previewUrlsArr: string[] = [];

    // 1. Process ZIP Upload & Preview Images concurrently for maximum speed
    const { promises: fsPromises } = await import('fs');
    const publicDir = `${process.cwd()}/public/previews`;
    await fsPromises.mkdir(publicDir, { recursive: true });

    const zipPromise = zipFile
      ? (async () => {
          const buffer = Buffer.from(await zipFile.arrayBuffer());
          return uploadFileToDrive(buffer, zipFile.name, 'application/zip');
        })()
      : Promise.resolve(null);

    const previewPromises = previewFiles.map(async (pFile, i) => {
      const buffer = Buffer.from(await pFile.arrayBuffer());
      const ext = (pFile.name.split('.').pop() || 'jpg').toLowerCase();
      const staticFileName = `preview_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      await fsPromises.writeFile(`${publicDir}/${staticFileName}`, buffer);
      return `/previews/${staticFileName}`;
    });

    const [zipUploadResult, previewUrlsResults] = await Promise.all([
      zipPromise,
      Promise.all(previewPromises),
    ]);

    if (zipUploadResult) {
      zipDriveFileId = zipUploadResult.fileId;
      fileSizeBytes = zipUploadResult.fileSizeBytes;
    }

    if (previewUrlsResults.length > 0) {
      previewUrl = previewUrlsResults[0];
      previewUrlsArr.push(...previewUrlsResults);
    }

    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // Parse tags array
    let tagsParsed = '[]';
    try {
      if (Array.isArray(JSON.parse(tagsString))) {
        tagsParsed = tagsString;
      } else {
        tagsParsed = JSON.stringify(tagsString.split(',').map((t) => t.trim()));
      }
    } catch (e) {
      tagsParsed = JSON.stringify(tagsString.split(',').map((t) => t.trim()));
    }

    const listing = await db.listing.create({
      data: {
        title,
        slug,
        description,
        price: isFree ? 0 : price,
        isFree,
        categoryId,
        sellerId: session!.userId,
        zipDriveFileId,
        previewDriveFileId: previewDriveFileId || null,
        previewUrl,
        previewUrls: JSON.stringify(previewUrlsArr),
        fileSizeBytes,
        tags: tagsParsed,
        status: 'APPROVED', // Default live
      },
    });

    // 3. Notify followers of new design release
    try {
      const seller = await db.user.findUnique({
        where: { id: session!.userId },
        select: { name: true, businessName: true },
      });

      const sellerDisplayName = seller?.businessName || seller?.name || 'A creator';
      const followers = await db.follow.findMany({
        where: { sellerId: session!.userId },
        select: { followerId: true },
      });

      if (followers.length > 0) {
        await db.notification.createMany({
          data: followers.map((f) => ({
            userId: f.followerId,
            title: 'New Design Released!',
            message: `${sellerDisplayName} published a new design: "${title}"`,
            type: 'NEW_LISTING',
            link: `/marketplace/${listing.slug}`,
          })),
        });
      }
    } catch (notifErr) {
      console.error('Failed to dispatch follower notifications:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Listing published successfully! File stored securely.',
      listing,
    });
  } catch (error: any) {
    console.error('Create listing error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create listing' }, { status: 500 });
  }
}
