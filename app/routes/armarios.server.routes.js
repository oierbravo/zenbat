'use strict';
var users = require('../../app/controllers/users.server.controller'),
	armarios = require('../../app/controllers/armarios.server.controller');
var json2xls = require('json2xls');
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
	app.use(json2xls.middleware);
	app.route('/armarios/:armarioId/exportar').get(armarios.exportar);
	// Finish by binding the article middleware
	app.param('armarioId', armarios.armarioByID);
};