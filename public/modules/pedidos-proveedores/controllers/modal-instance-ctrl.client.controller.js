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
 		$scope.predicate = 'idx';
        $scope.reverse = false;

        $scope.order = function(predicate) {
        	$scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
       	 	$scope.predicate = predicate;
        };
	  $scope.ok = function () {
	  	var output = [];
	  	var componentesSeleccionados = _.filter($scope.componentes, 'seleccionado');
	  	_.forEach(componentesSeleccionados,function(element,index){
	  		componentesSeleccionados[index].qty  = 0;
	  		componentesSeleccionados[index].recibidos  = 0;
	  		var componente = {
	  			codigo: element.codigo,
	  			denominacion:element.denominacion,
	  			pedidoMinimo: element.pedidoMinimo,
	  			precioUnit: element.precioUnit,
	  			qty: 0,
	  			recibidos:0,
	  			removed:false
	  		};
	  		output.push(componente);
	  	});
	    $modalInstance.close(output);
	  };

	  $scope.cancel = function () {
	    $modalInstance.dismiss('cancel');
	  };
	}
]);