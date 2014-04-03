module.exports = {
	rendererFor: rendererFor,
	rendererBuilder: rendererBuilder
}

function rendererBuilder(a,r,g,s) {
	var args = [].slice.apply(arguments);
	
	return function (res) {
		return rendererFor.apply(null, [res].concat(args));
	}
}

function rendererFor(res, type, which) {
	switch (type) {
		case 'html':
			return makeViewRenderer(res, which);
		case undefined:
		case 'json':
		default:
			return makeJsonRenderer(res);
	}
}

function makeViewRenderer(res, which) {
	var bound = res.render.bind(res);

	if (which) bound = bound.bind(null, which)

	return bound;		
}

function makeJsonRenderer(res) {
	return writeJson.bind(null, res);
}

function writeJson(res, data) {
	res.writeHead(200, {'Content-Type': 'application/json'});
	res.write(JSON.stringify(data));
	res.end();
}