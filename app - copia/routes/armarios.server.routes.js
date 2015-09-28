'use strict';
var users = require('../../app/controllers/users.server.controller'),
	armarios = require('../../app/controllers/armarios.server.controller');

module.exports = function(app) {
	app.route('/armarios')
		.get(armarios.list);
		//.post(users.requiresLogin, componentes.create);

	app.route('/armarios/:armarioId')
		.get(armarios.read);
	app.route('/armarios/:armarioId/verificar')
		.get(armarios.verificar);
	app.route('/armarios/:armarioId/entregar')
		.get(armarios.entregar);
		//.put(users.requiresLogin, componentes.hasAuthorization,  componentes.update)
		//.delete(users.requiresLogin, componentes.hasAuthorization,componentes.delete);

	// Finish by binding the article middleware
	app.param('armarioId', armarios.armarioByID);
};