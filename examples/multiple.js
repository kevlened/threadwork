const { ThreadPool } = require('../');

function fibonacci(n) {
	if (n === 'fail') throw new Error('fibonacci failed');
	if (n < 2) return n;
	return fibonacci(n - 1) + fibonacci(n - 2);
}

function fibonacciMinusOne(n) {
	return fibonacci(n) - 1;
}

module.exports = {
	pool1: new ThreadPool({ task: fibonacci }),
	pool2: new ThreadPool({ task: fibonacciMinusOne }),
	pool3: new ThreadPool({ task: n => fibonacci(n) - 2 })
};
