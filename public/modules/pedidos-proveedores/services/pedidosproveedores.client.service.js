'use strict';

angular.module('pedidos-proveedores').factory('PedidosProveedores', ['$resource',
	function($resource) {
		return $resource('pedidos-proveedores/:pedidoProveedorId', { pedidoProveedorId: '@pedidoProveedorId'
		}, {
			update: {
				method: 'PUT'
			},
			completar: {
				method: 'GET',
				url:'pedidos-proveedores/:pedidoProveedorId/completar',
				params:{pedidoProveedorId:'@pedidoProveedorId'}
			},
		});
	}
]);
