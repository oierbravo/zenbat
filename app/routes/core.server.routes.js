'use strict';

module.exports = function(app) {
	// Root routing
	var core = require('../../app/controllers/core.server.controller');
	app.route('/').get(core.index);
	app.route('/reload').get(core.reload);
	//app.route('/reload-all').get(core.reloadAll);
};