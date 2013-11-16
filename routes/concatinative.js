
/*
 * GET home page.
 */

var concat = require('../concatinative/lang.js');
var sys = require('sys');
var _ = require('underscore');
var Q = require('q');

exports.exec = function (req, res) {
	execute(req)
		.done(function (data) {
			res.render('concatinative', data);
		});
};

exports.json = function(req, res) {
	execute(req)
		.done(function (data) {
			res.writeHead(200, {"Content-Type": "application/json"});
			res.write(JSON.stringify(data));
			res.end();
		});
}

function execute (req) {
	log('Req url:', req.url);

	return concat.executeFromUrlPath(req.url)
		.then(function (data) {
			return _.extend(data, {
				title: 'Concatenative URL Language',
				repeatUrl: concat.makeExecutableUrl(req)
			});
		});
}

function log() {
	_.each(arguments, function (arg) {
		console.log(sys.inspect(arg));
	});
}