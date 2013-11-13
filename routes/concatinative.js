
/*
 * GET home page.
 */

var concat = require('../concatinative/lang.js');
var sys = require('sys');
var _ = require('underscore');

exports.exec = function(req, res) {
	log('Req url:', req.url);
	var input = req.url.match(/exec(.*)/)[1];


	var result = concat.resolve(input, 'rtl');


	log('Exec result: ', result); 
	res.render('index', { 
		title: 'Concatinative URL Language', 
		result: JSON.stringify(result) 
	});
};

function log() {
	_.each(arguments, function (arg) {
		console.log(sys.inspect(arg));
	});
}