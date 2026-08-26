<script>
	import WorkDetail from './work/WorkDetail.svelte';

	// Placeholder strip — Multiply's screens, standing in until Olos's own are
	// exported.
	const shots = [1, 2, 3, 4, 5].map((n) => ({
		src: `/work/multiply/multiply_screenshot_${n}.webp`,
		alt: ''
	}));

	// TODO — carried over from the old placeholder slide; needs confirming.
	/** @type {[string, string][]} */
	const info = [
		['When', 'Sep 2025 – Dec 2026'],
		['Role', 'Founding Designer'],
		['Team', 'Two other sales/business co-founders'],
		['Skills', 'Brand, Design, Development']
	];
</script>

<WorkDetail name="Olos" {shots} {info} goal="TODO — Olos's goal, in the shape of Multiply's." />
