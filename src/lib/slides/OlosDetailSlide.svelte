<script>
	import WorkDetail from './work/WorkDetail.svelte';

	// Wide, narrow, wide, narrow, wide — the strip alternates a full screen with
	// a phone so it reads as a reel rather than a row of the same shape.
	const shots = [
		{ src: '/work/olos/olos_screenshot_1.webp', alt: 'The invite: a therapist asks a client to fill out a pre-visit journal.' },
		{ src: '/work/olos/olos_screenshot_2.webp', alt: 'The session transcript on mobile, timestamped line by line.' },
		{ src: '/work/olos/olos_screenshot_3.webp', alt: 'The Olos team on stage with the Judges’ Choice award at USC Marshall.' },
		{ src: '/work/olos/olos_screenshot_4.webp', alt: 'A client summary on mobile, opening on who the session is about.' },
		{ src: '/work/olos/olos_screenshot_5.webp', alt: 'Client summary — the client, what came up, and what to discuss.' }
	];

	// TODO — carried over from the old placeholder slide; needs confirming.
	/** @type {[string, string][]} */
	const info = [
		['When', 'Sep 2025 – Dec 2026'],
		['Role', 'Founding Designer'],
		['Team', 'Two other sales/business co-founders'],
		['Skills', 'Brand, Design, Development']
	];
</script>

<WorkDetail name="Olos" {shots} {info} goal="Olos aims to make health practitioner's lives easier through a pre-session analysis tool that records a voice note from the patient before the appointment. The practitioner then gets a preview of all of the context about a patient, and what they want to discuss." />
