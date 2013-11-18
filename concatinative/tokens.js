var _ = require('underscore');

module.exports = {
	create: create,
	basic: basic,
	quotation: quotation,

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

		// This syntax is for giggles, I don't expect
		// it to work this way forever
		case ':if':
		case ':apply':
		case ':gif':
			token.operator = token.word;
			break;
	}

	return token;
}

function _BasicToken() {
	this.operator = 'value';
	this.seperator = '/';
	// quacks like a duck;
	this._isToken = true;
}

_BasicToken.prototype.toString = function () {
	return this.word.toString();
}

_BasicToken.prototype.booleanValue = function () {
	var isQuotientAndEmpty = this._isQuotation && _.isEmpty(this.words) && true;
	var isCharacterZero = this.word === '0' && true;
	return isQuotientAndEmpty || ! isCharacterZero ;
}

function basic(word) {
	return create({ word: word });
}

function quotation(data) {
	_.extend(data, {
		word: 'quotation', 
		words: [],
		operator: 'value',
		// quacks like a duck
		_isQuotation: true,
		toString: function () {
			var guts = _.map(this.words, function (token) {
				return token.toString();
			});

			return '[ ' + guts.join(' ') + ' ]';
		}
	});

	return create(data);
}