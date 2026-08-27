<script>
	import WorkDetail from './work/WorkDetail.svelte';

	// Wide, narrow, wide, narrow, wide — the strip alternates a full screen with
	// a phone so it reads as a reel rather than a row of the same shape.
	const shots = [
		{ src: '/work/classmate/classmate_screenshot_1.webp', alt: 'Marketing page — “Elevate your writing with AI, while keeping it human”.' },
		{ src: '/work/classmate/classmate_screenshot_2.webp', alt: 'A student’s documents on mobile, each card tagged by writing type.' },
		{ src: '/work/classmate/classmate_screenshot_3.webp', alt: 'Get Feedback — pasting the writing and its prompt, step two of three.' },
		{ src: '/work/classmate/classmate_screenshot_4.webp', alt: 'Feedback cards on mobile, over the essay they point at.' },
		{ src: '/work/classmate/classmate_screenshot_5.webp', alt: 'An essay with its feedback rail — every note anchored to a passage.' }
	];

	// TODO — carried over from the old placeholder slide; needs confirming.
	/** @type {[string, string][]} */
	const info = [
		['When', 'Aug 2024 – May 2026'],
		['Role', 'Founder'],
		['Team', 'Just me :)'],
		['Skills', 'Brand, Design, Development']
	];
</script>

<WorkDetail name="Classmate" theme="light" {shots} {info} goal="With the rise of AI, students are starting to use it to do their writing for them. Classmate aims to helps students use AI to gain valuable inline comments and feedback, similar to what a peer or tutor might give, helping them use AI to empower their writing instead of replace it." />
