/**
 * @fileoverview Twilio SMS Client
 *
 * Twilio integration is handled in the @repo/auth package.
 * This file is kept for potential future client-side SMS utilities.
 *
 * @module lib/services/sms/twilio
 *
 * @see {@link @repo/auth} for server-side SMS configuration
 */

// ==========================================
// Note
// ==========================================

/**
 * Twilio SMS integration is configured in the shared @repo/auth package
 * where it's used for phone number authentication OTP delivery.
 *
 * The server-side Twilio client is initialized with:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER
 *
 * If you need client-side SMS utilities (e.g., phone number formatting),
 * add them here.
 */

// Re-export nothing for now - SMS is handled server-side
export {};
