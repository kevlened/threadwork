const { Pool } = require('../');

function fibonacci(n) {
	if (n === 'fail') throw new Error('failed');
	if (n < 2) return n;
	return fibonacci(n - 1) + fibonacci(n - 2);
}

module.exports = new Pool({ task: fibonacci });
