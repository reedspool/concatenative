 /* #    redis-denodeified
 * Offer a 'redis-url' interface which is
 * "denodeified" into Q promise land. 
 * Current phase: Proof of concept, hacking onto method of redis-url
 *
 * Requirements: q, redis, underscore
 *
 * Sample useage:
 * var redis = require('./redis-denodeified').connect(process.env.REDISTOGO_URL);
 * redis.hmset('index', 'key', 'val').done(console.log)
 *
 * Author: Reed Spool
 *
 * License: Beer License
 *
 * Beer License:
 *   The code is yours. Fork, create, steal, pull request. 
 *   If you meet me I hope you offer to buy me a beer to talk about it.
 *   I'll let you buy me a Whiskey Ginger intead.
 */
var Q = require('q');
var redis = require('redis-url');
var _ = require('underscore')

// DO THIS!!!
// TODO: FILL in this list with all redis-url supported methods
var commands_to_modify = ['append', 'hgetall','hmset', 'hget', 'hset'];

// Hijack connect to return a modified, Q-denodefied redis object
var original_connect = redis.connect;
var modified_connect = function () {
	var original_redis = original_connect.apply(this, arguments);
	modify_redis(original_redis);
	return original_redis;
};

function modify_redis(original) { 
	_.each(commands_to_modify, function (cmd) {
		overwriteDenodeified(original, cmd)
	});
}

var overwriteDenodeified = function (obj, nodeyMethod) {
	obj[nodeyMethod] = denodeifyAndBind(obj, nodeyMethod);
}

var denodeifyAndBind = function (obj, nodeyMethod) {
	return Q.denodeify(boundMethod(obj, nodeyMethod));
}

var boundMethod = function (obj, method) {
	return obj[method].bind(obj);
}

// Sole export is the original, modified redis object.
redis.connect = modified_connect;
module.exports = redis;
