# threadwork
Simple threading in Node.js

## Why
Existing threading solutions stringify both function and arguments, then pass them to the worker. This creates friction when using dependencies in workers. `threadwork` skips stringifying the function by using a reference instead. This drastically reduces the effort is creating a threaded function.

## Example

```js
// fibonacci.js
const { ThreadPool } = require('threadwork');

function fibonacci(n) {
	if (n < 2) return n;
	return fibonacci(n - 1) + fibonacci(n - 2);
}

module.exports = new ThreadPool({ task: fibonacci });
```

```js
// index.js
const fibonacci = require('./fibonacci');

(async () => {
	try {
		const results = await fibonacci.all([10, 20, 30]);
		console.log(results); // [55, 6765, 832040]
	} catch (e) {
		console.log(e);
	}
})();
```

## Queueing

There's also a queue if you want more control

```js
// index.js
const fibonacci = require('./fibonacci');

(async () => {
	try {
		const results = [];
		for (const arg of [10, 20, 30]) {
			// Queue up an async function
			pool.queue(async () => {
				// Get the results of a single run
				const result = await pool.run(arg);
				results.push(result);
			});
		}
		await pool.onIdle();
		console.log(results); // [55, 6765, 832040]
	} catch (e) {
		console.log(e);
	}
})();
```

## API

* `new ThreadPool({ task, size })` - The primary class. It should be instantiated at the top-level and only once per file.
	- `task` - The worker runs this function 
	- `size` - The number of workers in the pool (defaults to the number of cores)

* `await pool.all([worker1arg, worker2arg, worker3arg])` - Manages queueing tasks with the pool automatically. Returns results in the order arguments are passed, similar to `Promise.all`. For convenience, you can only pass one argument to each worker by default.

* `pool.queue(async function)` - Queues and executes the function provided. Usually, the method calls `pool.run`.

* `await pool.run(arg1, arg2, ...)` - Executes the task once with the arguments provided. Throws if there are no available workers in the pool.

* `await pool.onIdle()` - Resolves when the queue is empty or an error is thrown.

* `pool.isMainThread` - Allows logic based on whether we're in a worker or not.

## Compatibility
Node.js 12+ for stable `worker_threads`

## License
MIT

## See also
* [workerpool](https://github.com/josdejong/workerpool)
* [node-worker-threads-pool](https://github.com/SUCHMOKUO/node-worker-threads-pool)
* [piscina](https://github.com/piscinajs/piscina)
