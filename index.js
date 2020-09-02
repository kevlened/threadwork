const {
	Worker,
	isMainThread,
	parentPort
} = require('worker_threads');
const callsites = require('callsites');
const os = require('os');
const { EventEmitter } = require('events');

const filesWithPool = new Set();

async function event(emitter, name) {
	return new Promise(res => {
		const cb = arg => {
			emitter.off(name, cb);
			res(arg);
		};
		emitter.on(name, cb);
	});
}

async function wait(ms = 0) {
	return new Promise(res => setTimeout(res, ms));
}

class ThreadPool extends EventEmitter {
	#workers;
	#available;
	#queue = [];
	isMainThread = isMainThread;

	constructor({ task, size } = {}) {
		super();

		// If it's a worker thread
		if (!isMainThread) {
			// Listen for args from main
			parentPort.on('message', async (args) => {
				if (args === 'stop') {
					parentPort.removeAllListeners();
					return;
				}

				let result, err;
				try {
					result = await task(...args);
				} catch (e) {
					err = e;
				}
				// Send results to main
				parentPort.postMessage({ result, err });
			});
			return;
		}

		size = size || os.cpus().length;
		const workers = [];
		const filename = callsites()[1].getFileName();
		if (filesWithPool.has(filename)) {
			throw new Error(`${filename} should only define one Pool`);
		}
		filesWithPool.add(filename);
		
		// Main creates a pool of workers
		for (let i = 0; i < size; i++) {

			const worker = new Worker(filename);
			worker.run = async args => {
				// Stage promise
				const promise = event(worker, 'finished');

				// Send args to worker
				worker.postMessage(args);
				const { result, err } = await promise;

				// Return worker to pool
				available.push(worker);

				if (err) {
					this.emit('error', err);
					throw err;
				}

				// If there are more items
				const next = this.#queue.shift();
				if (next) next();
				else if (available.length === workers.length) this.emit('idle');

				return result;
			};
			worker.on('message', out => {
				// Main processes results
				worker.emit('finished', out);
			});
			workers.push(worker);
		}

		const available = Array.from(workers);
		this.#available = available;
		this.#workers = workers;
	}

	async run(...args) {
		if (!isMainThread) {
			throw new Error('Cannot call `Pool.run` from thread');
		}

		if (!this.#available.length) {
			throw new Error('No workers available');
		}

		return this.#available.pop().run(args);
	}

	queue(fn) {
		if (!isMainThread) {
			throw new Error('Cannot call `Pool.queue` from thread');
		}

		// If we have idle workers, start
		if (this.#available.length) fn();

		// Add the function to the queue
		else this.#queue.push(fn);
	}

	async onIdle() {
		const promises = [
			event(this, 'idle'),
			event(this, 'error')
		];
		const e = await Promise.race(promises);

		// FIXME: fixes memory leak, but causes trouble if there
		//				are multiple onIdle listeners
		this.removeAllListeners();

		if (e) throw e;
	}

	async close() {
		await this.onIdle();
		for (const worker of this.#workers) {
			worker.postMessage('stop');
			worker.removeAllListeners();
		}
		this.removeAllListeners();
	}

	async all(args) {
		const results = [];
		for (let a = 0; a < args.length; a++) {
			this.queue(async () => {
				results[a] = await this.run(args[a]);
			});
		}
		await this.onIdle();
		return results;
	}
}

module.exports = {
	ThreadPool
};
