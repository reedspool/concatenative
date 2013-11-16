$(function () {
	setupInput();
})

function setupInput() {
	$('.inputText').focus().on('keyup', function (e) {
		console.log(e.which)


		var input = $(this).val();
		$('.inputUrl').html(makeExecuteableLink(input));

		if (e.which == 13) {
			submit(input);	
		}
	});	
}

function makeExecuteableLink(input) {
	var data = {
		url: makeExecuteableUrl(input)
	};

	var link = '<a href="<%= url %>"><%= url %></a>'
	var maker = _.template(link);

	return $(maker(data))
}

function makeExecuteableUrl(input) {
	return '/exec/' + encodeURIComponent(input);
}

function submit(input) {
	location.href = makeExecuteableUrl(input)
}