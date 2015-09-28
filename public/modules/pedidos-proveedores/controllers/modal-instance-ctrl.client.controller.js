'use strict';

angular.module('pedidos-proveedores').controller('ModalInstanceCtrlController', ['$scope','$modalInstance','Componentes',
	function($scope, $modalInstance, Componentes) {

		$scope.componentes = Componentes.query().$promise.then(function(data){
			console.log(data);
			data.forEach(function(el,ind){
				//console.log(el);
				el.seleccionado = false;
				data[ind] = el;
			});
			$scope.componentes = data;
		});

	    $scope.searchString   = '';     // set the default search/filter term
 		$scope.predicate = '';
        $scope.reverse = false;


	  $scope.ok = function () {
	  	var componentesSeleccionados = _.filter($scope.componentes, 'seleccionado');
	    $modalInstance.close(componentesSeleccionados);
	  };

	  $scope.cancel = function () {
	    $modalInstance.dismiss('cancel');
	  };
	}
]);