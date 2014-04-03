var _ = require('underscore'),
	Q = require('q'),
	tokenFactory = require('./tokens.js'),
	aliases = require('./aliases.js'),
	DEFAULT_EXEC_DIRECTION = 'ltr',
	log = console.log;

module.exports = {
	parse: preprocessAndParse
};

function preprocessAndParse(path, intitialFile, execDirection) {
	var args = [].slice.apply(arguments),
		withFirst = function (first) {
			args[0] = first;
			return args
		};

	return aliases.flatten(path)
			.then(withFirst)
			.spread(parse);
}
// Make tokens out of path
function parse(path, initialFile, execDirection) {
	execDirection = execDirection || DEFAULT_EXEC_DIRECTION;
	var deferred = Q.defer();

	try {
		function invalidWord(word) {
			// Word invalid if
			// * nonexistent, or
			// * consists only of whitespace
			return typeof word === 'undefined' || 
				word.match(/^\s+$/);
		}
		function aliasWord(word) {
			return word.match(regex.aliasWord);
		}
		function next() {
			var d = {
				seperator: words.shift(),
				word: words.shift()
			};

			if ((d.seperator == '' || d.seperator) &&
				(d.word == '' || d.word)) {
				return d
			}

			// No more words!
			return;
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
			tokens = [],
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
		for (var d = next(); d; d = next()) {

			if (invalidWord(d.word)) {
				// Do nothing
			} else {
				tokens.push(tokenFactory.create(d));
			}
		}

		// Now, slip the initial data in, if present
		if (initialFile) {
			tokens.unshift(tokenFactory.file({
				contents: initialFile
			}))
		}

		deferred.resolve(tokens)
	} catch (e) {
		log('PARSER REJECTING', e);
		return Q.reject({
			error: {
				message: e.message,
				stack: e.stack,
				type: e.type
			}
		});
	}

	// Then give'm a buncha proper tokens!
	return deferred.promise;
}