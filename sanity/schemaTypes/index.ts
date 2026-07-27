import { siteSettings } from './siteSettings';
import { homepage, pill, ctaButton } from './homepage';
import { page } from './page';
import { moment } from './moment';
import { ourStoryPage } from './ourStoryPage';

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
];
