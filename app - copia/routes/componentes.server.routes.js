'use strict';

/**
 * Module dependencies.
 */
var users = require('../../app/controllers/users.server.controller'),
	componentes = require('../../app/controllers/componentes.server.controller');

module.exports = function(app) {
	// Article Routes
	app.route('/stock')
		.get(componentes.list);
	app.route('/componentes')
		.get(componentes.list);
	
	app.route('/componentes/:componenteId')
		.get(componentes.read);
	
	app.route('/componentes/:componenteId/verificar')
		.get(componentes.read);
	app.route('/componentes/:componenteId/stock')
		.get(componentes.stock);
		
	// Finish by binding the article middleware
	app.param('componenteId', componentes.componenteByID);
};