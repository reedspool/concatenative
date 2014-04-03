
/*
 * GET home page.
 */

var concat = require('../concatinative/lang.js');
var sys = require('sys');
var _ = require('underscore');
var Q = require('q');
var Utility = require('../concatinative/lang-utility.js');

exports.exec = responder(makeViewRenderer);
exports.json = responder(makeJsonRenderer);

function responder(makeRenderer) {
	return function(req, res) {	
		var renderer = makeRenderer(res),
			fnAttach = function (e) { 
				e.title = 'Concatenative URL Language';
				e.repeatUrl = Utility.makeExecutableUrl(req);
				return e;
			};	

		execute(req)
			.then(fnAttach)
			.then(renderer, renderer)
			.done();
	}
}

function makeViewRenderer(res) {
	return res.render.bind(res, 'concatinative');
}

function makeJsonRenderer(res) {
	return writeJson.bind(null, res);
}

function writeJson(res, data) {
	res.writeHead(200, {'Content-Type': 'application/json'});
	res.write(JSON.stringify(data));
	res.end();
}

function execute(req) {
	return resolveUrlPath(req.url, req.body);
}

function resolveUrlPath(path, body) {
	var parts = Utility.parsePath(path),
		input = decodeURIComponent(parts[2]),
		attachInput = function (e) {
			e.input = input;
			return e;
		},
		logger = function (title, important) {
			return function(e) {
				log(title, e[important]);
				return e;
			}
		};

	return concat.resolve(input, body)
		.then(attachInput)
		.then(logger('Exec result: ', 'output'),
			logger('ERROR Exec:', 'message'));
}

function log() {
	_.each(arguments, function (arg) {
		console.log(sys.inspect(arg));
	});
}