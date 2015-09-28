'use strict';

//Pedidos service used to communicate Pedidos REST endpoints
angular.module('pedidos').factory('Pedidos', ['$resource',
	function($resource) {
		return $resource('pedidos/:pedidoId', { pedidoId: '@id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);