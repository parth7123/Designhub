import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { streamFileFromDrive } from '../../../../lib/services/drive-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;

    // ETag-based client caching — browser won't re-fetch if image hasn't changed
    const etag = `"preview-${listingId}"`;
    const ifNoneMatch = req.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
        },
      });
    }

    // Only select the two fields we actually need — saves ~10ms per request
    const listing = await db.listing.findUnique({
      where: { id: listingId },
      select: { previewUrl: true, previewDriveFileId: true },
    });

    if (!listing) {
      return NextResponse.redirect('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80');
    }

    // Direct URL: instant redirect, no streaming overhead
    if (listing.previewUrl && listing.previewUrl.startsWith('http')) {
      const res = NextResponse.redirect(listing.previewUrl);
      res.headers.set('Cache-Control', 'public, max-age=604800');
      return res;
    }

    // Drive file: stream with strong caching headers
    if (listing.previewDriveFileId) {
      const { stream, mimeType } = await streamFileFromDrive(listing.previewDriveFileId);

      const webStream = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => controller.enqueue(chunk));
          stream.on('end', () => controller.close());
          stream.on('error', (err) => controller.error(err));
        },
      });

      return new NextResponse(webStream, {
        status: 200,
        headers: {
          'Content-Type': mimeType || 'image/jpeg',
          'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
          'ETag': etag,
          'Vary': 'Accept-Encoding',
        },
      });
    }

    return NextResponse.redirect('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80');
  } catch (error: any) {
    return NextResponse.redirect('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80');
  }
}
