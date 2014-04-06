var _ = require('underscore')
	Tokens = require('./tokens.js'),
	Modules = require('./modules.js'),
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
	aQuotation = helper('quotation'),
	twoQuotations = helper('quotation', 'quotation'),

	// Maths
	// JS-like '+'
	sum = twoNumbersOrStrings(binaryFns.sum),
	difference = twoNumbers(binaryFns.difference),
	quotient = twoNumbers(binaryFns.quotient),
	remainder = twoNumbers(binaryFns.remainder),
	product = twoNumbers(binaryFns.product),

	max = twoNumbers(binaryFns.max),
	min = twoNumbers(binaryFns.min),

	// Quotations
	quotation = function (token, stack, tokens) {
		// We need to read ahead for the words in our quotation...
		var quo = Tokens.quotation(),
			// Need a waaaay better way to do this...
			myself = arguments.callee;

		for (var n = tokens.next(); n && n.word !== ']'; n = tokens.next()) {

			// If we found another quotation
			if (n.word == '[') {
				// Use myself to push a quotation
				// :-/
				myself.call(null, n, stack, tokens);
				n = stack.pop(quotation);
			}

			quo.words.push(n);
		}

		if ( ! n ) throw new Error('Unmatched "["')

		stack.push(quo);
	},
	quote = aToken(function (a) {
		var quo = Tokens.quotation();

		quo.words.push(a)

		return quo;
	}),
	append = twoQuotations(function (a, b) {
		a.words = b.words.concat(a.words);
		return a;
	}),

	// Calling quotations
	call = function (token, stack, tokens) {
		var quotation = stack.pop().toQuotation(),
			words = quotation.words,
			nextWord = words.pop.bind(words);

		// Shove the quotation tokens
		// back down the muzzle
		for (var token = nextWord(); token;
				token = nextWord()) {
			tokens.rewind(token);
		}
	},
	times = function (token, stack, tokens) {
		var quotation = stack.pop().toQuotation(),
			n = stack.pop().toNumber(),
			call = function () {
				// TODO: Ugly!
				var callToken = Tokens.create({ word: 'call' });
				stack.push(quotation.clone());
				Modules.execute.call(null, callToken, stack, tokens);
			};

		_.times(n, call);
	},
	each = function (token, stack, tokens) {
		// TODO: ... 
	},

	// Basics
	value = nullary(concatenativeFns.val),
	unmatched = nullary(function () { 
		throw new Error('Unmatched "' + this.word + '"');
	}),
	dup = aToken(concatenativeFns.dup),
	swap = twoTokens(concatenativeFns.swap);

module.exports = {
	// Aliases, or are the others aliases?
	'+': sum,
	'-': difference,
	'*': product,
	'/': quotient,
	'%': remainder,

	'[': quotation,
	']': unmatched,
	call: call,
	quote: quote,
	append: append,
	times: times,

	sum: sum,
	difference: difference,
	product: product,
	quotient: quotient,
	remainder: remainder,
	max: max,
	min: min,

	value: value,
	dup: dup,
	swap: swap
}
