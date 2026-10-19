import { siteSettings } from './siteSettings';
import { instagramAuth } from './instagramAuth';
import { homepage, pill, ctaButton } from './homepage';
import { page } from './page';
import { post } from './post';
import { moment } from './moment';
import { ourStoryPage } from './ourStoryPage';
import { blockContent, link, anchor } from './blockContent';
import { titleSection, bodyCopy, videoEmbed, singleImage, imageSlider, gridCopy, htmlEmbed, contactForm, instagramReels } from './sections';
import {
  localeString,
  localeText,
  outreachFeature,
  outreachPoint,
  faqItem,
  nutritionBoxPage,
  partnerOutreachPage,
} from './outreachPages';

export const schemaTypes = [
  // Shared rich text — must come before any type that references it (e.g. `pill`'s body
  // block below uses the named `link` annotation), since types are resolved in list order.
  link,
  anchor,
  blockContent,
  // English / Spanish pairs and the pieces the Nutrition Box pages share
  localeString,
  localeText,
  outreachFeature,
  outreachPoint,
  faqItem,
  // Documents
  siteSettings,
  homepage,
  page,
  post,
  ourStoryPage,
  moment,
  nutritionBoxPage,
  partnerOutreachPage,
  // Objects
  pill,
  ctaButton,
  // Page-builder sections
  titleSection,
  bodyCopy,
  videoEmbed,
  singleImage,
  imageSlider,
  gridCopy,
  htmlEmbed,
  contactForm,
  instagramReels,
  // System documents (written by code, not editors)
  instagramAuth,
];
