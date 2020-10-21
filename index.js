const {
	Worker,
	isMainThread,
	parentPort,
	workerData
} = require('worker_threads');
const callsites = require('callsites');
const pkgDir = require('pkg-dir');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { EventEmitter } = require('events');

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

function inWorkerThread({ workerId, task }) {
	// This is necessary, because a single file would
	// start multiple listeners otherwise.
	if (workerData.workerId !== workerId) return;

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
}

let fileCallCount = {};

class ThreadPool extends EventEmitter {
	#workers;
	#available;
	#queue = [];
	#promises = [];

	/**
	 * Determines if you're currently running in the main or thread context
	 * @type {boolean}
	 * */
	isMainThread = isMainThread;

	/**
	 * Create a thread pool that runs a specific function
	 * 
	 * @param {ThreadPoolArgs}
	 */
	constructor({ task, size }) {
		super();

		size = size || os.cpus().length;
		const workers = [];
		const callsite = callsites()[1];
		const line = callsite.getLineNumber();
		const column = callsite.getColumnNumber();

		let filename = callsite.getFileName();
		let workerId = `${filename}[${line}][${column}]`;

		const tsCacheDirectory = process.env.TS_NODE_DEV_CACHE &&
			path.join(process.env.TS_NODE_DEV_CACHE, 'compiled');

		let isTsNodeDev = false;

		if (
			(isMainThread && process.env.TS_NODE_DEV && path.extname(filename) === '.ts') ||
			(workerData && workerData.isTsNodeDev)
		) {
			isTsNodeDev = true;
			
			if (!tsCacheDirectory) {
				throw new Error(
					'To use ts-node-dev with threadwork, TS_NODE_DEV_CACHE must be defined and match the cache-directory argument to ts-node-dev'
				);
			}

			const packageDir = pkgDir.sync();
			const prefix = path.relative(packageDir, filename).replace(/[^\w]/g, '_');

			// Loop through all files in the directory looking for the right one
			let newestTime = 0;

			for (const file of fs.readdirSync(tsCacheDirectory)) {
				if (file.startsWith(prefix) && path.extname(file) === '.js') {
					const fullPath = path.join(packageDir, tsCacheDirectory, file);
					const stat = fs.statSync(fullPath);
					if (stat.birthtimeMs > newestTime) {
						newestTime = stat.birthtimeMs;
						filename = fullPath;
					}
				}
			}

			fileCallCount[filename] = fileCallCount[filename] || 0;
			fileCallCount[filename]++;

			workerId = `${filename}[${fileCallCount[filename]}]`;
		}

		// If it's a worker thread
		if (!isMainThread) return inWorkerThread({ workerId, task });
		
		// Main creates a pool of workers
		for (let i = 0; i < size; i++) {

			const worker = new Worker(filename, { workerData: { workerId, isTsNodeDev }});
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

	/**
	 * Create a thread pool that runs a specific function
	 * 
	 * @param {...any} args - Arguments passed to the configured task.
	 * @returns {Promise<any>}
	 */
	async run(...args) {
		if (!isMainThread) {
			throw new Error('Cannot call `Pool.run` from thread');
		}

		// Force the call to be async
		await wait();

		if (!this.#available.length) {
			return new Promise((res, rej) => {
				this.#queue.push(async () => {
					try {
						res(await this.#available.pop().run(args));
					} catch (e) { rej(e); }
				});
			});
		}

		return this.#available.pop().run(args);
	}

	/**
	 * Queue several functions
	 * 
	 * @param {function} fn - Function to queue
	 * @returns {Promise<any>}
	 */
	queue(fn) {
		this.#promises.push(fn());
	}

	/**
	 * Wait until the queue is empty
	 * @returns {Promise<any>}
	 */
	async wait() {
		await Promise.all(this.#promises);
		this.#promises = [];
	}

	/**
	 * Wait until the queue is empty, then terminate all listeners
	 * @returns {Promise<any>}
	 */
	async close() {
		await this.wait();

		for (const worker of this.#workers) {
			worker.postMessage('stop');
			worker.removeAllListeners();
			worker.terminate();
			worker.unref();
		}
		this.removeAllListeners();
	}
}

module.exports = {
	ThreadPool
};

/**
 * @typedef ThreadPoolArgs
 * @type {object}
 * @property {function} task - Function to run in each thread.
 * @property {number} [size] - Number of threads
 */
