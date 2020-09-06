const os = require('os');
const { test } = require('uvu');
const assert = require('uvu/assert');
const pool = require('./examples/fibonacci');

const cores = os.cpus().length;

test('pool.all', async () => {
  const results = await pool.all([
		[ 10 ],
		[ 20 ],
		[ 30 ]
	]);
	assert.equal(results, [ 55, 6765, 832040 ]);
});

test('pool.all - error', async () => {
	try {
		await pool.all([
			[ 10 ],
			[ 20 ],
			[ 'fail' ]
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

test.run();
