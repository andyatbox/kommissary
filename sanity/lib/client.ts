import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId } from '../env';

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  // `useCdn` = fast cached reads for published content; set false for fresh/preview.
  useCdn: true,
});
