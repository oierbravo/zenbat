'use strict';


angular.module('armarios').controller('ArmariosController', ['$scope', '$stateParams', '$location', 'Authentication', 'Armarios',
	function($scope, $stateParams, $location, Authentication, Armarios) {
		$scope.authentication = Authentication;
	    $scope.searchString   = '';     // set the default search/filter term

 		 $scope.predicate = 'id';
         $scope.reverse = true;
		//console.log($scope); 
 		$scope.order = function(predicate) {
        	$scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
       	 	$scope.predicate = predicate;
        };
		$scope.find = function() {
			$scope.armarios = Armarios.query();
			//$scope.armarios = [];
		};

		$scope.findOne = function() {


			//console.log('findone');
		//	console.log($stateParams);
			$scope.armario = Armarios.get({

				armarioId: $stateParams.armarioId
			});
			//console.log(			$scope.armario );

		};
		$scope.verificar = function(){
			console.log('verificando');
		};
	}
]);