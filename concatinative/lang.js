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
	makeExecutableUrl: Utility.makeExecutableUrl,
	executeFromUrlPath: executeFromUrlPath,
	execute: execute
};

function resolve(urlPath, execDirection) {
	execDirection = execDirection || DEFAULT_EXEC_DIRECTION;

	return Parser.parse(urlPath, execDirection)
		.then(execute);
}

function executeFromUrlPath(path) {
	path = path.match(/^[\/]{0,1}(exec|json|html)\/(.*)/);

	if ( ! path ) throw new Error('Exec hit with no path')

	var input = decodeURIComponent(path[2]);

	return resolve(input, 'ltr')
		.then(function (result) {
			log('Exec result: ', result.output);
			result.input = input;
			return result;
		}, function (error) {
			log('Exec ERROR: ', error.message);
			error.input = input;
			return error;
		});
}

// Execute our program!
// Note: Execution is always LTR,
// 		but notice parse handles execution dir.
function execute(tokens) {
	function executionLog() {
		// TODO: SWITCH BETTER
		log.apply(this, arguments);
		log('Tokens: ', tokens);
		log('Stack: ', stack);
	}

	try {
		var inputTokens = _.clone(tokens)

		function string(token) {
			return token.word.toString();
		}

		function number(token) {
			return parseFloat(token.word);
		}

		function numberOrString(token) {
			var num = number(token);
			if (! isNaN(num)) return num;

			return string(token);
		}

		function quotation(token) {
			// Probably a duck
			return token._isQuotation ? token : undefined;
		}

		function boole(token) {
			executionLog('Boole: ', token.booleanValue())
			return token.booleanValue();
		}

		function link(token) {
			return token._isLink ? token : null;
		}

		var stack = [],
			push = stack.push.bind(stack), 
			pop = function (valueFunction) {
				executionLog('Pop w/ func ' + valueFunction);
				valueFunction = valueFunction || 
					function (t) { return t; };

				if (_.isEmpty(stack) || ! _.last(stack)) {
					throw new Error('Popping Empty Stack!');
				}
				
				var val = valueFunction(stack.pop());
				executionLog('value post func: ', val)

				if (typeof val === 'undefined') {
					throw new Error('Value on stack incorrect type');
				}

				return val;
			},
			next = function () {
				executionLog('About to next');

				// .pop() <== right to left
				// .shift() ==> left to right
				return tokens.shift();
			},
			rewind = function (input) {
				executionLog('About to rewind');

				return tokens.unshift(input);
			},
			binaryUtil = Utility.binary,
			unaryUtil = Utility.unary,
			nullaryUtil = Utility.nullary,
			math = {
				two: function(origOp, what, whatB) {
					return function () {
						op = binaryUtil[origOp];
						whatB = whatB || what;

						if (! op || ! what) throw new Error('Binary op gone wrong op: ' + op + ' originalOp: ' + origOp + ' what: ' + what)
						
						var result = op(pop(what), pop(whatB));
						
						push(TokenFactory.basic(result));
					}
				}
			},
			ops = {
				'+': math.two('sum', numberOrString),
				'-': math.two('difference', number),
				'*': math.two('product', number),
				'/': math.two('quotient', number),
				'%': math.two('remainder', number),
				':max': math.two('max', number),
				':random': function () {
					var arg = pop(),
						numArg = number(arg),
						quotArg = quotation(arg),
						rand = nullaryUtil.random();

					if ( (! quotArg) && isNaN(numArg) ) throw new Error('Expected quotation or number for :random, got ' + string(arg))

					if (numArg == 0 || numArg) {
						// If the argument is a number
						// if 0, rand() ==> [0, 1)
						// else, floor( n * rand() ) ==> [0, n)
						var result = numArg == 0 ? nullaryUtil.random() : 
							unaryUtil.randInt(numArg);

						push(TokenFactory.basic(result));
					} else {
						// It must be a quotation. 
						// Pick one of the quotation's words
						var words = quotArg.words;

						if (_.isEmpty(words)) throw new Error('Cannot select from empty quotation!')

						push(words[unaryUtil.randInt(words.length)]);
					}
				},
				':quote': function () {
					// Pop whatever's on the stack
					var arg = pop(),
						quotation = TokenFactory.quotation({
							seperator: this.seperator
						});

					// Wrap it in a quotation
					quotation.words.push(arg);

					// Push it back
					push(quotation);
				},
				':append': function () {
					var quotA = pop(quotation),
						quotB = pop(quotation);

					quotA.words = quotB.words.concat(quotA.words);

					push(quotA);
				},
				':dup': function () {
					var arg = pop(),
						clone = arg.clone();

					push(arg); 
					push(clone);
				},
				':times': function () {
					var quot = pop(quotation),
						num = pop(number),
						dup = ops[':dup'],
						apply = ops[':call'];

					for (var i = 0; i < num; i++) {
						push(quot.clone())
						apply();
					}
				},
				':each': function () {
					var actionQuot = pop(quotation),
						listQuo = pop(quotation),
						list = listQuo.words,
						apply = ops[':call'];

					log('List', list)
					for (var i = 0; i < list.length; i++) {
						push(list[i].clone());
						log('CLONED word: ', list[i].clone());
						push(actionQuot.clone());
						log('CLONED action: ', actionQuot.clone());
						apply();
					}
				},
				'[': function () {
					// This is the only function currently which
					// pulls things from the input stream!
					executionLog('Quotation begun');
					var quo = TokenFactory.quotation({
							seperator: this.seperator
						}),
						myself = arguments.callee

					for (var n = next(); n && n.word !== ']';
							n = next()) {

						// If we found another quotation
						if (n.word == '[') {
							// Use myself to push a quotation
							myself.apply(n);
							n = pop(quotation);
						}

						quo.words.push(n);
					}

					if (typeof n == 'undefined') throw new Error('Unmatched [')

					push(quo);
				},
				':link': function () {
					var protocol = pop(string),
						hrefQuotation = pop(quotation);

					push(TokenFactory.link(protocol, hrefQuotation))
				},
				':get': function () {
					var format = pop(string),
						link = pop(link);

					if ( ! link || ! format ) throw new Error('wrong args for :get');

					throw new Error('MEOW!!! TIME TO OWN UP TO SOME FUCKING PROMISES MOTHERFUCKER')
				},
				']': function () {
					// Should have been consumed by ops['[']
					throw new Error('Unmatched End Quote ]')
				},
				':call': function () {
					var quotation = pop(quotation);

					if ( ! quotation) throw new Error('Apply called without quotation on top of stack');

					var words = quotation.words;
					executionLog('Quotation words: ', words);
					function nextWord() {
						executionLog('About to next from Quotation words: ', words);
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
					var test = pop(boole),
						caseTrue = pop(quotation),
						caseFalse = pop(quotation);

					push( test ? caseTrue : caseFalse );

					ops[':call']();
				},
				'>>': function () {
					var object = pop(),
						property = string(this);
						value = object.properties[property]
					
					push(value || 
						TokenFactory.f('NoPropertyValue'));
				},
				'<<': function () {
					var value = pop(),
						object = pop(),
						property = string(this);

					// side effect
					object.properties[property] = value;
					
					push(object);
				},
				value: function () {
					// Values are the simplest token.
					push(this);
				},
				':gif': function () {
					var word = pop().word,
						gifHolder = TokenFactory.gif({ 
							word: word
						}),
						errorSet = srcSet.bind(null, 'noResults.gif');

					function srcSet(src) {
						gifHolder.gif = src;
					}

					function srcGet(gif) {
						return gif.src;
					}

					push(gifHolder);

					return Giphy.translate(word)
						.then(srcGet)
						.then(srcSet, errorSet)
				}

			};

		function executeToken(token) {
			var op = ops[token.operator];

			if ( ! op) throw new Error('Unfound operator for word: ' + token.word + ' op:' + token.operator);
		
			var deferred = Q.defer(),
				promise = deferred.promise.then(function () {
					return op.apply(token)
				});

			deferred.resolve();

			return promise;
		}

		function executeAll() {
			var token = next();

			if ( ! token) {
				// We're done here
				return;
			}

			// Do it, then do it again
			return executeToken(token).then(executeAll);
		}

		return executeAll().then(function () {
			executionLog('Done resolving!');
			return {
				afterParsing: tokens.toString(),
				inputTokens: inputTokens,
				output: stack.toString(),
				outputTokens: stack,
				html: _.map(stack, function (token) {
					return token.toHtml();
				}).join('<br />')
			}
		});
	} catch (e) {
		// Poor excuse for promise support
		executionLog('EXECUTE REJECTING', e.message);
		return Q.reject({
			error: {
				message: e.message,
				stack: e.stack,
				type: e.type
			}
		});
	}
}