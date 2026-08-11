import crypto from 'node:crypto';
import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId } from '@/sanity/env';

/**
 * Storage for the Instagram access token, which expires 60 days after it's issued and
 * has to be periodically refreshed for a new one (see /api/instagram/refresh).
 *
 * The refreshed token can't live in an env var — those are fixed at build time and a
 * running deployment can't rewrite its own. So it's kept in Sanity instead, which this
 * project already has.
 *
 * BUT the dataset is publicly readable (anyone can query it unauthenticated), so the
 * token is encrypted before it's stored. What's public is ciphertext; the key lives in
 * INSTAGRAM_TOKEN_KEY, server-side only. Losing that key just means re-running the
 * connect flow — it can't leak the account.
 */

const DOC_ID = 'instagramAuth';
const KEY_HEX = process.env.INSTAGRAM_TOKEN_KEY ?? '';
/** The originally-issued token. Used until the first refresh writes one to Sanity, and
 *  as a fallback if storage is unavailable, so the feed never hard-fails. */
const ENV_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN ?? '';

const readClient = createClient({ projectId, dataset, apiVersion, useCdn: false });

function writeClient() {
  const token = process.env.SANITY_WRITE_TOKEN;
  if (!token) return null;
  return createClient({ projectId, dataset, apiVersion, useCdn: false, token });
}

function key(): Buffer | null {
  if (!/^[0-9a-f]{64}$/i.test(KEY_HEX)) return null;
  return Buffer.from(KEY_HEX, 'hex');
}

/** AES-256-GCM. Output is iv | authTag | ciphertext, base64. */
export function encrypt(plain: string): string | null {
  const k = key();
  if (!k) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', k, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ct]).toString('base64');
}

export function decrypt(payload: string): string | null {
  const k = key();
  if (!k) return null;
  try {
    const raw = Buffer.from(payload, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', k, raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

type StoredAuth = { ciphertext?: string; expiresAt?: string };

/** The token to call the API with: the refreshed one if we have it, else the env one. */
export async function getAccessToken(): Promise<string> {
  try {
    const stored = await readClient.fetch<StoredAuth | null>(
      `*[_id == $id][0]{ ciphertext, expiresAt }`,
      { id: DOC_ID },
      // Cached so a page render doesn't pay for a Sanity round trip every time.
      { next: { revalidate: 600 } }
    );
    const plain = stored?.ciphertext ? decrypt(stored.ciphertext) : null;
    if (plain) return plain;
  } catch (err) {
    console.error('Could not read the stored Instagram token:', err);
  }
  return ENV_TOKEN;
}

/** Persist a freshly refreshed token. Returns false if storage isn't configured. */
export async function saveAccessToken(token: string, expiresInSeconds: number): Promise<boolean> {
  const client = writeClient();
  if (!client) {
    console.error('SANITY_WRITE_TOKEN is not set — cannot persist the refreshed token.');
    return false;
  }
  const ciphertext = encrypt(token);
  if (!ciphertext) {
    console.error('INSTAGRAM_TOKEN_KEY is missing or malformed — refusing to store in plaintext.');
    return false;
  }
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  await client.createOrReplace({
    _id: DOC_ID,
    _type: 'instagramAuth',
    ciphertext,
    expiresAt,
    refreshedAt: new Date().toISOString(),
  });
  return true;
}

/** When the stored token runs out — for the health check. Null if nothing stored yet. */
export async function getExpiry(): Promise<string | null> {
  try {
    const stored = await readClient.fetch<StoredAuth | null>(
      `*[_id == $id][0]{ expiresAt }`,
      { id: DOC_ID },
      { next: { revalidate: 60 } }
    );
    return stored?.expiresAt ?? null;
  } catch {
    return null;
  }
}
