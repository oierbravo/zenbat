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
		$scope.open = function (size) {

	    var modalInstance = $modal.open({
	      animation: $scope.animationsEnabled,
	      templateUrl: 'myModalContent.html',
	      controller: 'ModalInstanceCtrl',
	      size: size,
	      resolve: {
	        items: function () {
	          return $scope.pedido.stock;
	        },
	        pedido: function() {
	        	return $scope.pedido;
	        }
	      }
	    });

		};
		
	}
]);
angular.module('pedidos').controller('ModalInstanceCtrl', function ($scope, $modalInstance, items,pedido) {

  $scope.result = items;
  $scope.items =  items;
  $scope.pedido =  pedido;

  console.log($scope.pedido);

  $scope.ok = function () {
    $modalInstance.close();
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
});