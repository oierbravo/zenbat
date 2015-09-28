'use strict';


angular.module('armarios').controller('ArmariosController', ['$scope', '$stateParams', '$location', 'Authentication', 'Armarios','AlertasFactory','usSpinnerService',
	function($scope, $stateParams, $location, Authentication, Armarios,AlertasFactory,usSpinnerService) {
		$scope.authentication = Authentication;
	    $scope.searchString   = '';
 		$scope.predicate = 'id';
        $scope.reverse = true;
        $scope.elCargados = false;
 		$scope.order = function(predicate) {
        	$scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
       	 	$scope.predicate = predicate;
        };
		$scope.find = function() {
			 usSpinnerService.spin('cargador');
			$scope.armarios = Armarios.query().$promise.then(function(data){
				usSpinnerService.stop('cargador');
				$scope.armarios = data;
				$scope.elCargados = true;
			},function(reject){
				usSpinnerService.stop('cargador');
				AlertasFactory.showRejected(reject);
			});
		};

		$scope.findOne = function() {
 			usSpinnerService.spin('cargador');
			$scope.armario = Armarios.get({
				armarioId: $stateParams.armarioId
			}).$promise.then(function(data){
				usSpinnerService.stop('cargador');
				$scope.armario = data;
				$scope.elCargados = true;
			},function(reject){
				usSpinnerService.stop('cargador');
		
				AlertasFactory.showRejected(reject);
				
			});

		};
	}
]);