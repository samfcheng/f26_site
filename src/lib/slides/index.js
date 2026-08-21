import TitleSlide from './TitleSlide.svelte';
import AboutSlide from './AboutSlide.svelte';
import WorkSlide from './WorkSlide.svelte';
import WorkKleinerSlide from './WorkKleinerSlide.svelte';
import WorkMultiplySlide from './WorkMultiplySlide.svelte';
import WorkOracleSlide from './WorkOracleSlide.svelte';
import PlaySlide from './PlaySlide.svelte';
import PlayTypeSlide from './PlayTypeSlide.svelte';
import PlayMotionSlide from './PlayMotionSlide.svelte';
import WritingSlide from './WritingSlide.svelte';
import ContactSlide from './ContactSlide.svelte';

/**
 * The deck. A slide is `{ id, title, component, notes, children? }`.
 * Slides with `children` are parents — their sub-slides can be collapsed,
 * which stacks them behind the parent in both the deck and the sidebar.
 *
 * @typedef {{ id: string, title: string, component: import('svelte').Component, notes?: string, children?: Slide[] }} Slide
 * @type {Slide[]}
 */
export const slides = [
	{ id: 'title', title: 'Sam Cheng', component: TitleSlide, notes: 'Open with the name. Keep it short — say hello, then move on.' },
	{ id: 'about', title: 'About', component: AboutSlide, notes: 'Two sentences on who I am and what I\'m doing at USC right now.' },
	{
		id: 'work',
		title: 'Selected work',
		component: WorkSlide,
		notes: 'Frame the work section. Three projects, roughly two minutes each.',
		children: [
			{ id: 'work-kleiner', title: 'Kleiner Perkins', component: WorkKleinerSlide, notes: 'What the fellowship was, what I shipped, what I learned.' },
			{ id: 'work-multiply', title: 'Multiply', component: WorkMultiplySlide, notes: 'The design system work and why it mattered to the team.' },
			{ id: 'work-oracle', title: 'Oracle', component: WorkOracleSlide, notes: 'Scope, constraints, and the one decision I would make differently.' }
		]
	},
	{
		id: 'play',
		title: 'Play & experiments',
		component: PlaySlide,
		notes: 'Lighter section — the things I make when nobody is briefing me.',
		children: [
			{ id: 'play-type', title: 'Type studies', component: PlayTypeSlide, notes: 'Type experiments. Show the process, not just the outcome.' },
			{ id: 'play-motion', title: 'Motion studies', component: PlayMotionSlide, notes: 'Motion studies. Talk about timing and easing choices.' }
		]
	},
	{ id: 'writing', title: 'Notes & writing', component: WritingSlide, notes: 'What I write about and why it feeds the design work.' },
	{ id: 'contact', title: 'Say hello', component: ContactSlide, notes: 'Close: how to reach me, and an invitation to keep talking.' }
];

/** Every slide in presentation order — sub-slides included, collapse ignored. */
export const flatSlides = slides.flatMap((slide) => [slide, ...(slide.children ?? [])]);
