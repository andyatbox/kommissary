/**
 * Shared contact-form constants. Imported by both the form UI and the API route so the
 * dropdown a visitor sees and the values the server accepts can never drift apart.
 *
 * These MUST match the Google Form's "Reason for contact" dropdown exactly — Google
 * silently discards a value that isn't one of its own options.
 */
export const REASONS = [
  'General',
  'RFP / Bid',
  'Partnership',
  'Event',
  'Meal tasting',
  'Media inquiry',
  'DOE ordering',
] as const;

export type ContactReason = (typeof REASONS)[number];
