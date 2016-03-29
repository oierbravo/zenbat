'use strict';


angular.module('historial').controller('HistorialController', ['$scope', '$stateParams', '$location', 'Authentication','AlertasFactory','usSpinnerService','Historial',
	function($scope, $stateParams, $location, Authentication,AlertasFactory,usSpinnerService,Historial) {
		$scope.authentication = Authentication;
	    $scope.searchString   = '';
 		$scope.predicate = 'lid';
        $scope.reverse = true;
        $scope.elCargados = false;
        $scope.showAll = true;
 		$scope.order = function(predicate) {
        	$scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
       	 	$scope.predicate = predicate;
        };
        $scope.toggleCategoria = function(cat){
			$scope.showAll = false;
			switch(cat){
				
				case 'manual':
					$scope.showManual = !$scope.showManual;
					break
				case 'clientes':
					$scope.showClientes = !$scope.showClientes;
					break;
				case 'proveedores':
					$scope.showProveedores = !$scope.showProveedores;
					break;
				case 'all':
					$scope.showAll = true;
					$scope.showManual = false;
					$scope.showClientes = false;
					break;
			}
			if($scope.showManual === false){
				if($scope.showClientes === false){
					if($scope.showProveedores === false){
						console.log('gogo');
						$scope.showAll = true;
					}
				}
			}
		}
		$scope.find = function() {
			 usSpinnerService.spin('cargador');
			$scope.historial = Historial.query().$promise.then(function(data){
				usSpinnerService.stop('cargador');
				console.log(data);
				$scope.historial = data;
				$scope.elCargados = true;
			},function(reject){
				usSpinnerService.stop('cargador');
				AlertasFactory.showRejected(reject);
			});
		};

		$scope.findOne = function() {
 		/*	usSpinnerService.spin('cargador');
			$scope.armario = Armarios.get({
				armarioId: $stateParams.armarioId
			}).$promise.then(function(data){
				usSpinnerService.stop('cargador');
				$scope.armario = data;
				$scope.elCargados = true;
				console.log(data);
			},function(reject){
				usSpinnerService.stop('cargador');
		
				AlertasFactory.showRejected(reject);
				
			});
*/
		};
	}
]);