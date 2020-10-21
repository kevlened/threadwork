# threadwork
Simple, no frills, threading in Node.js

## Why
Other solutions were too complex. Many threading apps just need a way to create a thread pool and call the threaded function; that's what this does.

## How
<!-- 1) `threadwork` uses a dynamically sized thread pool. This uses memory wisely and prevents the thread from hanging when the node process exits. -->
Most threading solutions stringify the function and arguments before passing them to a worker. Stringifying creates friction when using dependencies. `threadwork` skips stringifying the function by using a reference instead, reducing the effort to create a threaded function.

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
const pool = require('./fibonacci');

(async () => {
	try {
		const results = await Promise.all([
			pool.run(10),
			pool.run(20),
			pool.run(30)
		]);
		console.log(results); // [55, 6765, 832040]
	} catch (e) {
		console.log(e);
	} finally {
		await pool.close();
	}
})();
```

## API
* `new ThreadPool({ task, size })` - The primary class. It should be instantiated at the top-level and only once per file.
	- `task` - The worker runs this function 
	- `size` - The number of workers in the pool (defaults to the number of cores)

* `await pool.run(arg1, arg2, ...)` - Executes the task once with the arguments provided.

* `await pool.close()` - Terminates all the workers, allowing the process to exit.

* `pool.isMainThread` - Allows logic based on whether we're in a worker or not.

## Compatibility
Node.js 12+ for stable `worker_threads`

### ts-node-dev
There's best-effort support for ts-node-dev. You must provide the following:
1) `TS_NODE_DEV_CACHE` as an environment variable
2) The same directory should be provided to `ts-node-dev` via `--cache-directory`

CLI example:
```bash
TS_NODE_DEV_CACHE=.ts-node tsnd --cache-directory $TS_NODE_DEV_CACHE --respawn index.ts
```

## License
MIT

## See also
* [workerpool](https://github.com/josdejong/workerpool)
* [node-worker-threads-pool](https://github.com/SUCHMOKUO/node-worker-threads-pool)
* [piscina](https://github.com/piscinajs/piscina)
