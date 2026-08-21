<script>
	/**
	 * Agentation ships as a React component, so we mount it into a detached
	 * React root. Dev-only: everything is dynamically imported, so React and
	 * Agentation never reach the production bundle.
	 */
	let container = $state();

	$effect(() => {
		if (!container || !import.meta.env.DEV) return;

		let root;
		let cancelled = false;

		(async () => {
			const [React, ReactDOM, { Agentation }] = await Promise.all([
				import('react'),
				import('react-dom/client'),
				import('agentation')
			]);
			if (cancelled) return;
			root = ReactDOM.createRoot(container);
			root.render(React.createElement(Agentation, { endpoint: 'http://localhost:4747' }));
		})();

		return () => {
			cancelled = true;
			const current = root;
			// Defer: React refuses to unmount synchronously mid-render.
			if (current) setTimeout(() => current.unmount(), 0);
		};
	});
</script>

<div bind:this={container}></div>
