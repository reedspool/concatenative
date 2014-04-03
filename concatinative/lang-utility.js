var _ = require('underscore');
var sys = require('sys');
var Q = require('q');
var http = require('http');
var https = require('https');

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
	get: get,
	parsePathForExecuteable: parsePath
};

function parsePath(path) {
	var parts = path.match(/^[\/]{0,1}(exec|json|html)\/(.*)/);
 
	if ( ! parts ) throw new Error('Executing malformed path: ' + path);

	return parts && parts[2] &&
		decodeURIComponent(parts[2]);
}

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

function get(options) {
	var deferred = Q.defer();

	try {
		var options = _.extend({
				hostname: 'concatinative.herokuapp.com',
				path: '/exec/',
				port: '80',
				headers: {'custom': 'Custom Header Demo works'}
			}, options),
			getter = http;

		switch (options.PROTOCOL) {
			case 'http': 
				log('Using http')
				getter = http;
				break;
			case 'https':
				log('Using https')
				options.port = 443;
				getter = https;
				break;
		}

		if (options.queryData) {
			options.path = options.path + '?' +
							queryString(options.queryData);
		}

	 	if ( ! (options.hostname &&
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
				deferred.resolve(str);
			});
		}

		log('REQUESTING:', options);
		var req = getter.request(options, callback);
		req.end();
	} catch (e) {
		deferred.reject(e)
	}

	return deferred.promise;
}