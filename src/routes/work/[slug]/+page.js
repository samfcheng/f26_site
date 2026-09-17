import { error } from '@sveltejs/kit';
import { projects } from '$lib/projects.js';
export function load({ params }) {
  const project = projects.find(project => project.slug === params.slug);
  if (!project) error(404, 'Project not found');
  return { project };
}
export const prerender = true;
export function entries() { return projects.map(({ slug }) => ({ slug })); }
