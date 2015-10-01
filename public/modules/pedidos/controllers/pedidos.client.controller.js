'use strict';

// Pedidos controller
angular.module('pedidos').controller('PedidosController', ['$scope', '$stateParams', '$location', 'Authentication', 'Pedidos','Armarios','AlertasFactory','usSpinnerService',
	function($scope, $stateParams, $location, Authentication, Pedidos,Armarios,AlertasFactory,usSpinnerService) {
		$scope.authentication = Authentication;
		
		$scope.searchString   = '';     // set the default search/filter term
 		$scope.predicate = 'fecha';
        $scope.reverse = false;
		$scope.armarios = Armarios;
		$scope.elCargados = false;
		$scope.showDisponibles = false;
		$scope.toggleShowDisponibles = function(){
			$scope.showDisponibles = !$scope.showDisponibles
		}

 		$scope.order = function(predicate) {
        	$scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
       	 	$scope.predicate = predicate;
        };
	
		$scope.find = function() {
			console.log('pedidos find');
			usSpinnerService.spin('cargador');

			$scope.pedidos = Pedidos.query().$promise.then(function(data){
				usSpinnerService.stop('cargador');
				$scope.pedidos = data;
				$scope.elCargados = true;
				console.log($scope.pedidos);
			},function(reject){
				usSpinnerService.stop('cargador');
		
				AlertasFactory.showRejected(reject);
				
			});
		};

		// Find existing Pedido
		$scope.findOne = function() {
			console.log(' pedidos findone');
			var pedido = Pedidos.get({ 
				pedidoId: $stateParams.pedidoId
			}).$promise.then(function(data){		
					usSpinnerService.stop('cargador');
					$scope.pedido = data;
					$scope.elCargados = true;
					console.log(' pedidos findone',data);				

			},function(reject){
				usSpinnerService.stop('cargador');
		
				AlertasFactory.showRejected(reject);
				
			});
		};
		$scope.entregar = function(armarioId,qty) {
			console.log('entregar pedido');
			Armarios.entregar({
				armarioId: armarioId,
				qty: qty
			});
		}
		
	}
]);