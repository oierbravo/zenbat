'use strict';

angular.module('pedidos').controller('VerificarStockController', ['$scope', '$modal',
	function($scope,$modal, $log) {
		$scope.statusPedido = 0;
		//console.log($scope);
		$scope.verificar = function(id,qty) {
			console.log('verificando pedido');
			//console.log(Armarios);
			var result;
			var status;
			var armarioDisponibilidad = $scope.armarios.verificar({
				armarioId: id,
				qty:qty
			}).$promise.then(function(arg){
				console.log(arg);
				$scope.pedido.stock = arg;
				//$scope.statusPedido = arg.status;
			});
		

		};
		

		
	}
]);