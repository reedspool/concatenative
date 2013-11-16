var _ = require('underscore');
var sys = require('sys');

module.exports = {
	log: log,
	binary: {
		sum: function (a, b) { return a + b; },
		difference: function (a, b) { return a - b; },
		quotient: function (a, b) { return a / b; },
		product: function (a, b) { return a * b; },
		remainder: function (a, b) { return a % b; },
		and: function (a, b) { return a && b },
		or: function (a, b) { return a || b },
		access: function (a, b) {
			if (typeof a == 'undefined') throw new Error('Attempted access on undefined!')
			return a[b];
		}
	},
	unary: {
		minus: function (a) { return -1 * a; },
		not: function (a) { return ! a; }		
	}
};

function log() {
	_.each(arguments, function (arg) {
		console.log(sys.inspect(arg));
	});
}