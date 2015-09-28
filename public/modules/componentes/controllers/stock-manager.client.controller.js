'use strict';

angular.module('componentes').controller('StockManagerController', ['$scope','Componentes',
	function($scope,Componentes) {
		// Stock manager controller logic
		// ...
		$scope.stockChange = function(id,qty){
		//	console.log($scope.componente);
		//	console.log('stockChange',id);
		//	console.log('stockChangeQty',qty);
			var nucomp = Componentes.stock({
				componenteId: id,
				qty: qty
			});
			//console.log('nucomp',nucomp);
			$scope.componente = nucomp;
		};
	}
]);