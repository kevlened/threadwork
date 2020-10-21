const os = require('os');
const { test } = require('uvu');
const assert = require('uvu/assert');
const pool = require('./examples/fibonacci');

const cores = os.cpus().length;

const wait = ms => new Promise(res => setTimeout(res, ms));

test('pool.all', async () => {
  const results = await Promise.all([
		pool.run(10),
		pool.run(20),
		pool.run(30),
	]);
	assert.equal(results, [ 55, 6765, 832040 ]);
});

test('pool.all - error', async () => {
	try {
		await Promise.all([
			pool.run(10),
			pool.run(20),
			pool.run('fail'),
		]);
		assert.unreachable('should have thrown');
	} catch (e) {
		assert.instance(e, Error);
		assert.equal(e.message, 'fibonacci failed');
	}
});

test('pool.run - queue', async () => {
	const promises = [];
	const runs = cores + 1;
	for (let i = 0; i++ < runs;) {
		promises.push(pool.run(i));
	}
	const results = await Promise.all(promises);
	assert.equal(results, [
		1,
		1,
		2,
		3,
		5,
		8,
		13,
		21,
		34,
	].slice(0, runs));
});

test('pool.run - allows more than one pool per file', async () => {
	const { pool1, pool2, pool3 } = require('./examples/multiple');
	const results = await Promise.all([
		pool1.run(10),
		pool2.run(10),
		pool3.run(10)
	]);
	assert.equal(results, [ 55, 54, 53 ]);
});

test('pool.queue - allows queue management', async () => {
	const results = [];
	pool.queue(async () => {
		await wait(1);
		results[0] = await pool.run(10);
	});
	pool.queue(async () => {
		await wait(1);
		results[1] = await pool.run(20);
	});
	pool.queue(async () => {
		await wait(1);
		results[2] = await pool.run(30);
	});
	await pool.wait();

	assert.equal(results, [ 55, 6765, 832040 ]);
});

// TODO: add a test for ts-node-dev

test.run();
