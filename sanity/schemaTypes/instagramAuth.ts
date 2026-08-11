import { defineField, defineType } from 'sanity';

/**
 * Storage for the refreshed Instagram access token. Written by /api/instagram/refresh,
 * never by hand — it's listed in the schema only so the document is valid and its expiry
 * can be inspected.
 *
 * The token is stored encrypted: this dataset is publicly readable, so the plaintext
 * would otherwise be exposed to anyone who queried it. See lib/instagram/token.ts.
 */
export const instagramAuth = defineType({
  name: 'instagramAuth',
  title: 'Instagram Auth (system)',
  type: 'document',
  readOnly: true,
  fields: [
    defineField({
      name: 'ciphertext',
      title: 'Encrypted token',
      type: 'string',
      description: 'AES-256-GCM. Useless without INSTAGRAM_TOKEN_KEY, which is server-side only.',
    }),
    defineField({ name: 'expiresAt', title: 'Expires at', type: 'datetime' }),
    defineField({ name: 'refreshedAt', title: 'Last refreshed', type: 'datetime' }),
  ],
  preview: {
    select: { expiresAt: 'expiresAt' },
    prepare: ({ expiresAt }) => ({
      title: 'Instagram Auth (system)',
      subtitle: expiresAt ? `Expires ${new Date(expiresAt).toDateString()}` : 'Not yet refreshed',
    }),
  },
});
