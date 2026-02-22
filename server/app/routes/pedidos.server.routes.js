'use strict';

module.exports = function(app) {
	var pedidos = require('../controllers/pedidos.server.controller');
	var database = require('../controllers/database.server.controller');
	// Pedidos Routes
	app.route('/pedidos')
		.get(pedidos.list);
		
	app.route('/pedidos/:pedidoId')
		.get(pedidos.read);
	

	// Finish by binding the Pedido middleware
	app.param('pedidoId', database.getPedidoById);
};
