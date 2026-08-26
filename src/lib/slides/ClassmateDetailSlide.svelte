<script>
	import WorkDetail from './work/WorkDetail.svelte';

	// Placeholder strip — Multiply's screens, standing in until Classmate's own
	// are exported.
	const shots = [1, 2, 3, 4, 5].map((n) => ({
		src: `/work/multiply/multiply_screenshot_${n}.webp`,
		alt: ''
	}));

	// TODO — carried over from the old placeholder slide; needs confirming.
	/** @type {[string, string][]} */
	const info = [
		['When', 'Aug 2024 – May 2026'],
		['Role', 'Founder'],
		['Team', 'Just me :)'],
		['Skills', 'Brand, Design, Development']
	];
</script>

<WorkDetail name="Classmate" theme="light" {shots} {info} goal="TODO — Classmate's goal, in the shape of Multiply's." />
