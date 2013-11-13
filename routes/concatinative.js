
/*
 * GET home page.
 */

var concat = require('../concatinative/lang.js');
var sys = require('sys');
var _ = require('underscore');

exports.exec = function(req, res) {
	log('Req url:', req.url);
	var path = req.url.match(/exec(.*)/);

	if ( ! path ) {
		res.render('concatinative', {
			title: 'Error: Exec hit with no path'
		});
		return;
	}

	var input = decodeURIComponent(path[1]);

	var result = concat.resolve(input, 'ltr');

	log('Exec result: ', result); 
	res.render('concatinative', { 
		title: 'Concatinative URL Language', 
		result: JSON.stringify(result),
		input: input
	});
};

function log() {
	_.each(arguments, function (arg) {
		console.log(sys.inspect(arg));
	});
}