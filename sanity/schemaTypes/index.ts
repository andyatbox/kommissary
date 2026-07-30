import { siteSettings } from './siteSettings';
import { homepage, pill, ctaButton } from './homepage';
import { page } from './page';
import { moment } from './moment';
import { ourStoryPage } from './ourStoryPage';
import { blockContent } from './blockContent';
import { bodyCopy, videoEmbed, imageSlider, gridCopy, htmlEmbed } from './sections';

export const schemaTypes = [
  // Documents
  siteSettings,
  homepage,
  page,
  ourStoryPage,
  moment,
  // Objects
  pill,
  ctaButton,
  // Page-builder sections + shared rich text
  blockContent,
  bodyCopy,
  videoEmbed,
  imageSlider,
  gridCopy,
  htmlEmbed,
];
