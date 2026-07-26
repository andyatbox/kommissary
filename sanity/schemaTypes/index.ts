import { siteSettings } from './siteSettings';
import { navigation, navMenu, navColumn, navHeading, navLink } from './navigation';
import { homepage, pill, ctaButton } from './homepage';
import { page } from './page';

export const schemaTypes = [
  // Documents
  siteSettings,
  navigation,
  homepage,
  page,
  // Objects
  navMenu,
  navColumn,
  navHeading,
  navLink,
  pill,
  ctaButton,
];
