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
var Parser = require('./parser.js'),
	Evaluator = require('./evaluator.js');

module.exports = {
	resolve: resolve
};

function resolve(input, body) {
	return Parser.parse(input, body)
		.then(Evaluator.execute)
}