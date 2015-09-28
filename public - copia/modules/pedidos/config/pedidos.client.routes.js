'use strict';

//Setting up route
angular.module('pedidos').config(['$stateProvider',
	function($stateProvider) {
		// Pedidos state routing
		$stateProvider.
		state('listPedidos', {
			url: '/pedidos',
			templateUrl: 'modules/pedidos/views/list-pedidos.client.view.html'
		}).
		state('createPedido', {
			url: '/pedidos/create',
			templateUrl: 'modules/pedidos/views/create-pedido.client.view.html'
		}).
		state('viewPedido', {
			url: '/pedidos/:pedidoId',
			templateUrl: 'modules/pedidos/views/view-pedido.client.view.html'
		}).
		state('editPedido', {
			url: '/pedidos/:pedidoId/edit',
			templateUrl: 'modules/pedidos/views/edit-pedido.client.view.html'
		});
	}
]);