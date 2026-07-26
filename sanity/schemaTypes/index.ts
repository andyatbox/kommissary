import { siteSettings } from './siteSettings';
import { navigation, navMenu, navColumn, navHeading, navLink } from './navigation';
import { homepage, pill } from './homepage';

export const schemaTypes = [
  // Documents
  siteSettings,
  navigation,
  homepage,
  // Objects
  navMenu,
  navColumn,
  navHeading,
  navLink,
  pill,
];
