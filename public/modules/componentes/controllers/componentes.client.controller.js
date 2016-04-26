'use strict';


angular.module('componentes').controller('ComponentesController', ['$http','$scope', '$stateParams', '$location', 'Authentication', 'Componentes','usSpinnerService','AlertasFactory','$modal',
	function($http,$scope, $stateParams, $location, Authentication, Componentes,usSpinnerService,AlertasFactory,$modal) {
		$scope.authentication = Authentication;

 		$scope.searchString   = '';     // set the default search/filter term

 		$scope.predicate = 'row'; // set the default sort type
        $scope.reverse = false;  // set the default sort order
		//console.log($scope); 
		$scope.cargandoComps = true;
		$scope.compsCargados = false;

		$scope.showBajoMinimos = true;
		$scope.showNegatibos = true;
		$scope.showOk = false;

		$scope.toggleBajoMinimos = function(){
			$scope.showBajoMinimos = !$scope.showBajoMinimos;
		}
		$scope.toggleNegatibos = function(){
			$scope.showNegatibos = !$scope.showNegatibos;
		}
		$scope.toggleOk = function(){
			$scope.showOk = !$scope.showOk;
		}
 		$scope.order = function(predicate) {
        	$scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
       	 	$scope.predicate = predicate;
        };


		$scope.reloadFromFile = function(){
			usSpinnerService.spin('cargador');
			$scope.reloaded = Componentes.reloadFromFile().$promise.then(function(data){
				usSpinnerService.stop('cargador');
				AlertasFactory.show(data);
				console.log(data);
			},function(reject){
				usSpinnerService.stop('cargador');
			console.log(reject);
				AlertasFactory.showRejected(reject);
			});
		}
	
		$scope.find = function() {
			$scope.compsCargados = false;
			$scope.cargandoComps = true;
			 usSpinnerService.spin('cargador');
			$scope.componentes = Componentes.query().$promise.then(function(data){
				$scope.componentes = data;
				$scope.compsCargados = true;
				console.log(data);
				usSpinnerService.stop('cargador');
			},function(reject){
				usSpinnerService.stop('cargador');
		
				AlertasFactory.showRejected(reject);
				
			});
		};

		$scope.findOne = function() {

			$scope.componente = Componentes.get({

				componenteId: $stateParams.componenteId
			},function (componente){
				console.log(componente);
			});
		};
		$scope.changeStock = function() {
			var componente = $scope.componente;
		

			$scope.componente = Componentes.get({

				componenteId: $stateParams.componenteId
			},function (componente){

			});
		};
		$scope.addToPedido = function(codigo){
			console.log('addToPedido', codigo);
		}
		$scope.openModalAddToPedido = function (codigo) {
			//$log.log($scope);
			//console.log('open');
			console.log('addToPedido', codigo);
			var size = 'lg';
		    var modalInstance = $modal.open({
		      animation: $scope.animationsEnabled,
		      templateUrl: 'addToPedidoContent.html',
		      controller: 'StockAddToPedidoModalController',
		      size: size,
		
		      resolve: {
		        codigo: function () {
		          return "ppp";
		        }
		      }
		    });

		    modalInstance.result.then(function (modalOutput) {
		    	modalOutput.codigo = codigo;
		    	console.log(modalOutput);
		    	
		    	$http.post('/add-to-pedido-proveedor',modalOutput).then(
		    		function(success){
		    			console.log('success',success);
		    			alert(success.data.message);
		    			/*var modalInstance = $modal.open({
						      animation: $scope.animationsEnabled,
						      templateUrl: 'addToPedidoResult.html',
						      controller: 'StockAddToPedidoModalController',
						      size: 'sm',
						      
						      resolve: {
						        message: 
						          success.data.message
						        
						      }
						    });*/

		    		},function(fail){
		    			console.log('fail',fail);
		    			//alert(fail.data.message)
		    			alert("Ha habido un error");
		    		}
		    	);
		      /*var selected = selectedItem;
		      //console.log(selected);
		      selected.forEach(function(element,index){
		      	element.removed = false;
		      	var compExist = _.findIndex($scope.componentes,'codigo',element.codigo);
		      	//$scope.componentes.push(element);
		      	if(compExist === -1){
		      		element.weight = $scope.lastWeight++;
		      		$scope.componentes.push(element);
		      		$scope.totalPedido = $scope.calcularTotal($scope.componentes);
		      	}
		      });*/
		    }, function () {
		     // $log.info('Modal dismissed at: ' + new Date());++
		    });
	  };
	}
]);