import type { StructureResolver } from 'sanity/structure';
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list';

/**
 * Homepage and Site Settings are singletons; Pages is a drag-orderable list whose
 * order drives the nav link order within each column.
 */
export const structure: StructureResolver = (S, context) =>
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
      // Pages drive the header nav (via each page's Navigation fields). Drag to
      // reorder — the list order sets link order within each nav column.
      orderableDocumentListDeskItem({ type: 'page', title: 'Pages', S, context }),
      // Kommissary Weekly blog posts, newest first (ordered by the Published date field).
      S.listItem()
        .title('Kommissary Weekly (Posts)')
        .id('posts')
        .child(
          S.documentTypeList('post')
            .title('Posts')
            .defaultOrdering([{ field: 'date', direction: 'desc' }])
        ),
      S.divider(),
      // Our Story (/our-story): the page-level content singleton + the drag-orderable
      // timeline moments whose order runs down the page.
      S.listItem()
        .title('Our Story Page')
        .id('ourStoryPage')
        .child(S.document().schemaType('ourStoryPage').documentId('ourStoryPage')),
      orderableDocumentListDeskItem({ type: 'moment', title: 'Timeline Moments', S, context }),
      S.divider(),
      // The Medicaid Nutrition Box lead pages: copy only, in English and Spanish. Their
      // forms live in code (each is tied to a Google Form). Fixed ids, read by the pages.
      S.listItem()
        .title('Nutrition Box (/bronx)')
        .id('nutritionBoxPage')
        .child(S.document().schemaType('nutritionBoxPage').documentId('nutritionBoxPage')),
      S.listItem()
        .title('Educators (/educator)')
        .id('educatorPage')
        .child(S.document().schemaType('partnerOutreachPage').documentId('educatorPage')),
      S.listItem()
        .title('Community Leaders (/dycd)')
        .id('dycdPage')
        .child(S.document().schemaType('partnerOutreachPage').documentId('dycdPage')),
    ]);
