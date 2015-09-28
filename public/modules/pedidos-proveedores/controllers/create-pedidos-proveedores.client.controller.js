'use strict';

angular.module('pedidos-proveedores').controller('CreatePedidosProveedoresController', ['$scope', '$stateParams', '$location', 'Authentication','AlertasFactory','$modal','$log','PedidosProveedores','Proveedores','Almacenes',
	function($scope, $stateParams, $location, Authentication, AlertasFactory, $modal, $log,PedidosProveedores,Proveedores,Almacenes) {
		// Pedidos proveedores controller logic
		$scope.authentication = Authentication;
		

	}
]);