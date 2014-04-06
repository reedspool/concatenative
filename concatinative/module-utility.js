var _ = require('underscore'),
	Tokens = require('./tokens.js');

module.exports = {
	helper: helper
}

/*
 * Do a bunch of fun stuff to help make an easy function easy
 *
 * Useage: 
 * function product(a, b) { return a * b };
 * var productOperation = helper('number', 'number')(product);
 * Modules.register('*', productOperation)
 *
 * // Access to op token through this
 * function dup(a) { return this};
 * var dupOperation = helper()(dup);
 * Modules.register('dup', dupOperation)
 */
function helper(t,y,p,e,s) {
	var types = [].slice.apply(arguments),
		// Coerce types to function names...
		typeFns = _.map(types, toNameTypeFn);

	return function (fn) {
		return function (token, stack) {
			// ... then map to those functions
			// so that args has only the corretly typed value
			// and not (necessarily) just a token
			var args = _.map(typeFns, function (typeFn) {
					var arg = stack.pop();

					return arg[typeFn]();
				});

			// Call the simplified function!
			var results = fn.apply(token, args)

			// If single results, wrap it in an array
			if ( ! _.isArray(results) ) results = [results];

			// Now go through each results and...
			_.each(results, function (resultant) {
				// If this is a simple value, 
				if ( ! Tokens.isToken(resultant) ) {
					// Wrap it in a real token
					resultant = Tokens.basic(resultant)
				}

				// Successfully finish up by placing
				// everything neatly back on the stack
				stack.push(resultant);
			})
		}
	}
}

function toNameTypeFn(type) {
	return 'to' + type[0].toUpperCase() + type.slice(1);
}