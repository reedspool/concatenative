
/*
 * GET home page.
 */
var concat = require('../concatinative/lang.js'),
	Utility = require('../concatinative/lang-utility.js'),
	log = Utility.log;

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

		resolve(req)
			.then(fnAttach)
			.then(renderer, renderer)
			.done();
	}
}

function resolve(req) {
	var parts = Utility.parsePath(req.url),
		input = decodeURIComponent(parts[2]),
		fnAttach = function (e) {
			e.input = input;
			return e;
		},
		logger = function (title, important) {
			return function(e) {
				log(title, e[important]);
				return e;
			}
		};

	return concat.resolve(input, req.body)
		.then(fnAttach)
		.then(logger('Exec result: ', 'output'),
			logger('ERROR Exec:', 'message'));
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