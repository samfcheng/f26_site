import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from './present-channel.js';

/**
 * A stand-in for `BroadcastChannel`: same shape, same "everyone but me"
 * delivery, but synchronous, so a test reads in the order things happen.
 */
function createBus() {
	/** @type {Set<any>} */
	const open = new Set();

	return class FakeChannel {
		/** @param {string} name */
		constructor(name) {
			this.name = name;
			/** @type {((event: { data: any }) => void) | null} */
			this.onmessage = null;
			open.add(this);
		}

		/** @param {any} data */
		postMessage(data) {
			for (const other of open) {
				if (other !== this && other.name === this.name) other.onmessage?.({ data });
			}
		}

		close() {
			open.delete(this);
		}
	};
}

/**
 * One window: its own copy of the show's position, exactly as each document has
 * its own module state in the browser.
 *
 * @param {typeof BroadcastChannel} Channel
 * @param {{ stage?: boolean, index?: number }} [options]
 */
function open(Channel, { stage = false, index = 0 } = {}) {
	const window = { index, exited: false, link: /** @type {any} */ (null) };
	window.link = join({
		stage,
		Channel,
		index: () => window.index,
		setIndex: (next) => (window.index = next),
		onexit: () => (window.exited = true)
	});
	return window;
}

test('a presenter window joining does not drag the show back to the start', () => {
	const Channel = createBus();

	// The show is running on slide 6.
	const stage = open(Channel, { stage: true, index: 5 });

	// The presenter window opens fresh — it starts life at slide 1.
	const presenter = open(Channel);

	assert.equal(stage.index, 5, 'the stage stays where the show is');
	assert.equal(presenter.index, 5, 'the presenter catches up to the stage');
});

test('the presenter window opened before the stage still catches up', () => {
	const Channel = createBus();

	// `present()` opens the presenter window first and navigates the stage after,
	// so this is the ordering that actually happens.
	const presenter = open(Channel);
	assert.equal(presenter.index, 0, 'nobody has answered yet');

	const stage = open(Channel, { stage: true, index: 5 });

	assert.equal(presenter.index, 5, 'the stage announces on connect');
	assert.equal(stage.index, 5);
});

test('a presenter reloaded mid-show is told where the show is', () => {
	const Channel = createBus();
	const stage = open(Channel, { stage: true, index: 5 });
	const presenter = open(Channel);

	stage.link.post({ type: 'index', index: 7 });
	stage.index = 7;
	assert.equal(presenter.index, 7);

	presenter.link.close();
	const reloaded = open(Channel);

	assert.equal(reloaded.index, 7, 'asking on join gets the live position');
	assert.equal(stage.index, 7, 'and does not disturb the show');
});

test('either window can drive the show', () => {
	const Channel = createBus();
	const stage = open(Channel, { stage: true, index: 5 });
	const presenter = open(Channel);

	presenter.link.post({ type: 'index', index: 2 });
	assert.equal(stage.index, 2, 'a deliberate move from the presenter is accepted');

	stage.link.post({ type: 'index', index: 3 });
	assert.equal(presenter.index, 3);
});

test('ending the show reaches the other window', () => {
	const Channel = createBus();
	const stage = open(Channel, { stage: true, index: 5 });
	const presenter = open(Channel);

	stage.link.post({ type: 'exit' });

	assert.equal(presenter.exited, true);
	assert.equal(stage.exited, false, 'the sender does not hear itself');
});

test('a closed window is off the channel', () => {
	const Channel = createBus();
	const stage = open(Channel, { stage: true, index: 5 });
	const presenter = open(Channel);

	presenter.link.close();
	stage.link.post({ type: 'index', index: 9 });

	assert.equal(presenter.index, 5, 'no messages after close');
});
