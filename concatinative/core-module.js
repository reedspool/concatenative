var Tokens = require('./tokens.js'),
	ModuleUtility = require('./module-utility.js'),
	helper = ModuleUtility.helper,
	Utility = require('./lang-utility.js'),
	log = Utility.log,
	binaryFns = Utility.binary,
	concatenativeFns = Utility.concatenative,

	twoNumbers = helper('number', 'number'),
	twoNumbersOrStrings = helper('numberOrString', 'numberOrString'),
	aToken = helper('token'),
	nullary = helper(),
	twoTokens = helper('token', 'token'),

	// Maths
	// JS-like '+'
	sum = twoNumbersOrStrings(binaryFns.sum),
	difference = twoNumbers(binaryFns.difference),
	quotient = twoNumbers(binaryFns.quotient),
	remainder = twoNumbers(binaryFns.remainder),
	product = twoNumbers(binaryFns.product),

	max = twoNumbers(binaryFns.max),

	// Quotations
	quotation = function (token, stack, tokens) {
		// We need to read ahead for the words in our quotation...
		var quo = Tokens.quotation({}),
			// Need a waaaay better way to do this...
			myself = arguments.callee;

		for (var n = tokens.next(); n && n.word !== ']'; n = tokens.next()) {

			// If we found another quotation
			if (n.word == '[') {
				// Use myself to push a quotation
				myself.call(n, stack, tokens);
				n = stack.pop(quotation);
			}

			quo.words.push(n);
		}

		if ( ! n ) throw new Error('Unmatched "["')

		stack.push(quo);
	},
	unmatched = nullary(function () { 
		throw new Error('Unmatched "' + this.word + '"');
	}),

	// Basics
	value = nullary(concatenativeFns.val),
	dup = aToken(concatenativeFns.dup),
	swap = twoTokens(concatenativeFns.swap);

module.exports = {
	'+': sum,
	'-': difference,
	'*': product,
	'/': quotient,
	'%': remainder,

	'[': quotation,
	']': unmatched,

	sum: sum,
	difference: difference,
	product: product,
	quotient: quotient,
	remainder: remainder,

	value: value,
	dup: dup,
	swap: swap
}
