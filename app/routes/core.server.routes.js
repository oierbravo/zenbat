'use strict';

module.exports = function(app) {
	// Root routing
	var core = require('../../app/controllers/core.server.controller');
	var database = require('../../app/controllers/database.server.controller');
	app.route('/').get(core.index);
	app.route('/reload-cli').get(database.reloadAllCli);
	app.route('/get-home-data').get(database.getHomeData);
	//app.route('/reload-all').get(core.reloadAll);
};