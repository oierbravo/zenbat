'use strict';


angular.module('core').controller('HomeController', ['$scope', 'Authentication','$http','marked',
	function($scope, Authentication,$http,marked) {
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
			$scope.proximos = success.proximos;
			//$scope.leyenda = marked(success.leyenda);
			//$scope.leyenda = success.leyenda;
		});
		$http.get('/leyenda').success(function(success){
			$scope.leyenda = success;
			});
	}
]);