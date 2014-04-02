/*
 *	Concatinate URL Language
 *
 * 	This document defines the yet nameless 
 *  concatinative language for interpolation
 *  in URLs (or URI's?)
 *
 *	Author: Reed Spool
 *  Begin date: 12/11/2013
 * 
 *  License: TBD
 */
var _ = require('underscore'),
	sys = require('sys'),
	Giphy = require('./giphy.js'),
	Q = require('q'),
	expect = require('expect.js'),
	TokenFactory = require('./tokens.js'),
	Parser = require('./parser.js'),
	aliases = require('./aliases.js'),
	Utility = require('./lang-utility.js'),
	Evaluator = require('./evaluator.js'),
	log = Utility.log;

module.exports = {
	resolveUrlPath: resolveUrlPath,
	resolve: resolve
};


// Testing paths to see what URI encoding does:
// Tested Url:
// http://localhost:3000/forward_slash/changes%20to/right/slash/wefawe$@@!@/w23@!/2/43/@/$//5E/&*()-+%20%5E;a.a,a/'%22double/quote%7Cpipe~%60backtick
// 
// Path in Node:
// /forward_slash/changes%20to/right/slash/wefawe$@@!@/w23@!/2/43/@/$//5E/&*()-+%20%5E;a.a,a/\'%22double/quote%7Cpipe~%60backtick

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

	return resolve(input, body)
		.then(attachInput)
		.then(logger('Exec result: ', 'output'),
			logger('ERROR Exec:', 'message'));
}

function resolve(input, body) {
	return Parser.parse(input, body)
		.then(Evaluator.execute)
}