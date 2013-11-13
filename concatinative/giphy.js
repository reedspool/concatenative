
var http = require('http');
var _ = require('underscore');
var Q = require('q');

module.exports = (function(Q, http, _) {
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
		var settings = settings || { query: 'steve' };
 		var fullUrl = api.url + (settings.endpoint || api.defaultSearchEndpoint);
 		var data = { s: settings.query, api_key: api.key };
 		var deferred = Q.defer();
	 	var options = {
			host: api.url,
			path: api.defaultSearchEndpoint + '?' + queryString(data),
			port: '80',
			headers: {'custom': 'Custom Header Demo works'}
		};

		callback = function(response) {
			var str = ''
			response.on('data', function (chunk) {
				str += chunk;
			});

			response.on('end', function () {
				console.log(str);
				deferred.resolve(JSON.parse(str));
			});
		}

		var req = http.request(options, callback);
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
})(Q, http, _);