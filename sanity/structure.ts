import type { StructureResolver } from 'sanity/structure';

/**
 * Show the three singletons (Homepage, Navigation, Site Settings) as single fixed
 * documents rather than "create new" lists.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Homepage')
        .id('homepage')
        .child(S.document().schemaType('homepage').documentId('homepage')),
      S.listItem()
        .title('Site Settings')
        .id('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.divider(),
      // Pages drive the header nav (via each page's Navigation fields).
      S.documentTypeListItem('page').title('Pages'),
    ]);
