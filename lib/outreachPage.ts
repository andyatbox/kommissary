import { client } from '@/sanity/lib/client';

/**
 * The Sanity document for a Nutrition Box lead page (nutritionBoxPage, educatorPage or
 * dycdPage; see sanity/schemaTypes/outreachPages.ts), or null when there is none or
 * Sanity can't be reached. Null is fine: the page then shows its built-in copy.
 */
export type OutreachDoc = Record<string, unknown> & { seo?: { title?: string; description?: string } };

export async function getOutreachDoc(id: string): Promise<OutreachDoc | null> {
  try {
    return await client.fetch<OutreachDoc | null>('*[_id == $id][0]', { id });
  } catch {
    return null;
  }
}
