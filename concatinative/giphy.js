
var http = require('http');
var _ = require('underscore');
var Q = require('q');

module.exports = (function() {
	var contract = {
		translate: translate,
		testDrive: testDrive
	};

	var api = {
		key: 'dc6zaTOxFJmzC',
		url: 'localhost',
		port: 80,
		endpoints: {
			auth: 'session_process.html'
		}
	};

	function testDrive() {

		authenticate()
			// TODO:
			// .then(extractKey)
			// .then(sendSomeData)
			// .then(mergeUser)
		/*
			We want to walk the user through
			a trivial use of the API.

			1. Authenticate -> Aquire Key
			2. Send some data
			3. Merge user
		*/
	}

	function authenticate() {
		// TODO: Send an authentication request to
		// AlwaysPrepped web app

		// return promise of success
	}

	function queryString(data) {
		return _.map(data, function(val, key) {
			return key + '=' + val;
		}).join('&');
	}

	function apiRequest(settings) {
		var settings = settings || { query: 'steve' },
			fullUrl = api.url,
			data = { s: settings.query, api_key: api.key },
			deferred = Q.defer(),
			options = {
				host: api.url,
				path: api.defaultSearchEndpoint + '?' + queryString(data),
				port: '80',
				headers: {'custom': 'Custom Header Demo works'}
			},
			callback = function(response) {
				var result = '';

				response.on('data', function (chunk) {
					result += chunk;
				});

				response.on('end', function () {
					deferred.resolve(JSON.parse(result));
				});
			};

		http.request(options, callback)
			// End() causes the request to get sent,
			// i.e. "End of message"
			.end();

		return deferred.promise;
	}

	function translate(query) {
		return apiRequest({ query: query })
 			.then(function (data) {
 				/* Do something with resultant */
 			});
 	}

	return contract;
})();