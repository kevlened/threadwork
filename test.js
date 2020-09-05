const { test } = require('uvu');
const assert = require('uvu/assert');
const fibonacci = require('./examples/fibonacci');

test('pool.all', async () => {
  const results = await fibonacci.all([
		[ 10 ],
		[ 20 ],
		[ 30 ]
	]);
	assert.equal(results, [ 55, 6765, 832040 ]);
});

test('pool.all - error', async () => {
	try {
		await fibonacci.all([
			[ 'fail' ]
		]);
		assert.unreachable('should have thrown');
	} catch (e) {
		assert.instance(e, Error);
		assert.equal(e.message, 'failed');
	}
});

test.run();
