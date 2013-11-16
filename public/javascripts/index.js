$(function () {
	setupInput();
	updateInputUrl('');
})

function getInput() {
	return $('.inputText').val();
}

function setupInput() {
	$('.inputText').focus().on('keyup', function (e) {
		console.log(e.which);

		updateInputUrl();

		if (e.which == 13) {
			submit();	
		}
	});	
}

function updateInputUrl() {
	$('.inputUrl').html(makeExecuteableLink(getInput()));
}

function makeExecuteableLink(input) {
	console.log(input)
	var data = {
		url: makeExecuteableUrl(input, true),
		urlUnencoded: makeExecuteableUrl(input, false)
	};

	var link = '<a href="<%= url %>"><%= urlUnencoded %></a>'
	var maker = _.template(link);

	return $(maker(data))
}

function makeExecuteableUrl(input, encode) {
	if (encode) input = encodeURIComponent(input);
	return '/exec/' + input;
}

function submit() {
	location.href = makeExecuteableUrl(getInput())
}