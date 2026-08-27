import TitleSlide from './TitleSlide.svelte';
import MultiplySlide from './MultiplySlide.svelte';
import MultiplyDetailSlide from './MultiplyDetailSlide.svelte';
import ClassmateSlide from './ClassmateSlide.svelte';
import ClassmateDetailSlide from './ClassmateDetailSlide.svelte';
import OlosSlide from './OlosSlide.svelte';
import OlosDetailSlide from './OlosDetailSlide.svelte';
import ContactSlide from './ContactSlide.svelte';

/**
 * The deck: a title, three projects — each with a case-study sub-slide — and a
 * closing slide. A slide is `{ id, title, component, notes, children? }`.
 * Slides with `children` are parents — their sub-slides can be collapsed,
 * which stacks them behind the parent in both the deck and the sidebar.
 *
 * `dark` is how the slide reads, not what is in it: a card on a dark slide has
 * to be ringed in light to show it sits above the one behind it, where the
 * deck's usual dark hairline disappears.
 *
 * @typedef {{ id: string, title: string, component: import('svelte').Component, notes?: string, dark?: boolean, children?: Slide[] }} Slide
 * @type {Slide[]}
 */
export const slides = [
	{
		id: 'title',
		title: 'Sam Cheng',
		component: TitleSlide,
		notes: 'Welcome to the speaker notes. This is the first slide. Here, I\'ll add some various notes on the decisions behind the portfolio and the projects. For this title slide, it\'s the same design as my previous portfolio. I\'m planning on redesigning this soon, and I love that the slides-based layout makes it feel much easier to edit and improve things in the future.'
	},
	{
		id: 'multiply',
		title: 'Multiply',
		component: MultiplySlide,
		notes: 'I worked at Multiply through the KP Fellowship in Summer 2026.',
		dark: true,
		children: [
			{
				id: 'multiply-detail',
				title: 'Multiply — case study',
				component: MultiplyDetailSlide,
				notes: 'Coming soon.',
				dark: true
			}
		]
	},
	{
		id: 'classmate',
		title: 'Classmate',
		component: ClassmateSlide,
		notes: 'Building and sharing Classmate was one of my most growth-oriented experiences. I learned so much and got so many opportunities out of building it.',
		children: [
			{
				id: 'classmate-detail',
				title: 'Classmate — case study',
				component: ClassmateDetailSlide,
				notes: 'Coming soon.'
			}
		]
	},
	{
		id: 'olos',
		title: 'Olos',
		component: OlosSlide,
		notes: 'Built for SEP\'s 10-week incubator. We presented at the end, and won demo day.',
		dark: true,
		children: [
			{
				id: 'olos-detail',
				title: 'Olos — case study',
				component: OlosDetailSlide,
				notes: 'Coming soon.',
				dark: true
			}
		]
	},
	{
		id: 'contact',
		title: 'Say hello',
		component: ContactSlide,
		notes: 'This slide is a placeholder for now - I\'m redesigning it soon.'
	}
];

/** Every slide in presentation order — sub-slides included, collapse ignored. */
export const flatSlides = slides.flatMap((slide) => [slide, ...(slide.children ?? [])]);

// A slide whose component came back `undefined` renders as an opaque
// "Cannot read properties of undefined (reading 'call')" from deep inside
// Svelte, with no clue which slide is at fault. Usually it means the dev
// server's module graph went stale after slides were added or removed, so say
// so by name rather than letting the show fail silently.
if (import.meta.env.DEV) {
	for (const slide of flatSlides) {
		if (!slide.component) {
			console.error(
				`[deck] Slide "${slide.id}" has no component. If you just added, renamed or ` +
					`removed a slide, restart the dev server (npm run dev) and hard-reload.`
			);
		}
	}
}
