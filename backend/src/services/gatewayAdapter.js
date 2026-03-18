/**
 * gatewayAdapter.js – Decoupled payment gateway abstraction for TrampoHero.
 *
 * This module exposes a single `gateway` object whose methods map to the
 * platform's payment operations. The underlying provider (currently Stripe)
 * is encapsulated here so that swapping to another provider (e.g. Asaas,
 * Pagar.me, Adyen) only requires updating this file – no route or service
 * code needs to change.
 *
 * Supported providers (set PAYMENT_GATEWAY_PROVIDER env var):
 *   • "stripe" (default) – uses the existing paymentService functions
 *
 * Future adapters can be added by implementing the same interface and
 * selecting them via PAYMENT_GATEWAY_PROVIDER.
 */

import {
  createPaymentIntent as stripeCreatePaymentIntent,
  createEscrowPaymentIntent as stripeCreateEscrowPaymentIntent,
  releaseEscrow as stripeReleaseEscrow,
  cancelEscrow as stripeCancelEscrow,
  createRefund as stripeCreateRefund,
  getOrCreateCustomer as stripeGetOrCreateCustomer,
  createSubscriptionCheckoutSession as stripeCreateSubscriptionCheckoutSession,
  cancelSubscription as stripeCancelSubscription,
  constructWebhookEvent as stripeConstructWebhookEvent,
} from './paymentService.js';

// ─── Stripe Adapter ───────────────────────────────────────────────────────────

const stripeAdapter = {
  providerName: 'stripe',

  /**
   * Create a payment intent for a wallet top-up.
   * @param {{ amountCents: number, userId: string, description: string }} opts
   */
  createPaymentIntent: (opts) => stripeCreatePaymentIntent(opts),

  /**
   * Create an escrow payment intent (manual capture).
   * @param {{ amountCents: number, employerId: string, jobId: string, description: string }} opts
   */
  createEscrowPaymentIntent: (opts) => stripeCreateEscrowPaymentIntent(opts),

  /**
   * Capture an escrow and calculate net/fee amounts.
   * @param {{ paymentIntentId: string, jobAmountCents: number, freelancerIsPrime: boolean }} opts
   */
  releaseEscrow: (opts) => stripeReleaseEscrow(opts),

  /**
   * Cancel (void) an uncaptured escrow payment intent.
   * @param {string} paymentIntentId
   */
  cancelEscrow: (paymentIntentId) => stripeCancelEscrow(paymentIntentId),

  /**
   * Issue a refund against a captured payment intent.
   * @param {{ paymentIntentId: string, amountCents?: number }} opts
   */
  createRefund: (opts) => stripeCreateRefund(opts),

  /**
   * Get or create a gateway customer record.
   * @param {{ email: string, name: string, subscription?: object }} user
   */
  getOrCreateCustomer: (user) => stripeGetOrCreateCustomer(user),

  /**
   * Create a subscription checkout session.
   * @param {{ stripeCustomerId: string, userId: string, successUrl: string, cancelUrl: string }} opts
   */
  createSubscriptionCheckoutSession: (opts) => stripeCreateSubscriptionCheckoutSession(opts),

  /**
   * Cancel an active subscription.
   * @param {string} subscriptionId
   */
  cancelSubscription: (subscriptionId) => stripeCancelSubscription(subscriptionId),

  /**
   * Verify and construct a webhook event from the raw body + signature.
   * @param {Buffer} rawBody
   * @param {string} signature
   */
  constructWebhookEvent: (rawBody, signature) => stripeConstructWebhookEvent(rawBody, signature),
};

// ─── Provider selection ───────────────────────────────────────────────────────

const PROVIDER = (process.env.PAYMENT_GATEWAY_PROVIDER ?? 'stripe').toLowerCase();

const adapters = {
  stripe: stripeAdapter,
  // future: asaas: asaasAdapter,
  // future: pagar_me: pagarMeAdapter,
};

if (!adapters[PROVIDER]) {
  throw new Error(
    `[gatewayAdapter] Unknown PAYMENT_GATEWAY_PROVIDER "${PROVIDER}". ` +
    `Supported: ${Object.keys(adapters).join(', ')}`
  );
}

/** @type {typeof stripeAdapter} */
export const gateway = adapters[PROVIDER];
export const gatewayProviderName = gateway.providerName;
