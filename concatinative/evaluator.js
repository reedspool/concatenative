/* 
 * Actually execute our little language
 */
var _ = require('underscore'),
	sys = require('sys'),
	Giphy = require('./giphy.js'),
	Q = require('q'),
	TokenFactory = require('./tokens.js'),
	Aliases = require('./aliases.js'),
	Utility = require('./lang-utility.js'),
	log = Utility.log;

// Test Url
// http://localhost:3000/forward_slash/changes%20to/right/slash/wefawe$@@!@/w23@!/2/43/@/$//5E/&*()-+%20%5E;a.a,a/'%22double/quote%7Cpipe~%60backtick
// 
// Path in Node
// /forward_slash/changes%20to/right/slash/wefawe$@@!@/w23@!/2/43/@/$//5E/&*()-+%20%5E;a.a,a/\'%22double/quote%7Cpipe~%60backtick

module.exports = {
	execute: execute
};

// Execute our program!
// Note: Execution is always LTR, because
// 		 parse() handles execution dir.
function execute(tokens) {
	function executionLog() {
		// // TODO: SWITCH BETTER
		log.apply(this, arguments);
		log('Tokens: ', tokens);
		log('Stack: ', stack);
	}

	try {
		var inputTokens = _.clone(tokens),
			stack = [];
			// .shift() executes left to right -->
			// .pop()   executes right to left <--
			next = tokens.shift.bind(tokens),
			rewind = tokens.unshift.bind(tokens),

			// OPS
			binaryUtil = Utility.binary,
			unaryUtil = Utility.unary,
			nullaryUtil = Utility.nullary,
			math = {
				two: function(origOp, what, whatB) {
					return function (stack) {
						log('orig', origOp)
						op = binaryUtil[origOp];
						whatB = whatB || what;

						if (! op || ! what) throw new Error('Binary op gone wrong op: ' + op + ' originalOp: ' + origOp + ' what: ' + what)
						executionLog(what.toString())

						var result = op(stack.pop(what), stack.pop(whatB));
						
						stack.push(TokenFactory.basic(result));
					}
				}
			},
			ops = {
				value: function (stack) {
					// Values are the simplest token.
					stack.push(this);
				},
				'+': math.two('sum', numberOrString),
				'-': math.two('difference', number),
				'*': math.two('product', number),
				'/': math.two('quotient', number),
				'%': math.two('remainder', number),
				':max': math.two('max', number),
				':random': function (stack) {
					var arg = stack.pop(),
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

						stack.push(TokenFactory.basic(result));
					} else {
						// It must be a quotation. 
						// Pick one of the quotation's words
						var words = quotArg.words;

						if (_.isEmpty(words)) throw new Error('Cannot select from empty quotation!')

						stack.push(words[unaryUtil.randInt(words.length)]);
					}
				},
				':quote': function (stack) {
					// Pop whatever's on the stack
					var arg = stack.pop(),
						quotation = TokenFactory.quotation();

					// Wrap it in a quotation
					quotation.words.push(arg);

					// Push it back
					stack.push(quotation);
				},
				':append': function (stack) {
					var quotA = stack.pop(quotation),
						quotB = stack.pop(quotation);

					quotA.words = quotB.words.concat(quotA.words);

					stack.push(quotA);
				},
				':dup': function (stack) {
					var arg = stack.pop(),
						clone = arg.clone();

					stack.push(arg); 
					stack.push(clone);
				},
				':swap': function (stack) {
					var a = stack.pop(),
						b = stack.pop();

					stack.push(a);
					stack.push(b);
				},
				':times': function (stack) {
					var quot = stack.pop(quotation),
						num = stack.pop(number),
						call = ops[':call'];

					for (var i = 0; i < num; i++) {
						stack.push(quot.clone())
						call();
					}
				},
				':each': function (stack) {
					var actionQuot = stack.pop(quotation),
						listQuo = stack.pop(quotation),
						list = listQuo.words,
						call = ops[':call'],
						quote = ops[':quote'],
						append = ops[':append'];

					function a (token) { return token.clone() }

					// For each word in the list
					for (var i = list.length - 1; i >= 0; i--) {
						// Push it on the stack
						// Make it into a quote
						// And then push the operator
						// Then append the val to the op
						// Then call it all
						stack.push(a(list[i]));
						quote(stack);
						stack.push(a(actionQuot));
						append(stack);
						call(stack);
					}
				},
				'[': function (stack) {
					// This is the only function currently which
					// pulls things from the input stream!
					executionLog('Quotation begun');
					var quo = TokenFactory.quotation({}),
						myself = arguments.callee

					for (var n = next(); n && n.word !== ']';
							n = next()) {

						// If we found another quotation
						if (n.word == '[') {
							// Use myself to push a quotation
							myself.call(n, stack);
							n = stack.pop(quotation);
						}

						quo.words.push(n);
					}

					if (typeof n == 'undefined') throw new Error('Unmatched "["')

					stack.push(quo);
				},
				']': function (stack) {
					// Should have been consumed by ops['[']
					throw new Error('Unmatched End Quote ]')
				},
				':link': function (stack) {
					var protocol = stack.pop(string),
						hrefQuotation = stack.pop(quotation);

					stack.push(TokenFactory.link(protocol, hrefQuotation))
				},
				':get': function (stack) {
					var link = stack.pop(link);

					if ( ! link ) throw new Error(':get takes valid :link as argument');

					return Utility.get(link.toOptions())
							.then(function (data) {
								stack.push(TokenFactory.file({
									contents: data
								}));
							});
				},
				':call': function (stack) {
					var quotation = stack.pop(quotation);

					if ( ! quotation) throw new Error('Call called without quotation on top of stack');

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
				':if': function (stack) {
					var test = stack.pop(boole),
						caseTrue = stack.pop(quotation),
						caseFalse = stack.pop(quotation);

					stack.push( test ? caseTrue : caseFalse );

					ops[':call'](stack);
				},
				'>>': function (stack) {
					var object = stack.pop(),
						name = property(this);
						value = object.properties[name]
					
					stack.push(value || 
						TokenFactory.f('NoPropertyValue'));
				},
				'<<': function (stack) {
					var value = stack.pop(),
						object = stack.pop(),
						name = property(this);

					// side effect
					object.properties[name] = value;
					
					stack.push(object);
				},
				':img': function (stack) {
					var imgLink = stack.pop(link);

					if ( ! imgLink) throw new Error('Img called with no link!')

					stack.push(TokenFactory.img({ link: imgLink }));
				},
				':gif': function (stack) {
					var word = stack.pop(string),
						errorSet = srcSet.bind(null, 'noResults.gif');

					function srcSet(src) {
						gifHolder.link = TokenFactory.linkFromSrc(src);
					}

					function srcGet(gif) {
						return gif.src;
					}

					if ( ! word) throw new Error('Gif called with a bad string argument');

					var gifHolder = TokenFactory.img({ 
						word: word
					})
				
					stack.push(gifHolder);

					return Giphy.translate(word)
						.then(srcGet)
						.then(srcSet, errorSet)
				},
				':file': function (stack) {
					var stuff = stack.pop(string);

					stack.push(TokenFactory.file({
						contents: decodeURIComponent(stuff)
					}));
				},
				':json': function (stack) {
					var contents = stack.pop(file),
						// JSON.parse() throws if contents is
						// malformed JSON
						parsedContents = JSON.parse(contents),
						transform = function (parsed) {
							if (parsed == null) return null;

							switch (typeof parsed) {
								case 'undefined':
									throw new Error('Not sure how we got here: tried to transform JSON "undefined"')

								case 'number':
									return TokenFactory.basic(parsed);

								case 'boolean':
									return parsed ? 
											TokenFactory.basic('JSONTrue') : 
											TokenFactory.f('JSONFalse')

								case 'string':
									return TokenFactory.basic(parsed);

								case 'object':
									if (_.isArray(parsed)) {
										var quot = TokenFactory.quotation()

										_.each(parsed, function (val) {
											quot.words.push(transform(val));
										});

										return quot
									} else {
										var basic = TokenFactory.basic('JSONObject')
										
										_.each(parsed, function (val, key) {
											basic.properties[key] = transform(val);
										});

										return basic;
									}			
								}

							throw new Error('Unidentified thing while transforming JSON: ' + parsed);
						};

					// TODO
					// Parse the contents into a 
					// single consistent object 
					// with properties nesting blkabhalhwefl 
					// If
					stack.push(transform(parsedContents));
				},
				':formresponse': function (stack) {
					try {
						var contents = stack.pop(file),
							outputs = contents.split('&'),
							basic = TokenFactory.basic('FormDataObject');

						_.each(outputs, function (o) {
							var pair = o.split('='),
								name = pair[0],
								value = TokenFactory.basic(pair[1]);

							basic.properties[name] = value;
						});

						stack.push(basic);
					} catch(e) {
						executionLog('Error parsing formdata');
						log('Error: ', e);
						throw e;
					}
				},
				':form': function (stack) {
					var inputs = stack.pop(quotation),
						action = stack.pop(quotation);

					stack.push(TokenFactory.form(action, inputs));
				},
				':save': function (stack) {
					var name = stack.pop(string),
						stuff = stack.pop();

					Aliases.save(name, stuff.toString());

					// Note, nothing pushed!
				}

			};

		stack.push = stack.push.bind(stack), 
		stack.pop = function (valueFunction) {
			executionLog('Pop w/ func ' + valueFunction);
			valueFunction = valueFunction || 
				function (t) { return t; };

			if (_.isEmpty(this)) {
				throw new Error('Popping Empty Stack!');
			} else {
				executionLog('Not empty')
			}
			
			var val = valueFunction(this.pop());
			executionLog('value post func: ', val)

			if (typeof val === 'undefined') {
				throw new Error('Value on stack incorrect type');
			}

			return val;
		}.bind(stack)

		function executeToken(token) {
			var op = ops[token.operator];

			if ( ! op) throw new Error('Unfound operator for word: ' + token.word + ' op:' + token.operator);

			return Q.fcall(op.bind(token, stack));

			// I think this function should just turn into this...
			//return modules.execute(token, stack);
		}

		function executeAll() {
			var token = next();

			// Base case, out of tokens!
			if ( ! token) return Q([]);

			// Do it, then do it again
			return executeToken(token)
				.then(executeAll);
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

function string(token) {
	var f = file(token);
	
	if (f) return f.contents.toString();

	return token.word.toString();
}

function file(token) {
	// Probably a duck
	return token._isFile ? token.contents : null;
}

function number(token) {
	log('Number:', token.word)
	return parseFloat(token.word);
}

function numberOrString(token) {
	var num = number(token);
	
	log('hi')

	if (isNaN(num)) return string(token);

	return num;
}

function quotation(token) {
	// Probably a duck
	return token._isQuotation ? token : null;
}

function boole(token) {
	// Everything is true except
	// things starting with !
	return token.booleanValue();
}

function link(token) {
	// Probably a duck
	return token._isLink ? token : null;
}

function property(token) {
	return token.property
}
