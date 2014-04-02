var _ = require('underscore');
var urlUtil = require('url');

module.exports = {
	create: create,
	basic: basic,
	quotation: quotation,
	link: link,
	linkFromSrc: linkFromSrc,
	f: f,
	img: img,
	file: file,
	form: form,
	accessor: accessor,
	mutator: mutator
};

function create(data) {
	var token = new BasicToken();

	_.extend(token, data);

	if (typeof token.word == 'undefined') {
		throw new Error('Attempt to create token with no word');
	}
	
	// Everything, now til the end of 
	// this function, is just to set
	// token.operator correctly
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

	// The whole word didn't match our expectations,
	// so maybe the first character will tell us something
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

	// Okay so the first character was uninteresting alone,
	// what about the last two characters?

	// Setters and getters
	var doubleAtEnd = token.word.toString().match(/(.{1})\1$/);

	if (doubleAtEnd) {
		var withoutDouble =  token.word.toString().slice(0, token.word.toString().indexOf(doubleAtEnd[0]));
		switch(doubleAtEnd[0]) {
			case '<<':
				return mutator(withoutDouble);
			case '>>':
				return accessor(withoutDouble);
		}
	}

	return token;
}

function BasicToken() {
	this.operator = 'value';
	this.seperator = '/';
	// quacks like a duck;
	this._isToken = true;
	this.properties = {};
	this.description = 'Not very exciting. I\'m just me.';
}

BasicToken.prototype.toString = function () {
	return this.word.toString();
}

BasicToken.prototype.booleanValue = function () {
	return ! this._isFalse;
}

BasicToken.prototype.clone = function () {
	var frame = _.clone(this);
		
	frame.words = _.map(frame.words, function (word) {
		return word.clone();
	});

	return frame;
}

BasicToken.prototype.toHtml = function (template) {
	var basicTemplate = '<a class="token" href="/exec/<%= toUriComponent() %>"><%= toString() %></a>';
	template = template || basicTemplate;
	var maker = _.template(template);
	return maker(this);
}

BasicToken.prototype.toUriComponent = function () {
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
				}),
				center = _.isEmpty(guts) ? '' : guts.join(' ') + ' ';

			return '[ ' + center + ']';
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
			return BasicToken.prototype.toHtml.call(this,template);
		},
		toOptions: function () {
			var href = this.toHref(),
				url = urlUtil.parse(href);

			return {
				PROTOCOL: this.protocol,
				hostname: url.host,
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
			word: 'img',
			link: link('http', quotation({ words: ['loading.gif'] })),
			_isImg: true,
			description: 'An image, from elsewhere on the Internet',
			// TODO: PROTOTYPAL INHERITANCE PLZKTHXBAI
			toString: function () {
				// This is why I want atomic URLs!
				return this.link.toString() + ' :img';
			},
			toHtml: function () {
				var template = '<a class="linkToken" href="/exec/<%= encodeURIComponent(toString()) %>"><%= toString() %></a>' +
								'<img class="gif" src="<%= link.toHref() %>" />';

				// symptom of BROKE AS F*#$ 'INHERITANCE'
				return BasicToken.prototype.toHtml.call(this,template);
			}
		}, data);

	return create(data);
}

function file(data) {
	var data = _.extend({
			word: 'file',
			contents: '',
			_isFile: true,
			description: 'Any ol\' data',
			// TODO: PROTOTYPAL INHERITANCE PLZKTHXBAI
			toString: function () {
				return encodeURIComponent(this.contents) + ' :file';
			},
			toHtml: function () {
				var template = '<a class="linkToken" href="/exec/<%= encodeURIComponent(toString()) %>"><%= toString() %></a>' +
								'<p class="file"><%= contents %></p>';

				// symptom of BROKE AS F*#$ 'INHERITANCE'
				return BasicToken.prototype.toHtml.call(this,template);
			}
		}, data);

	return create(data);
}

function form(actionQuotation, inputQuotation) {
	var data = _.extend({
			word: 'form',
			action: actionQuotation,
			inputs: inputQuotation,
			_isForm: true,
			description: 'A simple question, with a not so simple answer',
			// TODO: PROTOTYPAL INHERITANCE PLZKTHXBAI
			toString: function () {
				return actionQuotation.toString() + ' ' +
						inputQuotation.toString() + ' :form';
			},
			toHtml: function () {
				var template = '<a class="linkToken" href="/exec/<%= encodeURIComponent(toString()) %>"><%= toString() %></a>' +
								'<form method="post" action="/exec/:formresponse/<%= action.words.join("/") %>">' +
									'<% _.each(inputs.words, function (word) { %>' +
										'<input name="<%= word %>" placeholder="<%= word %>" />' +
									'<% }); %>' +
									'<input type="submit" value="Run it" />' +
								'</form>';

				// symptom of BROKE AS F*#$ 'INHERITANCE'
				return BasicToken.prototype.toHtml.call(this,template);
			}
		}, data);

	return create(data);
}

function accessor(property) {
	var data = _.extend({
			word: 'accessor',
			operator: '>>',
			property: property,
			_isAccessor: true,
			description: 'I get the value of a property',
			// TODO: PROTOTYPAL INHERITANCE PLZKTHXBAI
			toString: function () {
				return this.property + this.operator;
			}
		}, data);

	return create(data);
}

function mutator(property) {
	var data = _.extend({
			word: 'mutator',
			operator: '<<',
			property: property,
			_isMutator: true,
			description: 'I change a property',
			// TODO: PROTOTYPAL INHERITANCE PLZKTHXBAI
			toString: function () {
				return this.property + this.operator;
			}
		}, data);

	return create(data);
}