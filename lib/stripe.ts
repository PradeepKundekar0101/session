import Stripe from "stripe";
import { config, platformFeeCents } from "@/lib/config";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export async function createConnectAccount(email: string) {
  const stripe = getStripe();
  return stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
}

export async function createAccountLink(accountId: string, returnPath: string) {
  const stripe = getStripe();
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${config.appUrl}${returnPath}?stripe=refresh`,
    return_url: `${config.appUrl}${returnPath}?stripe=return`,
    type: "account_onboarding",
  });
}

export async function createManualCapturePaymentIntent(params: {
  amountCents: number;
  mentorStripeAccountId: string;
  learnerEmail: string;
  bookingId: string;
}) {
  const stripe = getStripe();
  const fee = platformFeeCents(params.amountCents);

  return stripe.paymentIntents.create({
    amount: params.amountCents,
    currency: "usd",
    capture_method: "manual",
    automatic_payment_methods: { enabled: true },
    application_fee_amount: fee,
    transfer_data: { destination: params.mentorStripeAccountId },
    receipt_email: params.learnerEmail,
    metadata: { booking_id: params.bookingId },
  });
}

export async function capturePaymentIntent(paymentIntentId: string) {
  const stripe = getStripe();
  return stripe.paymentIntents.capture(paymentIntentId);
}

export async function cancelPaymentIntent(paymentIntentId: string) {
  const stripe = getStripe();
  return stripe.paymentIntents.cancel(paymentIntentId);
}

export async function getStripeBalanceSummary() {
  const stripe = getStripe();
  const balance = await stripe.balance.retrieve();
  return balance;
}
