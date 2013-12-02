
var http = require('http');
var _ = require('underscore');
var Q = require('q');

module.exports = (function() {
	var api = {
		key: 'dc6zaTOxFJmzC',
		url: 'api.giphy.com',
		defaultSearchEndpoint: '/v1/gifs/translate'
	};

	function queryString(data) {
		return _.map(data, function(val, key) {
			return key + '=' + val;
		}).join('&');
	}

	function apiRequest(settings) {
		var settings = settings || { query: 'steve' },
			fullUrl = api.url + (settings.endpoint || api.defaultSearchEndpoint),
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
			},
			// The actual request
			req = http.request(options, callback);

		req.end();

		return deferred.promise;
	}

	return {
		translate: function (query) {
			return apiRequest({ query: query })
	 			.then(function (data) {
		 				if (_.isEmpty(data) || _.isEmpty(data.data) || _.isEmpty(data.data.images)) {
		 					throw new Error("no results");
		 					return;
		 				}

		 				return {
		 					src: data.data.images.fixed_width.url
		 				};
		 			});
	 	}
	};
})();