var _ = require('underscore'),
	Tokens = require('./tokens.js');

module.exports = {
	helper: helper
}

function helper(t,y,p,e,s) {
	var types = [].slice.apply(arguments);

	return function (fn) {
		return function (token, stack) {
			var args = _.map(types, function (type) {
				var arg = stack.pop(),
					nameTypeFn = toNameTypeFn(type);

				return arg[nameTypeFn]();
			})

			var result = fn.apply(token, args)

			if ( ! _.isArray(result) ) result = [result];

			_.each(result, function (resultant) {
				if ( ! Tokens.isToken(resultant) ) {
					resultant = Tokens.basic(resultant)
				}


				stack.push(resultant);
			})
		}
	}
}

function toNameTypeFn(type) {
	return 'to' + type[0].toUpperCase() + type.slice(1);
}