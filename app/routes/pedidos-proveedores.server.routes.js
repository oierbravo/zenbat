'use strict';

module.exports = function(app) {
	var pedidosProveedores = require('../../app/controllers/pedidos-proveedores.server.controller');
	var users = require('../../app/controllers/users.server.controller');
	// Pedidos Routes
	app.route('/pedidos-proveedores')
		.get(pedidosProveedores.list)
		.post(pedidosProveedores.create);

	app.route('/pedidos-proveedores/:pedidoProveedoresId')
		.get(pedidosProveedores.read)
		.put(pedidosProveedores.update)
		.delete(pedidosProveedores.delete);

	app.param('pedidoProveedoresId', pedidosProveedores.pedidoProveedorByID);

};