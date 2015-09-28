'use strict';

//Setting up route
angular.module('pedidos-proveedores').config(['$stateProvider',
	function($stateProvider) {
		// Pedidos proveedores state routing
		$stateProvider.
		state('create-pedido-proveedores', {
			url: '/pedidos-proveedores/create',
			templateUrl: 'modules/pedidos-proveedores/views/create-pedido-proveedores.client.view.html'
		}).
		state('view-pedido-proveedores', {
			url: '/pedidos-proveedores/:pedidoProveedorId',
			templateUrl: 'modules/pedidos-proveedores/views/view-pedido-proveedores.client.view.html'
		}).
		state('edit-pedido-proveedores', {
			url: '/pedidos-proveedores/:pedidoProveedorId/edit',
			templateUrl: 'modules/pedidos-proveedores/views/update-pedido-proveedores.client.view.html'
		}).
		state('list-pedidos-proveedores', {
			url: '/pedidos-proveedores',
			templateUrl: 'modules/pedidos-proveedores/views/list-pedidos-proveedores.client.view.html'
		});
	}
]);