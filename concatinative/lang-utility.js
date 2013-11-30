var _ = require('underscore');
var sys = require('sys');
var Q = require('q');

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
		},
		max: Math.max
	},
	unary: {
		minus: function (a) { return -1 * a; },
		not: function (a) { return ! a; },
		randInt: function (n) {
			return Math.floor(Math.random() * n);
		}		
	},
	nullary: {
		random: function() {
			return Math.random();
		}
	},
	makeExecutableUrl: makeExecutableUrl,
	get: function (format, options) {

		var getter;

		switch (options.protocol || 'https') {
			case 'http': 
				getter = http;
				break;
			case 'https':
				getter = https;
				break;
		}

		// TODO: output different kinds of stuff
		// switching on format
		return getRequest(options, getter)
	}
};

function makeExecutableUrl(req, path) {
	path = path || req.url;
	return req.protocol + "://" + req.get('host') + path;
}

function log() {
	_.each(arguments, function (arg) {
		console.log(sys.inspect(arg));
	});
}

function queryString(data) {
	return _.map(data, function(val, key) {
		return key + '=' + val;
	}).join('&');
}

function getRequest(options, getter) {
	var deferred = Q.defer();
 	var options = _.extend({
		host: 'concatinative.herokuapp.com',
		path: '/exec/',
		port: '80',
		headers: {'custom': 'Custom Header Demo works'}
	}, options);

	if (options.queryData) {
		options.path = options.path + '?' +
						queryString(options.queryData);
	}

 	if ( ! (options.host &&
 		 options.port && 
 		 options.path)) {
 		throw new Error('Insufficient info for http request!')
 	}

	function callback(response) {
		var str = ''
		response.on('data', function (chunk) {
			str += chunk;
		});

		response.on('end', function () {
			console.log(str);
			deferred.resolve(str);
		});
	}

	var req = getter.request(options, callback);
	req.end();

	return deferred.promise;
}