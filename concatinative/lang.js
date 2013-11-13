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

function log() {
	_.each(arguments, function (arg) {
		console.log(sys.inspect(arg));
	});
}

var DEFAULT_EXEC_DIRECTION = 'ltr';

// Test Url
// http://localhost:3000/forward_slash/changes%20to/right/slash/wefawe$@@!@/w23@!/2/43/@/$//5E/&*()-+%20%5E;a.a,a/'%22double/quote%7Cpipe~%60backtick
// 
// Path in Node
// /forward_slash/changes%20to/right/slash/wefawe$@@!@/w23@!/2/43/@/$//5E/&*()-+%20%5E;a.a,a/\'%22double/quote%7Cpipe~%60backtick

module.exports = {
	resolve: function (urlPath, execDirection) {
		execDirection = execDirection || DEFAULT_EXEC_DIRECTION;

		// TODO: Q-ify this whole thing!
		var tokens = parsePath(urlPath, execDirection),
			result = execute(tokens);
		
		return result;
	},
	test: function (urlPath) {
		var tokens = parsePath(urlPath);

		log(tokens);
	}
};

// Make tokens out of path
function parsePath(path, execDirection) {
	// The path is a string of words
	// 
	// Joined by*:   a space or slash
	// 
	// 		* words cannot contain these
	// 			characters either

	// TODO: Make a better "all" match. That is,
	// 		one that matches a string with word first
	var matchSeparator =             
			 /[ \/]/,
		matchWord = 
					/[^ \/]*/,
		matchWordOrSeparator = 
			/([ \/])|([^ \/]*)/,
		matchAllWordsAndSeperatorsExceptInitialWord = 
			/([ \/])|([^ \/]*)*/g

	var words = path.match(matchAllWordsAndSeperatorsExceptInitialWord);
	var tokenData = [];

	// That was easy
	if (_.isEmpty(words)) return [];

	// Make sure a "nothing" seperator begins it
	var firstWord = path.match(matchWord);
	if (firstWord == words[0]) words.unshift('/')

	if (execDirection != DEFAULT_EXEC_DIRECTION) {
		words = words.reverse();
	}

	// Bind the separator to whatever's on its right
	for (var i = 0; i < words.length; i += 2) {

		var datum = {
			seperator: words[i],
			word: words[i + 1]
		};

		if (typeof datum.word !== 'undefined') {
			tokenData.push(datum);
		}
	}

	// Then give'm a buncha proper tokens!
	return _.map(tokenData, createToken);
}

function basicToken(word) {
	return createToken({ word: word });
}

function createToken(data) {
	var basic = {
		operator: 'value',
		seperator: '/',
		word: 'unset'
	};

	data = _.extend(basic, data);

	switch (data.word) {
		case '+':
		case '-':
		case '*':
		case '/':
		case '%':
			data.operator = data.word;
			break;
		case ':gif':
			data.operator = 'gif';
			break;
	}

	return data;
}

// Run through the tokens left to right
function execute(tokens) {

	function number(token) {
		// TODO: More strenuous testing
		return parseFloat(token.word);
	}

	function numberOrString(token) {
		var num = number(token);
		
		if (num) return num;

		return token.word.toString();
	}

	var stack = [],
		push = stack.push.bind(stack), 
		pop = function () {
			log('Pop');
			if (_.isEmpty(stack)) log('POPPING EMPTY STACK')
			return stack.pop();
		},
		popNumber = function () {
			return number(pop());
		},
		popNumberOrString = function () {
			return numberOrString(pop());
		},
		next = function () {
			log('About to next\n')
			log('Tokens: ', tokens);
			log('Stack: ', stack);

			// .pop() <== right to left
			// .shift() ==> left to right
			return tokens.shift();
		},
		ops = {
			'+': function () {
				return basicToken(popNumberOrString() + 
					popNumberOrString());
			},
			'-': function () {
				return basicToken(popNumber() - popNumber());
			},
			'*': function () {
				return basicToken(popNumber() * popNumber());
			},
			'/': function () {
				return basicToken(popNumber() / popNumber());
			},
			'%': function () {
				return basicToken(popNumber() % popNumber());
			},
			value: function () {
				// TODO: What if we let files pass through?
				// OR do something with them!
				// if (fileName(this)) {
				// 	// Empty out stack, and...
				//	while (pop()) {};
				//  return; // ... something better
				// }

				return this;
			},
			gif: function () {
				var word = pop().word;
				
				var gifHolder = createToken({ 
					word: word,
					gif: 'loading.gif'
				});
				
				var srcSetter = function (src) {
					gifHolder.gif = src;
				};

				Giphy.translate(word)
					.then(function (gif) {
						return gif.src;
					})
					.done(srcSetter, function (error) {
						srcSetter('noResults.gif');
					});

				return gifHolder;
			}
		};

	// Main Loop! - Consume all the tokens
	for (var token = next(); token; token = next()) {
		var op = ops[token.operator];
		push(op.apply(token));
	}

	log('Tokens: ', tokens);
	log('Stack: ', stack);
	return stack;
}

