'use strict';

module.exports = function(app) {
	// Root routing
	
	var database = require('../../app/controllers/database.server.controller');
	
	app.route('/historial').get(database.getHistorial);
};