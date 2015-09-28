'use strict';

angular.module('core').controller('TableController', ['$scope', 
	function($scope) {
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
	}
]);