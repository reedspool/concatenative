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
	Evaluator = require('./newEvaluator.js'),
	Modules = require('./modules.js'),
	core = require('./core-module.js');

module.exports = {
	resolve: resolve,
	load: load
};

initialLoad();

function initialLoad() {
	load(core);
}

function resolve(input, body) {
	return Parser.parse(input, body)
		.then(Evaluator.execute)
}

function load(module) {
	Modules.register(module);
}