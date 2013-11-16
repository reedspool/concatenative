
/*
 * GET home page.
 */

var concat = require('../concatinative/lang.js');
var sys = require('sys');
var _ = require('underscore');
var Q = require('q');

exports.exec = responder(makeRenderer)

exports.json = responder(makeJsonRenderer)

function responder(createRenderer) {
	return function(req, res) {	
		var renderer = createRenderer(res);	
		execute(req)
			.then(renderer, renderer)
			.done();
	}
}
function makeRenderer(res) {
	return function (data) {
		res.render('concatinative', data);		
	}
}

function makeJsonRenderer(res) {
	return function (data) {
		log('Writing data', data)
		res.writeHead(200, {"Content-Type": "application/json"});
		res.write(JSON.stringify(data));
		res.end();
	}
}

function execute (req) {
	log('Req url:', req.url);

	return concat.executeFromUrlPath(req.url)
		.then(function (data) {
			log('Writing data', data)
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