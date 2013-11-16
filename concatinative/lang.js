/*
 *	Concatinate URL Language
 *
 * 	This document defines the yet nameless 
 *  concatinative language for interpolation
 *  in URLs (or URI's?)
 *
 *	Author: Reed Spool
 *  Begin date: 12/11/2013
 * 
 *  License: TBD
 */
var _ = require('underscore');
var sys = require('sys');
var Giphy = require('./giphy.js');
var Q = require('q');
var expect = require('expect.js');

var TokenFactory = require('./tokens.js');
var Parser = require('./parser.js');
var Utility = require('./lang-utility.js');
var log = Utility.log;

var DEFAULT_EXEC_DIRECTION = 'ltr';

// Test Url
// http://localhost:3000/forward_slash/changes%20to/right/slash/wefawe$@@!@/w23@!/2/43/@/$//5E/&*()-+%20%5E;a.a,a/'%22double/quote%7Cpipe~%60backtick
// 
// Path in Node
// /forward_slash/changes%20to/right/slash/wefawe$@@!@/w23@!/2/43/@/$//5E/&*()-+%20%5E;a.a,a/\'%22double/quote%7Cpipe~%60backtick

module.exports = {
	resolve: resolve,
	executeFromUrlPath: function (path) {
		path = path.match(/^[\/]{0,1}(exec|json)\/(.*)/);

		if ( ! path ) throw new Error('Exec hit with no path')

		var input = decodeURIComponent(path[2]);

		return resolve(input, 'ltr')
			.then(function (result) {
				log('Exec result: ', result.output);
				result.input = input;
				return result;
			});
	},
	makeExecutableUrl: makeExecutableUrl,
	execute: execute
};

function makeExecutableUrl(req, path) {
	path = path || req.url;
	return req.protocol + "://" + req.get('host') + path;
}

function resolve(urlPath, execDirection) {
	execDirection = execDirection || DEFAULT_EXEC_DIRECTION;

	return Parser.parse(urlPath, execDirection)
		.then(execute);
}

// Execute our program!
// Note: Execution is always LTR,
// 		but notice parse handles execution dir.
function execute(tokens) {
	var inputTokens = _.clone(tokens)
	
	function number(token) {
		return parseFloat(token.word);
	}

	function numberOrString(token) {
		var num = number(token);
		
		if (num) return num;

		return token.toString();
	}

	function quotation(token) {
		// Probably a duck
		return token._isQuotation ? token : undefined;
	}

	function boole(token) {
		console.log(token.booleanValue())
		return token.booleanValue();
	}

	var stack = [],
		push = stack.push.bind(stack), 
		pop = function (valueFunction) {
			log('Pop');
			valueFunction = valueFunction || 
				function (t) { return t; };

			if (_.isEmpty(stack) || ! _.last(stack)) {
				throw new Error('Popping Empty Stack!');
			}
			
			var val = valueFunction(stack.pop());

			if (typeof val === 'undefined') {
				throw new Error('Value on stack incorrect type');
			}

			return val;
		},
		next = function () {
			log('About to next');
			log('Tokens: ', tokens);
			log('Stack: ', stack);

			// .pop() <== right to left
			// .shift() ==> left to right
			return tokens.shift();
		},
		rewind = function (input) {
			log('About to rewind');
			log('Tokens: ', tokens);
			log('Stack: ', stack);

			return tokens.unshift(input);
		},
		math = {
			two_nums: function (op) {
				log('Binary func: ', op);
				var result = 
					op(pop(number), pop(number));
				push(TokenFactory.basic(result));
			},
			two_nums_or_strings: function (op) {
				log('Binary func: ', op);
				var result = op(pop(numberOrString) , pop(numberOrString));
				push(TokenFactory.basic(result));
			}
		},
		binary = Utility.binary,
		unary = Utility.unary,
		ops = {
			'+': function () {
				return math.two_nums_or_strings(binary.sum);
			},
			'-': function () {
				return math.two_nums(binary.difference);
			},
			'*': function () {
				return math.two_nums(binary.product);
			},
			'/': function () {
				return math.two_nums(binary.quotient);
			},
			'%': function () {
				return math.two_nums(binary.remainder);
			},
			'[': function () {
				var quotation = TokenFactory.quotation(this);
				
				for (var n = next(); n.word !== ']';
						n = next()) {
					quotation.words.push(n);
				}

				push(quotation);
			},
			']': function () {
				// Should have been consumed by ops['[']
				throw new Error('Unmatched End Quote ]')
			},
			':apply': function () {
				var quotation = pop(quotation);

				if ( ! quotation) throw new Error('Apply called without quotation on top of stack');

				var words = quotation.words;
				log('Quotation words: ', words);
				function nextWord() {
					log('About to next from Quotation words: ', words);
					return words.pop();
				}

				// Shove the quotation tokens
				// back down the muzzle
				for (var token = nextWord(); token;
						token = nextWord()) {
					rewind(token);
				}

				// Note: No Push!!
			},
			':if': function () {
				var test = pop(boole);
				var caseTrue = pop(quotation);
				var caseFalse = pop(quotation);

				push( test ? caseTrue : caseFalse );

				ops[':apply']();
			},
			value: function () {
				// TODO: What if we let files pass through?
				// OR do something with them!
				// if (fileName(this)) {
				// 	// Empty out stack, and...
				//	while (pop()) {};
				//  return; // ... something better
				// }

				push(this);
			},
			':gif': function () {
				var word = pop().word;
				
				var gifHolder = TokenFactory.create({ 
					word: word,
					gif: 'loading.gif'
				});
				
				var srcSet = function (src) {
					gifHolder.gif = src;
				};

				var srcGet = function (gif) {
					return gif.src;
				}

				Giphy.translate(word)
					.then(srcGet)
					.done(srcSet, 
						srcSet.bind(null, 'noResults.gif'));

				push(gifHolder);
			}
		};

	// Main Loop! - Consume all the tokens
	for (var token = next(); token; token = next()) {
		var op = ops[token.operator];
		op.apply(token);
	}

	log('Tokens: ', tokens);
	log('Stack: ', stack);

	return Q.resolve({
		afterParsing: tokens.toString(),
		inputTokens: inputTokens,
		output: stack.toString(),
		outputTokens: stack
	});
}