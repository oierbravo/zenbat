'use strict';
var pedidosProveedores = require('../../app/controllers/pedidos-proveedores.server.controller');
var database = require('../../app/controllers/database.server.controller');

module.exports = function(app) {
	
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

	app.route('/pedidos-proveedores-ultimo')
		.get(database.getUltimoPedidoProveedores);

	app.route('/pedidos-proveedores-existe/:pedidoProveedoresExistsId')
		.get(database.pedidoProveedorExists);


	app.route('/add-to-pedido-proveedor')
		.post(database.addToPedidoProveedor);

	app.param('pedidoProveedoresExistsId', database.pedidoProveedorExistsById);
	app.param('pedidoProveedoresId', database.pedidoProveedorByID);

};