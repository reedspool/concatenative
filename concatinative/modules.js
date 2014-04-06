var _ = require('underscore'),
	sys = require('sys'),
	Giphy = require('./giphy.js'),
	Q = require('q'),
	Tokens = require('./tokens.js'),
	Aliases = require('./aliases.js'),
	Utility = require('./lang-utility.js'),
	log = Utility.log;

// Test Url
// http://localhost:3000/forward_slash/changes%20to/right/slash/wefawe$@@!@/w23@!/2/43/@/$//5E/&*()-+%20%5E;a.a,a/'%22double/quote%7Cpipe~%60backtick
// 
// Path in Node
// /forward_slash/changes%20to/right/slash/wefawe$@@!@/w23@!/2/43/@/$//5E/&*()-+%20%5E;a.a,a/\'%22double/quote%7Cpipe~%60backtick

module.exports = {
	register: register,
	execute: execute,
	isRegistered: isRegistered
};

var OPS = {};

function register(nameOrMap, op) {
	// Optionally accept a map
	if (typeof nameOrMap == 'object') {
		_.each(nameOrMap, function (op, name) {
			register(name, op);
		})
		return;
	}

	// It's a name, assign it an op...
	// ... overriding previous op
	OPS[nameOrMap] = op;
}

function execute(token, originalStack) {
	var op = OPS[token.operator],
		cloneStack = cloneDeepEnough(originalStack),
		facade = {
			blindPop : cloneStack.pop.bind(cloneStack),
			pop: function () {
				if (facade.isEmpty()) throw new Error('Conc - Popped empty stack!')

				return this.blindPop();
			},
			push: cloneStack.push.bind(cloneStack),
			isEmpty: function () {
				return cloneStack.length <= 0;
			}
		},
		update = function (trash) {
			// Remove all the items gently from original
			_.each(originalStack, del, originalStack);

			// Transfer the results of the operation
			_.each(cloneStack, set, originalStack);

			// Set the length so we don't confuse anyone
			set.call(originalStack, cloneStack.length, 'length');
		};

	if ( ! op ) return Q.reject(new Error('No op registered for name ___' + name + '___'));

	return Q.fcall(op, token, facade)
		.then(update)
		.then(Q(originalStack));
}

function isRegistered(name) {
	return !! OPS[name];
}

function cloneDeepEnough(stack) {
	return _.invoke(stack, 'clone');
}

function set(item, index) {
	this[index] = item;
}

function del(item, index) {
	delete this[index];
}