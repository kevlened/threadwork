const { ThreadPool } = require('../');

function fibonacci(n) {
	if (n === 'fail') throw new Error('fibonacci failed');
	if (n < 2) return n;
	return fibonacci(n - 1) + fibonacci(n - 2);
}

module.exports = new ThreadPool({ task: fibonacci });
