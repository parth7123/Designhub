import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '../../../../lib/auth';
import { db } from '../../../../lib/db';
import { streamFileFromDrive } from '../../../../lib/services/drive-service';
import { Readable } from 'stream';

// In-memory rate limiting map: ip/userId -> count & reset timestamp
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count += 1;
  return true;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    const session = await getSessionUser(req);

    if (!session) {
      return NextResponse.json({ error: 'Authentication required to download purchased assets' }, { status: 401 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || 'local';
    const rateLimitKey = `dl_${session.userId}_${clientIp}`;

    if (!checkRateLimit(rateLimitKey, 15, 60000)) {
      return NextResponse.json(
        { error: 'Too many download requests. Please wait a minute before downloading again.' },
        { status: 429 }
      );
    }

    const listing = await db.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.status === 'DELETED' || !listing.zipDriveFileId) {
      return NextResponse.json(
        { error: 'This design asset was deleted by the seller and is no longer available for download.' },
        { status: 410 }
      );
    }

    // Purchase / Free Verification
    let isAuthorized = false;

    if (listing.isFree) {
      isAuthorized = true;
      // Record download log for free listing
      await db.downloadLog.create({
        data: {
          userId: session.userId,
          listingId: listing.id,
          type: 'FREE',
        },
      });
    } else if (session.role === 'ADMIN') {
      isAuthorized = true;
    } else if (session.role === 'SELLER' && listing.sellerId === session.userId) {
      isAuthorized = true;
    } else {
      // Check if buyer has completed order for this listing
      const verifiedOrder = await db.order.findFirst({
        where: {
          buyerId: session.userId,
          listingId: listing.id,
          status: 'COMPLETED',
        },
      });

      if (verifiedOrder) {
        isAuthorized = true;
        // Increment order download count
        await db.order.update({
          where: { id: verifiedOrder.id },
          data: { downloadCount: { increment: 1 } },
        });

        // Record download log for paid listing
        await db.downloadLog.create({
          data: {
            userId: session.userId,
            listingId: listing.id,
            type: 'PAID',
          },
        });
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'You have not purchased this asset or your purchase is pending verification.' },
        { status: 403 }
      );
    }

    // Increment listing download count
    await db.listing.update({
      where: { id: listing.id },
      data: { downloadCount: { increment: 1 } },
    });

    // Fetch stream from hidden Google Drive via Service Account (or local fallback)
    const { stream, mimeType, size } = await streamFileFromDrive(listing.zipDriveFileId);

    // Convert Node Readable stream to Web ReadableStream for Next.js response
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
    });

    const safeFileName = `${listing.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Asset.zip`;

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': mimeType || 'application/zip',
        'Content-Disposition': `attachment; filename="${safeFileName}"`,
        ...(size > 0 ? { 'Content-Length': size.toString() } : {}),
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      },
    });
  } catch (error: any) {
    console.error('Download stream proxy error:', error);
    return NextResponse.json({ error: error.message || 'Failed to stream file download' }, { status: 500 });
  }
}
