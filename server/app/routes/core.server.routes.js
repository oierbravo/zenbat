'use strict';

module.exports = function(app) {
	var config = require('../../config/config');
	var core = require('../controllers/core.server.controller');
	var database = require('../controllers/database.server.controller');
	// Serve Angular app at / only when frontend mode is angular
	if (config.frontendMode === 'angular') {
		app.route('/').get(core.index);
	}
	app.route('/reload-cli').get(database.reloadAllCli);
	app.route('/get-home-data').get(database.getHomeData);
	app.route('/leyenda').get(database.getLeyenda);
	//app.route('/reload-all').get(core.reloadAll);
};