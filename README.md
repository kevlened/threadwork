# needlework
Simple threading in Node.js

## Why
Existing threading solutions stringify both function and arguments, then pass them to the worker. The creates friction when using dependencies in workers. `needlework` skips stringifying the function by using a reference instead, making it easier to get started quickly.

## Example

```js
const { Pool } = require('needlework');

function fibonacci(n) {
	if (n < 2) return n;
	return fibonacci(n - 1) + fibonacci(n - 2);
}

// Pools must be instantiated at the top level
const pool = new Pool({ task: fibonacci });

(async () => {
	// This file is reevaluated in the worker thread
	// The pool can only be called in the main thread
	if (!pool.isMainThread) return;

	try {
		const results = await pool.all([100, 200, 300]);
		console.log(results);
	} catch (e) {
		console.log(e);
	}
})();
```

## Queueing

For more control, there's a queue

```js
const { Pool } = require('needlework');

function fibonacci(n) {
	if (n < 2) return n;
	return fibonacci(n - 1) + fibonacci(n - 2);
}

const pool = new Pool({ task: fibonacci });

(async () => {
	if (!pool.isMainThread) return;

	try {
		const results = [];
		for (const arg of [100, 200, 300]) {
			// Queue up an async function
			pool.queue(async () => {
				// Get the results of a single run
				const result = await pool.run(arg);
				results.push(result);
			});
		}
		await pool.onIdle();
		console.log(results);
	} catch (e) {
		console.log(e);
	}
})();
```

## API

* `new Pool({ task, size })` - The primary class. It should be instantiated at the top-level and only once per file.
	- `task` - The worker runs this function 
	- `size` - The number of workers in the pool (defaults to the number of cores)

* `await pool.all([worker1arg, worker2arg, worker3arg])` - Manages queueing tasks with the pool automatically. Returns results in the order arguments are passed, similar to `Promise.all`. For convenience, you can only pass one argument to each worker by default.

* `pool.queue(async function)` - Queues and executes the method provided. Usually, the method calls `pool.run`.

* `await pool.run(arg1, arg2, ...)` - Executes the task once with the arguments provided. Throws if there are no available workers in the pool.

* `await pool.onIdle()` - Resolves when the queue is empty. Will throw an error if one occurs during execution.

## Compatibility
Node.js 12+ for stable `worker_threads`

## License
MIT

## See also
* [workerpool](https://github.com/josdejong/workerpool)
* [node-worker-threads-pool](https://github.com/SUCHMOKUO/node-worker-threads-pool)
* [piscina](https://github.com/piscinajs/piscina)
