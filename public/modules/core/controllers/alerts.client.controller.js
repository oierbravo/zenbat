'use strict';

angular.module('core').controller('AlertsController', ['$scope',
	function($scope) {
			
	$scope.closeAlert = function(index) {
   	 $scope.alerts.splice(index, 1);
  };
	}
]);