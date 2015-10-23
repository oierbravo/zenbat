'use strict';


angular.module('core').controller('HomeController', ['$scope', 'Authentication','$http',
	function($scope, Authentication,$http) {
		// This provides Authentication context.
		$scope.pedidosFaltan = [];
		$scope.numComponentes = 0;
		$scope.pedidosProveedoresPendientes = [];
		$scope.authentication = Authentication;

$scope.predicate = 'fechaUnix';
$scope.reverse = false;

		$http.get('/get-home-data').success(function(success){
			console.log(success);
			$scope.pedidosFaltan = success.pedidosFaltan;
			$scope.numComponentes = success.numComponentes;
			$scope.pedidosProveedoresPendientes = success.pedidosProveedoresPendientes;
		});
	}
]);