'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var pedidos = require('../../app/controllers/pedidos.server.controller');

	// Pedidos Routes
	app.route('/pedidos')
		.get(pedidos.list);
		
	app.route('/pedidos/:pedidoId')
		.get(pedidos.read);
	

	// Finish by binding the Pedido middleware
	app.param('pedidoId', pedidos.pedidoByID);
};
