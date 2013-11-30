var _ = require('underscore');
var urlUtil = require('url');

module.exports = {
	create: create,
	basic: basic,
	quotation: quotation,
	link: link,
	linkFromSrc: linkFromSrc,
	f: f,
	img: img
};

function create(data) {
	var token = new _BasicToken();

	_.extend(token, data);

	if (typeof token.word == 'undefined') {
		throw new Error('Attempt to create token with no word');
	}
	
	// TODO: verify: token.operator should only be set once

	switch (token.word) {
		// Math
		case '+':
		case '-':
		case '*':
		case '/':
		case '%':

		// Quotations
		case '[':
		case ']':
			token.operator = token.word;
			return token;
	}

	switch (token.word[0]) {
		// Anything starting with a ! is the false value
		case '!':
			return f(token.word.slice(1));

		case ':':
			// This syntax is for giggles, I don't expect
			// it to work this way forever
			token.operator = token.word;
			return token;
	}

	// Setters and getters
	var doubleAtEnd = token.word.toString().match(/(.{1})\1$/);

	if (doubleAtEnd) {
		switch(doubleAtEnd[0]) {
			case '<<':
			case '>>':
				token.word = token.word.slice(0, token.word.indexOf(doubleAtEnd[0]));
				token.operator = doubleAtEnd[0];
				return token;
		}
	}

	return token;
}

function _BasicToken() {
	this.operator = 'value';
	this.seperator = '/';
	// quacks like a duck;
	this._isToken = true;
	this.properties = {};
	this.description = 'Not very exciting. I\'m just me.';
}

_BasicToken.prototype.toString = function () {
	return this.word.toString();
}

_BasicToken.prototype.booleanValue = function () {
	return ! this._isFalse;
}

_BasicToken.prototype.clone = function () {
	var frame = _.clone(this);
		
	frame.words = _.map(frame.words, function (word) {
		return word.clone();
	});

	return frame;
}

_BasicToken.prototype.toHtml = function (template) {
	var basicTemplate = '<a class="token" href="/exec/<%= toUriComponent() %>"><%= toString() %></a>';
	template = template || basicTemplate;
	var maker = _.template(template);
	return maker(this);
}

_BasicToken.prototype.toUriComponent = function () {
	return encodeURIComponent(this.toString());
}

function basic(word) {
	return create({ word: word });
}

function quotation(data) {
	data = _.extend({
		word: 'quotation', 
		words: [],
		operator: 'value',
		description: 'Your very own little program!',
		// quacks like a duck
		_isQuotation: true,
		toString: function () {
			var guts = _.map(this.words, function (token) {
				return token.toString();
			});

			return '[ ' + guts.join(' ') + ' ]';
		}
	}, data);

	return create(data);
}

function f(msg) {
	var token = create({
		word: 'false',
		operator: 'value',
		_isFalse: true,
		description: 'False value, message: ' + msg
	});

	token.word = '!' + msg;

	return token;
}

function linkFromSrc(src) {
	var sides = src.split(/:\/\//),
		quot = quotation();

	quot.words.push(sides[1]);

	return link(sides[0], quot);
}

function link(protocol, urlQuotation) {
	var data = {
		word: 'link',
		urlQuotation: urlQuotation,
		_isLink: true,
		protocol: protocol,
		operator: 'link',
		description: 'A portal to another piece of the Interweb.',
		// TODO: PROTOTYPAL INHERITANCE PLZKTHXBAI
		toHref: function () {
			var p = this.protocol,
				url = this.urlQuotation.words.join('/')

			return p + '://' + url;
		},
		toString: function () {
			// This is why I want atomic URLs!
			return urlQuotation.toString() + ' ' + protocol + ' :link';
		},
		toHtml: function () {
			var template = '<a class="linkToken" href="/exec/<%= encodeURIComponent(toString()) %>"><%= toString() %></a>' +
							'<span> Follow it! </span><a class="link" href="<%= toHref() %>"><%= toHref() %></a>';

			// symptom of BROKE AS F*#$ 'INHERITANCE'
			return _BasicToken.prototype.toHtml.call(this,template);
		},
		toOptions: function () {
			var href = this.toHref(),
				url = urlUtil.parse(href);

			return {
				protocol: this.protocol,
				host: url.host,
				path: url.path,
				port: '80',
				headers: {'custom': 'Custom Header Demo works'}
			}
		}
	};

	return create(data);
}

function img(data) {
	var data = _.extend({
			word: 'gif',
			link: link('http', quotation({words: ['loading.gif']})),
			_isGif: true,
			_isLink: true,
			description: 'A dancing image! From the future!',
			// TODO: PROTOTYPAL INHERITANCE PLZKTHXBAI
			toString: function () {
				// This is why I want atomic URLs!
				return this.link.toString() + ' :img';
			},
			toHtml: function () {
				var template = '<a class="linkToken" href="/exec/<%= encodeURIComponent(toString()) %>"><%= toString() %></a>' +
								'<img class="gif" src="<%= link.toHref() %>" />';

				// symptom of BROKE AS F*#$ 'INHERITANCE'
				return _BasicToken.prototype.toHtml.call(this,template);
			}
		}, data);

	return create(data);
}