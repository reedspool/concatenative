var _ = require('underscore'),
	Q = require('q'),
	Tokens = require('./tokens.js'),
	Aliases = require('./aliases.js'),
	Utility = require('./lang-utility.js'),
	whitespace = Utility.regex.whitespace,
	noWhitespace = Utility.regex.noWhitespace,
	DEFAULT_DIRECTION = 'ltr',
	log = console.log;

module.exports = {
	parse: preprocessAndParse
};

function preprocessAndParse(path, initialFile, direction) {
	return Aliases.flatten(path)
			.then(function (flattened) {
				return qParse(flattened, initialFile, direction);
			});
}

function qParse(path, initialFile, direction) {
	return Q.fapply(parse, arguments)
		.fail(function (e) {
			log('PARSER REJECTING', e);
			return {
				error: {
					message: e.message,
					stack: e.stack,
					type: e.type
				}
			}
		});
}

function parse(path, initialFile, direction) {
	direction = direction || DEFAULT_DIRECTION;
	// The path is a string of words conjoined by whitespace
	var tokens = [],
		// Tokenize!
		words = path.split(whitespace),

		// Apply execution direction before any real work!
		words = direction == DEFAULT_DIRECTION ? words : words.reverse(), 

		// Strip invalid (empty) words
		words = _.select(words, function (word) { return word.match(noWhitespace) }),

		// Map to token form
		tokens = _.map(words, Tokens.create);

	// Now, slip the initial data into the front, if present
	if (initialFile) {
		tokens.unshift(Tokens.file({
			contents: initialFile
		}))
	}

	return tokens;
}