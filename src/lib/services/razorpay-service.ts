import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '../db';

function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TUHtq7FjCBYSOe';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'k2QA7Om873kWVjAzDxhC5KuW';

  return new Razorpay({
    key_id,
    key_secret,
  });
}

const PUBLIC_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TUHtq7FjCBYSOe';

/**
 * Calculates platform fee and seller earnings based on admin commission settings or per-seller override
 */
export async function calculateCommission(itemPrice: number, sellerId: string) {
  const seller = await db.user.findUnique({
    where: { id: sellerId },
    select: { commissionOverride: true },
  });

  let commissionPct = 15; // Global default: 15%

  if (seller?.commissionOverride !== null && seller?.commissionOverride !== undefined) {
    commissionPct = seller.commissionOverride;
  } else {
    const adminSetting = await db.adminSetting.findUnique({
      where: { key: 'global_commission_pct' },
    });
    if (adminSetting?.value) {
      commissionPct = parseFloat(adminSetting.value);
    }
  }

  const platformFee = Math.round((itemPrice * (commissionPct / 100)) * 100) / 100;
  const sellerEarnings = Math.round((itemPrice - platformFee) * 100) / 100;

  return {
    commissionPct,
    platformFee,
    sellerEarnings,
  };
}

/**
 * Creates a real Razorpay Order
 */
export async function createRazorpayOrder({
  listingId,
  buyerId,
}: {
  listingId: string;
  buyerId: string;
}) {
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    include: { seller: true },
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  const { platformFee, sellerEarnings } = await calculateCommission(listing.price, listing.sellerId);
  const amountInPaise = Math.round(listing.price * 100);

  // Free design asset bypass
  if (listing.isFree || listing.price === 0 || amountInPaise <= 0) {
    return {
      razorpayOrderId: `free_order_${Date.now()}_${listingId.substring(0, 5)}`,
      amount: 0,
      currency: 'INR',
      keyId: PUBLIC_KEY_ID,
      listing,
      platformFee: 0,
      sellerEarnings: 0,
      isFree: true,
    };
  }

  const sellerPaise = Math.round(sellerEarnings * 100);
  const razorpay = getRazorpayInstance();

  const options: any = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: `rcpt_${Date.now()}_${listingId.substring(0, 5)}`,
    notes: {
      listingId,
      buyerId,
      sellerId: listing.sellerId,
    },
  };

  // If seller has a linked Razorpay Route account, attempt transfers split
  if (listing.seller.razorpayAccountId && !listing.seller.razorpayAccountId.startsWith('acc_rzp_route_')) {
    options.transfers = [
      {
        account: listing.seller.razorpayAccountId,
        amount: sellerPaise,
        currency: 'INR',
        notes: {
          listingTitle: listing.title,
        },
        on_hold: false,
      },
    ];
  }

  try {
    const order = await razorpay.orders.create(options);
    return {
      razorpayOrderId: order.id,
      amount: listing.price,
      currency: 'INR',
      keyId: PUBLIC_KEY_ID,
      listing,
      platformFee,
      sellerEarnings,
      isFree: false,
    };
  } catch (error: any) {
    // If Route split failed, retry standard order without transfers
    console.warn('Razorpay order creation with transfers failed, retrying standard order:', error?.error?.description || error?.message || error);
    delete options.transfers;
    try {
      const fallbackOrder = await razorpay.orders.create(options);
      return {
        razorpayOrderId: fallbackOrder.id,
        amount: listing.price,
        currency: 'INR',
        keyId: PUBLIC_KEY_ID,
        listing,
        platformFee,
        sellerEarnings,
        isFree: false,
      };
    } catch (err2: any) {
      console.error('Standard Razorpay order creation failed:', err2?.error?.description || err2?.message || err2);
      throw new Error(err2?.error?.description || err2?.message || 'Failed to create Razorpay Order');
    }
  }
}

/**
 * Verifies Razorpay Payment Signature with HMAC SHA-256
 */
export function verifyPaymentSignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  if (razorpayOrderId.startsWith('free_order_')) {
    return true;
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'k2QA7Om873kWVjAzDxhC5KuW';

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return generatedSignature === razorpaySignature;
}

/**
 * Onboards Seller as a Linked Account on Razorpay Route
 */
export async function createRazorpayLinkedAccount({
  name,
  email,
  businessName,
  bankAccountNo,
  ifscCode,
}: {
  name: string;
  email: string;
  businessName: string;
  bankAccountNo: string;
  ifscCode: string;
}) {
  const razorpay = getRazorpayInstance();

  try {
    const account = await (razorpay as any).accounts.create({
      name,
      email,
      tnc_accepted: true,
      account_details: {
        business_name: businessName,
        business_type: 'individual',
      },
      bank_account: {
        ifsc_code: ifscCode,
        account_number: bankAccountNo,
        name: name,
      },
    });

    return account.id as string;
  } catch (err) {
    console.warn('Razorpay Route API linked account creation fallback:', err);
    return `acc_rzp_route_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
}
