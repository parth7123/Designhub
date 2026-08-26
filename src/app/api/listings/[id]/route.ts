import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listing = await db.listing.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            name: true,
            businessName: true,
            avatarUrl: true,
            bio: true,
            createdAt: true,
          },
        },
        reviews: {
          include: {
            buyer: { select: { name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Increment view count asynchronously
    await db.listing.update({
      where: { id: listing.id },
      data: { viewsCount: { increment: 1 } },
    });

    // Related items in same category
    const relatedListings = await db.listing.findMany({
      where: {
        categoryId: listing.categoryId,
        id: { not: listing.id },
        status: 'APPROVED',
      },
      take: 4,
      include: {
        seller: { select: { name: true } },
      },
    });

    // More from this seller
    const sellerListings = await db.listing.findMany({
      where: {
        sellerId: listing.sellerId,
        id: { not: listing.id },
        status: 'APPROVED',
      },
      take: 4,
    });

    return NextResponse.json({
      listing,
      relatedListings,
      sellerListings,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching listing' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionUser(req);

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const listing = await db.listing.findUnique({ where: { id } });
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (session.role !== 'ADMIN' && listing.sellerId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized to modify this listing' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, price, status, categoryId } = body;

    const updated = await db.listing.update({
      where: { id },
      data: {
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
        ...(price !== undefined ? { price: parseFloat(price) } : {}),
        ...(status ? { status } : {}),
        ...(categoryId ? { categoryId } : {}),
      },
    });

    return NextResponse.json({ success: true, listing: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error updating listing' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionUser(req);

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const listing = await db.listing.findUnique({ where: { id } });
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (session.role !== 'ADMIN' && listing.sellerId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized to delete this listing' }, { status: 403 });
    }

    // 1. Permanently delete underlying asset files from Google Drive and/or local disk storage
    const { deleteFileFromDrive } = await import('../../../../lib/services/drive-service');
    if (listing.zipDriveFileId) {
      await deleteFileFromDrive(listing.zipDriveFileId);
    }
    if (listing.previewDriveFileId) {
      await deleteFileFromDrive(listing.previewDriveFileId);
    }

    // 2. Check if this listing was ever purchased or downloaded
    const orderCount = await db.order.count({ where: { listingId: id } });
    const downloadLogCount = await db.downloadLog.count({ where: { listingId: id } });

    // Clean up non-essential relations (Favorites)
    await db.favorite.deleteMany({ where: { listingId: id } });

    if (orderCount > 0 || downloadLogCount > 0) {
      // Preserve purchase & download history so buyer library knows the listing was deleted by seller
      await db.listing.update({
        where: { id },
        data: {
          status: 'DELETED',
          zipDriveFileId: '', // Cleared because physical file was deleted
        },
      });
      return NextResponse.json({ success: true, message: 'Listing and stored files deleted successfully' });
    }

    // 3. If never purchased or downloaded, completely clean up remaining relations & delete listing row
    await db.review.deleteMany({ where: { listingId: id } });
    await db.dispute.deleteMany({ where: { listingId: id } });
    await db.message.deleteMany({ where: { listingId: id } });
    await db.listing.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Listing and stored files deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error deleting listing' }, { status: 500 });
  }
}

