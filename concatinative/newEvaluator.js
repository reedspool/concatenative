/* 
 * Actually execute our little language
 */
var _ = require('underscore'),
	sys = require('sys'),
	Giphy = require('./giphy.js'),
	Q = require('q'),
	Tokens = require('./tokens.js'),
	Aliases = require('./aliases.js'),
	Modules = require('./modules.js'),
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
function execute(inputTokens) {

	var tokens = _.clone(inputTokens),
		stack = [],
		// .shift() executes left to right -->
		// .pop()   executes right to left <--
		tokensFacade = {
			next: tokens.shift.bind(tokens),
			rewind: tokens.unshift.bind(tokens),
		}
		function stuff() { 
			return {
				outputTokens: stack,
				afterParsing: tokens.toString(),
				inputTokens: inputTokens,
				output: _.invoke(stack, 'toString').join(' '),
				html: _.invoke(stack, 'toHtml').join('<br />')
			};
		};

	return executeTokens(tokensFacade, stack)
		.then(Utility.fn.wrap('outputTokens'))
		.then(Utility.fn.attachMembers(stuff));
}

function executeTokens(tokens, stack) {
	return executeLoop();

	function executeLoop() {
		var token = tokens.next();

		// Base case, out of tokens!
		if ( ! token) return Q();

		// Do it, then do it again
		return Modules.execute(token, stack)
			.then(executeLoop);
	};	
}