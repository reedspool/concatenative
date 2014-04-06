var Tokens = require('./tokens.js'),
	ModuleUtility = require('./module-utility.js'),
	helper = ModuleUtility.helper,
	Utility = require('./lang-utility.js'),
	log = Utility.log,
	binaryFns = Utility.binary,

	twoNumbers = helper('number', 'number'),
	twoNumbersOrStrings = helper('numberOrString', 'numberOrString'),

	// Maths
	// JS-like '+'
	sum = twoNumbersOrStrings(binaryFns.sum),
	difference = twoNumbers(binaryFns.difference),
	quotient = twoNumbers(binaryFns.quotient),
	remainder = twoNumbers(binaryFns.remainder),
	product = twoNumbers(binaryFns.product),

	max = twoNumbers(binaryFns.max),

	// Basics
	value = function (token, stack) { stack.push(token) },
	dup = function (token, stack) {
		var a = stack.pop(),
			copy = a.clone();

		stack.push(copy);
		stack.push(a);
	};

module.exports = {
	'+': sum,
	'-': difference,
	'*': product,
	'/': quotient,
	'%': remainder,

	sum: sum,
	difference: difference,
	product: product,
	quotient: quotient,
	remainder: remainder,

	value: value,
	dup: dup
}
