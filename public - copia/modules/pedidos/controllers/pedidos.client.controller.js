'use strict';

// Pedidos controller
angular.module('pedidos').controller('PedidosController', ['$scope', '$stateParams', '$location', 'Authentication', 'Pedidos','Armarios',
	function($scope, $stateParams, $location, Authentication, Pedidos,Armarios) {
		$scope.authentication = Authentication;
		
		$scope.searchString   = '';     // set the default search/filter term
 		$scope.predicate = '';
        $scope.reverse = true;
		//console.log($scope); 
		$scope.armarios = Armarios;
 		$scope.order = function(predicate) {
        	$scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
       	 	$scope.predicate = predicate;
      };
		// Create new Pedido
		$scope.create = function() {
			// Create new Pedido object
			var pedido = new Pedidos ({
				name: this.name
			});

			// Redirect after save
			pedido.$save(function(response) {
				$location.path('pedidos/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Pedido
		$scope.remove = function(pedido) {
			if ( pedido ) { 
				pedido.$remove();

				for (var i in $scope.pedidos) {
					if ($scope.pedidos [i] === pedido) {
						$scope.pedidos.splice(i, 1);
					}
				}
			} else {
				$scope.pedido.$remove(function() {
					$location.path('pedidos');
				});
			}
		};

		// Update existing Pedido
		$scope.update = function() {
			var pedido = $scope.pedido;

			pedido.$update(function() {
				$location.path('pedidos/' + pedido._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Pedidos
		$scope.find = function() {
			console.log('pedidos find');
			$scope.pedidos = Pedidos.query();
			//console.log($scope.pedidos);
			//var armario = Armarios.get({armarioId:'203.14.800-E'});
			//console.log(armario);
		};

		// Find existing Pedido
		$scope.findOne = function() {
			console.log(' pedidos findone');
			var pedido = Pedidos.get({ 
				pedidoId: $stateParams.pedidoId
			});
			//console.log(pedido);
			$scope.pedido = pedido;

		};
		$scope.entregar = function(armarioId,qty) {
			console.log('entregar pedido');
			//console.log(armarioId);
			Armarios.entregar({
				armarioId: armarioId,
				qty: qty
			});
		}
		
	}
]);