/** Both windows of a presentation talk over this. */
export const CHANNEL = 'f26-present';

/**
 * The join protocol, kept apart from the reactive state so it can be tested
 * without a browser. See `present-channel.test.js`.
 *
 * The rule that matters: **a window that has just opened does not know where
 * the show is, so it asks.** It never announces an index of its own. The
 * presenter window starts life at slide 1 like any other document, and if it
 * announced that on join it would drag a show already in progress back to the
 * beginning — which is exactly what it used to do.
 *
 * Only the stage — the window the show is actually running in — announces, and
 * only it answers `hello`. Once the show is going, either window may drive it:
 * a `go()` is a deliberate move, not a stale opinion, so both sides accept it.
 *
 * Ordering is not a factor. The presenter window is opened before the stage has
 * navigated, so its `hello` usually arrives before anyone is listening; the
 * stage's announcement on connect is what brings it into step.
 *
 * @param {{
 *   stage?: boolean,
 *   index: () => number,
 *   setIndex: (index: number) => void,
 *   onexit?: () => void,
 *   Channel?: typeof BroadcastChannel,
 *   name?: string
 * }} options
 */
export function join({
	stage = false,
	index,
	setIndex,
	onexit,
	Channel = BroadcastChannel,
	name = CHANNEL
}) {
	const channel = new Channel(name);

	channel.onmessage = (/** @type {MessageEvent} */ { data }) => {
		if (data?.type === 'index') setIndex(data.index);
		else if (data?.type === 'exit') onexit?.();
		else if (data?.type === 'hello' && stage) announce();
	};

	function announce() {
		channel.postMessage({ type: 'index', index: index() });
	}

	if (stage) announce();
	else channel.postMessage({ type: 'hello' });

	return {
		/** @param {Record<string, unknown>} message */
		post(message) {
			channel.postMessage(message);
		},
		close() {
			channel.close();
		}
	};
}
