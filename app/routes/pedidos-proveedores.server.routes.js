'use strict';
var pedidosProveedores = require('../../app/controllers/pedidos-proveedores.server.controller');
var database = require('../../app/controllers/database.server.controller');

module.exports = function(app) {
	
	var users = require('../../app/controllers/users.server.controller');
	// Pedidos Routes
	app.route('/pedidos-proveedores')
		.get(pedidosProveedores.list)
		.post(pedidosProveedores.create);

	app.route('/pedidos-proveedores/:pedidoProveedoresId')
		.get(pedidosProveedores.read)
		.put(database.updatePedidoProveedor)
		.delete(database.deletePedidoProveedor);
	app.route('/pedidos-proveedores/:pedidoProveedoresId/completar')
		.get(database.completarPedidoProveedor);

	app.param('pedidoProveedoresId', database.pedidoProveedorByID);

};