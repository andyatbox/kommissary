import { siteSettings } from './siteSettings';
import { homepage, pill, ctaButton } from './homepage';
import { page } from './page';
import { post } from './post';
import { moment } from './moment';
import { ourStoryPage } from './ourStoryPage';
import { blockContent, link } from './blockContent';
import { bodyCopy, videoEmbed, imageSlider, gridCopy, htmlEmbed } from './sections';

export const schemaTypes = [
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
  // Page-builder sections + shared rich text
  link,
  blockContent,
  bodyCopy,
  videoEmbed,
  imageSlider,
  gridCopy,
  htmlEmbed,
];
