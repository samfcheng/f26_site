<script>
	import WorkDetail from './work/WorkDetail.svelte';

	const shots = [
		{ src: '/work/multiply/multiply_screenshot_1.webp', alt: 'Processing pipeline, grouped by stage.' },
		{ src: '/work/multiply/multiply_screenshot_2.webp', alt: 'A loan on mobile, with its activity log.' },
		{ src: '/work/multiply/multiply_screenshot_3.webp', alt: 'Manage loans — users and prospects.' },
		{ src: '/work/multiply/multiply_screenshot_4.webp', alt: 'The command centre on mobile.' },
		{ src: '/work/multiply/multiply_screenshot_5.webp', alt: 'Processing, as a status table.' }
	];

	/** @type {[string, string][]} */
	const info = [
		['When', 'Summer 2026'],
		['Role', 'Design Intern'],
		['Team', 'PM, Engineering Team, & one other designer'],
		['Skills', 'Design, UI/UX, Prototyping']
	];
</script>

<WorkDetail
	name="Multiply"
	{shots}
	{info}
	goal="Help make the process of getting a mortgage smoother both through the perspective of the person getting a mortgage and the loan officer helping to facilitate one."
/>
