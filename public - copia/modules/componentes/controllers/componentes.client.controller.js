'use strict';


angular.module('componentes').controller('ComponentesController', ['$scope', '$stateParams', '$location', 'Authentication', 'Componentes',
	function($scope, $stateParams, $location, Authentication, Componentes) {
		$scope.authentication = Authentication;

 		$scope.sortType     = 'name'; // set the default sort type
		  $scope.sortReverse  = false;  // set the default sort order
 		 $scope.searchString   = '';     // set the default search/filter term

 		 $scope.predicate = 'name';
         $scope.reverse = true;
		//console.log($scope); 
 		$scope.order = function(predicate) {
        	$scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
       	 	$scope.predicate = predicate;
      };


		$scope.create = function() {
			var componente = new Componentes({
				name: this.name,
				nProducto: this.nProducto,

			});
			componente.$save(function(response) {
				$location.path('componentes/' + response._id);

				$scope.name = '';
				$scope.nProducto = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		$scope.remove = function(componente) {
			if (componente) {
				componente.$remove();

				for (var i in $scope.componentes) {
					if ($scope.componentes[i] === componente) {
						$scope.componentes.splice(i, 1);
					}
				}
			} else {
				$scope.componente.$remove(function() {
					$location.path('componentes');
				});
			}
		};

		$scope.update = function() {
			var componente = $scope.componente;

			componente.$update(function() {
				$location.path('componentes/' + componente._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		$scope.find = function() {
			$scope.componentes = Componentes.query();
			//console.log($scope.componentes);
		};

		$scope.findOne = function() {

		

			$scope.componente = Componentes.get({

				componenteId: $stateParams.componenteId
			},function (componente){

			});
		};
		$scope.changeStock = function() {
			var componente = $scope.componente;
		

			$scope.componente = Componentes.get({

				componenteId: $stateParams.componenteId
			},function (componente){

			});
		};
	}
]);