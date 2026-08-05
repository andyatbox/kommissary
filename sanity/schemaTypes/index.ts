import { siteSettings } from './siteSettings';
import { homepage, pill, ctaButton } from './homepage';
import { page } from './page';
import { post } from './post';
import { moment } from './moment';
import { ourStoryPage } from './ourStoryPage';
import { blockContent, link, anchor } from './blockContent';
import { bodyCopy, videoEmbed, imageSlider, gridCopy, htmlEmbed, contactForm } from './sections';

export const schemaTypes = [
  // Shared rich text — must come before any type that references it (e.g. `pill`'s body
  // block below uses the named `link` annotation), since types are resolved in list order.
  link,
  anchor,
  blockContent,
  // Documents
  siteSettings,
  homepage,
  page,
  post,
  ourStoryPage,
  moment,
  // Objects
  pill,
  ctaButton,
  // Page-builder sections
  bodyCopy,
  videoEmbed,
  imageSlider,
  gridCopy,
  htmlEmbed,
  contactForm,
];
