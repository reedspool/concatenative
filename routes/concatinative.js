
/*
 * GET home page.
 */
var concat = require('../concatinative/lang.js'),
	Utility = require('../concatinative/lang-utility.js'),
	Routes = require('./routes-util.js');
	log = Utility.log,
	htmlRendererBuilder = Routes.rendererBuilder('html', 'concatinative'),
	jsonRendererBuilder = Routes.rendererBuilder('json');

module.exports = {
	exec: responder(htmlRendererBuilder),
	json: responder(jsonRendererBuilder)
}

function responder(builder) {
	return function(req, res) {
		var renderer = builder(res);
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
	var input = Utility.parsePathForExecuteable(req.url),
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