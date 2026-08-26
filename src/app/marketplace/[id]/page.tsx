import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { db } from '../../../lib/db';
import { ListingDetailClient } from './ListingDetailClient';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await db.listing.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    select: {
      title: true,
      description: true,
      previewUrl: true,
      id: true,
      slug: true,
      isFree: true,
      price: true,
    },
  });

  if (!listing) {
    return {
      title: 'Listing Not Found | DesignHub',
    };
  }

  const priceText = listing.isFree ? 'FREE' : `₹${listing.price}`;
  const previewImg = listing.previewUrl || `/api/preview/${listing.id}`;

  return {
    title: `${listing.title} (${priceText}) | DesignHub Marketplace`,
    description: listing.description.slice(0, 160),
    openGraph: {
      title: `${listing.title} (${priceText})`,
      description: listing.description.slice(0, 160),
      url: `/marketplace/${listing.slug || listing.id}`,
      siteName: 'DesignHub Marketplace',
      images: [
        {
          url: previewImg,
          width: 1200,
          height: 630,
          alt: listing.title,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${listing.title} (${priceText})`,
      description: listing.description.slice(0, 160),
      images: [previewImg],
    },
  };
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params;

  const listing = await db.listing.findFirst({
    where: { OR: [{ id }, { slug: id }] },
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
          status: true,
          warningNotice: true,
          penaltyFineAmount: true,
        },
      },
      reviews: {
        include: { buyer: { select: { name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!listing) {
    notFound();
  }

  // Related items
  const relatedListings = await db.listing.findMany({
    where: { categoryId: listing.categoryId, id: { not: listing.id }, status: 'APPROVED' },
    take: 4,
    include: {
      category: { select: { name: true } },
      seller: { select: { id: true, name: true, businessName: true, avatarUrl: true } },
    },
  });

  return <ListingDetailClient listing={listing} relatedListings={relatedListings} />;
}
