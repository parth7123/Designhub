import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';
import { SellerProfileClient } from './SellerProfileClient';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ sellerId: string }>;
}

export default async function SellerProfilePage({ params }: PageProps) {
  const { sellerId } = await params;

  const seller = await db.user.findUnique({
    where: { id: sellerId },
    select: {
      id: true,
      name: true,
      businessName: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
      role: true,
      status: true,
      warningNotice: true,
      penaltyFineAmount: true,
    },
  });

  if (!seller) {
    notFound();
  }

  const listings = await db.listing.findMany({
    where: {
      sellerId,
      status: 'APPROVED',
    },
    include: {
      category: { select: { name: true, slug: true } },
      seller: { select: { id: true, name: true, businessName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const followerCount = await db.follow.count({
    where: { sellerId },
  });

  // Calculate stats
  const totalListings = listings.length;
  const totalReviews = listings.reduce((sum, l) => sum + l.reviewCount, 0);
  const avgRatingSum = listings.reduce((sum, l) => sum + (l.ratingAvg > 0 ? l.ratingAvg : 5.0), 0);
  const avgRating = totalListings > 0 ? avgRatingSum / totalListings : 5.0;

  let initialIsFollowing = false;
  // Check session if logged in
  try {
    // Note: in Server Components, session can be read if headers available
  } catch (e) {}

  return (
    <SellerProfileClient
      seller={seller}
      listings={listings}
      followerCount={followerCount}
      initialIsFollowing={initialIsFollowing}
      stats={{
        totalListings,
        avgRating,
        totalReviews,
      }}
    />
  );
}
