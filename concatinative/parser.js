var _ = require('underscore');
var Q = require('q');
var tokenFactory = require('./tokens.js')

var DEFAULT_EXEC_DIRECTION = 'ltr';

module.exports = {
	parse: parse
};

// Make tokens out of path
function parse(path, execDirection) {
	try {
		function invalidWord(word) {
			// Word invalid if
			// * nonexistent, or
			// * consists only of whitespace
			return typeof word === 'undefined' || 
				word.match(/^\s+$/);
		}

		// The path is a string of words
		// 
		// Joined by*:   a space or slash
		// 
		// 		* words cannot contain these
		// 			characters either
		var regex = {
				separator:        /[ \/]/,
				word:                     /[^ \/]*/,
				wordOrSeparator: /([ \/])|([^ \/]*)/,
				allWordsAndSeps: /([ \/])|([^ \/]*)*/g
			},
			tokenData = [],
			words = path.match(regex.allWordsAndSeps);

		// Base case
		if (_.isEmpty(words)) return [];

		// Apply execution direction before any real work!
		if (execDirection != DEFAULT_EXEC_DIRECTION) {
			words = words.reverse();
		}

		// Make sure a "nothing" seperator begins it
		var firstWord = path.match(regex.word);
		if (firstWord == words[0]) words.unshift('/')

		// Bind the separator to whatever's on its right
		for (var i = 0; i < words.length; i += 2) {
			var d = {
				seperator: words[i],
				word: words[i + 1]
			};

			if (invalidWord(d.word)) {
				// Do nothing
			} else {
				tokenData.push(d);
			}
		}
	} catch (e) {
		log('PARSER REJECTING', e);
		return Q.reject({
			error: {
				message: e.message,
				stack: f.stack,
				type: e.type
			}
		});
	}

	// Then give'm a buncha proper tokens!
	return Q.resolve(_.map(tokenData, tokenFactory.create.bind(tokenFactory)));
}