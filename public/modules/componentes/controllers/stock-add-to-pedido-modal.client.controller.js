'use strict';

angular.module('componentes').controller('StockAddToPedidoModalController', ['$scope',  '$modalInstance', 'PedidosProveedores',
	function($scope, $modalInstance, PedidosProveedores,codigo) {
$scope.codigo = codigo;
	console.log($scope);
	  	console.log($modalInstance);
	  	
		$scope.pedidosProveedores = PedidosProveedores.query({status:'Pendiente'}).$promise.then(function(data){
			//console.log('PedidosProveedores.query',data);
			var output = [];
			data.forEach(function(el,ind){
				//console.log(el);

				
				if(el.status === 'Pendiente'){
					output.push(el);
				}
			});
			$scope.pedidosProveedores = output;
			$scope.elCargados = true;
		});
		//$scope.pedidosProveedores = PedidosProveedores.query({status:'Pendiente'})
	    $scope.searchString   = '';     // set the default search/filter term
 		$scope.predicate = 'nPedido';
        $scope.reverse = false;
        $scope.pedidoSeleccionado = '';
        $scope.order = function(predicate) {
        	$scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
       	 	$scope.predicate = predicate;
        };
	  $scope.ok = function () {
	  	
	  	//console.log($scope);
	  	//console.log($modalInstance);
	  	 //var componentesSeleccionados = _.filter($scope.componentes, 'seleccionado');
	  	 var pedidoSeleccionado = $scope.pedidoSeleccionado;
	  	 var qty = $scope.qty;
	  	 var unidad = $scope.unidad;
	  	 var output = {
	  	 	codigo: $scope.codigo,
	  	 	nPedido: pedidoSeleccionado,
	  	 	qty: qty,
	  	 	unidad: unidad
	  	 }
	  	 //console.log('pedidoSeleccionado',output);
	  	// _.forEach(componentesSeleccionados,function(element,index){
	  	// 	componentesSeleccionados[index].qty  = 0;
	  	// 	componentesSeleccionados[index].recibidos  = 0;
	  	// 	var componente =  {
	  	// 		qty: 0,
	  	// 		recibidos:0,
	  	// 		removed:false
	  	// 	};
	  	// 	_.extend(componente,element);
	  	

	  	// 	output.push(componente);
	  	// });
	    $modalInstance.close(output);
	  };
	  $scope.okResult = function(){
	  	$modalInstance.dismiss('cancel');
	  }
	  $scope.cancel = function () {
	    $modalInstance.dismiss('cancel');
	  };
	}
]);