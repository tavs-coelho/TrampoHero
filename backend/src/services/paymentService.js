/**
 * Payment service – wraps Stripe API calls for TrampoHero's payment flows:
 *   1. Escrow (payment held until job completion)
 *   2. Hero Prime subscription (R$ 29.90 / month)
 *   3. Fee calculation and escrow release (2.5% free freelancer, 1.5% employer)
 */

import Stripe from 'stripe';
import { env } from '../config/env.js';

// Fee rates (expressed as decimals)
export const FEE_FREELANCER_FREE = 0.025; // 2.5%
export const FEE_EMPLOYER = 0.015;        // 1.5%

// Hero Prime monthly price in BRL cents
export const HERO_PRIME_PRICE_CENTS = 2990; // R$ 29.90

function getStripe() {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' });
}

/**
 * Calculate the platform fee for a given amount.
 * @param {number} amountCents  - gross amount in BRL cents
 * @param {'freelancer_free'|'employer'} feeType
 * @returns {{ feeAmountCents: number, netAmountCents: number }}
 */
export function calculateFee(amountCents, feeType) {
  const rate = feeType === 'employer' ? FEE_EMPLOYER : FEE_FREELANCER_FREE;
  const feeAmountCents = Math.round(amountCents * rate);
  const netAmountCents = amountCents - feeAmountCents;
  return { feeAmountCents, netAmountCents };
}

/**
 * Create or retrieve a Stripe Customer for a user.
 * @param {{ email: string, name: string }} user
 * @returns {Promise<string>} stripeCustomerId
 */
export async function getOrCreateCustomer(user) {
  const stripe = getStripe();

  if (user.subscription?.stripeCustomerId) {
    return user.subscription.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: user._id.toString() },
  });

  return customer.id;
}

/**
 * Create a Stripe PaymentIntent for a wallet top-up (automatic capture).
 * The client_secret is returned to the frontend to complete payment via Stripe.js.
 *
 * @param {{ amountCents: number, userId: string, description: string }} opts
 * @returns {Promise<import('stripe').Stripe.PaymentIntent>}
 */
export async function createPaymentIntent({ amountCents, userId, description }) {
  const stripe = getStripe();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'brl',
    description,
    metadata: {
      userId,
      type: 'wallet_deposit',
    },
  });

  return paymentIntent;
}

/**
 * The payment is authorized but not captured until the job is completed.
 *
 * @param {{ amountCents: number, employerId: string, jobId: string, description: string }} opts
 * @returns {Promise<import('stripe').Stripe.PaymentIntent>}
 */
export async function createEscrowPaymentIntent({ amountCents, employerId, jobId, description }) {
  const stripe = getStripe();

  // Employer fee is charged on top
  const { feeAmountCents } = calculateFee(amountCents, 'employer');
  const totalCents = amountCents + feeAmountCents;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: 'brl',
    capture_method: 'manual',
    description,
    metadata: {
      jobId,
      employerId,
      type: 'escrow',
      feeAmountCents: String(feeAmountCents),
      jobAmountCents: String(amountCents),
    },
  });

  return paymentIntent;
}

/**
 * Capture a previously authorized escrow PaymentIntent (job completed).
 * After capture, calculates the freelancer fee and returns net amounts.
 *
 * @param {{ paymentIntentId: string, jobAmountCents: number, freelancerIsPrime: boolean }} opts
 * @returns {Promise<{ capturedIntent: import('stripe').Stripe.PaymentIntent, freelancerNet: number, platformFee: number }>}
 */
export async function releaseEscrow({ paymentIntentId, jobAmountCents, freelancerIsPrime }) {
  const stripe = getStripe();

  const capturedIntent = await stripe.paymentIntents.capture(paymentIntentId);

  // Freelancers on Hero Prime pay no service fee
  const feeType = freelancerIsPrime ? null : 'freelancer_free';
  const { feeAmountCents, netAmountCents } = feeType
    ? calculateFee(jobAmountCents, feeType)
    : { feeAmountCents: 0, netAmountCents: jobAmountCents };

  return {
    capturedIntent,
    freelancerNetCents: netAmountCents,
    platformFeeCents: feeAmountCents,
  };
}

/**
 * Cancel (refund) an escrow PaymentIntent (job cancelled before capture).
 *
 * @param {string} paymentIntentId
 * @returns {Promise<import('stripe').Stripe.PaymentIntent>}
 */
export async function cancelEscrow(paymentIntentId) {
  const stripe = getStripe();
  return stripe.paymentIntents.cancel(paymentIntentId);
}

/**
 * Create a Stripe Checkout Session for Hero Prime subscription.
 * Prices are created on-the-fly as inline price data to avoid requiring a
 * pre-configured Stripe product/price ID.
 *
 * @param {{ stripeCustomerId: string, userId: string, successUrl: string, cancelUrl: string }} opts
 * @returns {Promise<import('stripe').Stripe.Checkout.Session>}
 */
export async function createSubscriptionCheckoutSession({ stripeCustomerId, userId, successUrl, cancelUrl }) {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [{
      price_data: {
        currency: 'brl',
        product_data: {
          name: 'Hero Prime',
          description: 'Assinatura mensal Hero Prime – sem taxas de serviço + benefícios exclusivos',
        },
        unit_amount: HERO_PRIME_PRICE_CENTS,
        recurring: { interval: 'month' },
      },
      quantity: 1,
    }],
    metadata: { userId },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

/**
 * Cancel an active Hero Prime subscription.
 *
 * @param {string} stripeSubscriptionId
 * @returns {Promise<import('stripe').Stripe.Subscription>}
 */
export async function cancelSubscription(stripeSubscriptionId) {
  const stripe = getStripe();
  return stripe.subscriptions.cancel(stripeSubscriptionId);
}

/**
 * Construct and verify a Stripe webhook event.
 *
 * @param {Buffer} rawBody
 * @param {string} signature
 * @returns {import('stripe').Stripe.Event}
 */
export function constructWebhookEvent(rawBody, signature) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
}
