var _ = require('underscore');

module.exports = {
	create: create,
	basic: basic,
	quotation: quotation,
	link: link
};

function create(data) {
	var token = new _BasicToken();

	_.extend(token, data);

	if (typeof token.word == 'undefined') {
		throw new Error('Attempt to create token with no word');
	}

	switch (token.word) {
		case '+':
		case '-':
		case '*':
		case '/':
		case '%':
		case '[':
		case ']':
			token.operator = token.word;
			break;
	}

	if (token.word[0] == ':') {
		// This syntax is for giggles, I don't expect
		// it to work this way forever
		token.operator = token.word;
	}

	return token;
}

function _BasicToken() {
	this.operator = 'value';
	this.seperator = '/';
	// quacks like a duck;
	this._isToken = true;
	this.description = 'Not very exciting. I\'m just me.';
}

_BasicToken.prototype.toString = function () {
	return this.word.toString();
}

_BasicToken.prototype.booleanValue = function () {
	var isQuotientAndEmpty = this._isQuotation && _.isEmpty(this.words) && true;
	var isCharacterZero = this.word === '0' && true;
	return isQuotientAndEmpty || ! isCharacterZero ;
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

function link(protocol, quotation) {
	var data = _.extend({
		word: 'link',
		href: protocol + '://' + quotation.words.join('/'),
		operator: 'link',
		description: 'A portal to another piece of the Interweb.',
		toString: function () {
			// This is why I want atomic URLs!
			return quotation.toString() + ' ' + protocol + ' :link';
		},
		toHtml: function () {
			var template = '<a class="linkToken" href="/exec/<%= encodeURIComponent(toString()) %>"><%= toString() %></a>' +
							'<span> Follow it! </span><a class="link" href="<%= href %>"><%= href %></a>';

			// symptom of BROKE AS F*#$ 'INHERITANCE'
			return _BasicToken.prototype.toHtml.call(this,template);
		}
	});

	return create(data);
}