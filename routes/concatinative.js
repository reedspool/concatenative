
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
			fnAttachTitle = function (e) { 
				e.title = 'Concatenative URL Language';
				return e;
			},
			fnAttachRepeatUrl = function (e) {
				e.repeatUrl = Utility.makeExecutableUrl(req);
				return e;
			};	

		execute(req)
			.then(fnAttachTitle)
			.then(fnAttachRepeatUrl)
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

function execute (req) {
	return concat.resolveUrlPath(req.url, req.body);
}

function log() {
	_.each(arguments, function (arg) {
		console.log(sys.inspect(arg));
	});
}