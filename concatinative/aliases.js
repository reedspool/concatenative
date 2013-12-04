var redis = require('../redis-denodeified.js').connect(process.env.REDISTOGO_URL);
var Q = require('Q');
var prefix = 'concatinative_aliases::'

module.exports = {
	flatten: flatten,
	retrieve: retrieve,
	save: save
};

function flatten(input) {
	var regexAlias = /@[^ \/]*/,
		matchFirstAlias = input.match(regexAlias);

	if ( ! matchFirstAlias) {
		return Q.resolve(input);
	} else {
		var firstAlias = matchFirstAlias[0],
			aliasName = firstAlias.slice(1),
			aliasIndex = input.indexOf(firstAlias),
			upTo = input.slice(0, aliasIndex),
			after = input.slice(aliasIndex + firstAlias.length);
		
		return retrieve(aliasName)
			.then(function (unaliased) {
				if ( ! unaliased) return '!NoAliasNamed:' + aliasName+ '.';

				return unaliased;
			})
			.then(function (final) {
				return upTo + final + after;
			})
			.then(flatten);
	}
}

function retrieve(name) {
	return redis.hget(prefix + 'scratchpad', name);
}

function save(name, words) {
	return redis.hset(prefix + 'scratchpad', name, words);
}