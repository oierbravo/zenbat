'use strict';

angular.module('pedidos-proveedores').controller('PedidosProveedoresController', ['$scope', '$stateParams', '$location', 'Authentication','AlertasFactory','$modal','$log','PedidosProveedores','Proveedores','Almacenes','usSpinnerService',
	function($scope, $stateParams, $location, Authentication, AlertasFactory, $modal, $log,PedidosProveedores,Proveedores,Almacenes,usSpinnerService) {
		// Pedidos proveedores controller logic
		$scope.authentication = Authentication;
		
		$scope.searchString   = '';     // set the default search/filter term
 		$scope.predicate = 'fecha';
        $scope.reverse = false;

		$scope.elCargados = false;
		
		$scope.pedidosProveedores = [];
		$scope.componentes = [];
		$scope.listProveedores = Proveedores.getAll();
		$scope.listAlmacenes = Almacenes.getAll();
		$scope.totalPedido = 0;
		$scope.removeComponente = function(componenteId,update){
			var index;
			if(!update){
				index  = _.findIndex($scope.componentes,{codigo:componenteId});
				$scope.componentes.splice(index,1);
			} else {
				index  = _.findIndex($scope.pedidoProveedor.componentes,{codigo:componenteId});
				$scope.pedidoProveedor.componentes.splice(index,1);
			}
		}
		$scope.calcularTotal = function(componentes){
			if(!componentes){
				return 0;
			}
			var total = 0;
			componentes.forEach(function(element,index){
				if(element.precioUnit){
					var sub_total = parseFloat(element.precioUnit) * parseFloat(element.qty);
					if(_.isNumber(sub_total)){
						total += sub_total;
					}
				}
			});
			$scope.totalPedido = total;
			return total;
		};
		$scope.create = function(){
			//$log.log($scope);
			var self = this;
			var comps = [];
			if(_.isEmpty(self.componentes)){
				self.componentes = [];
			}
			self.componentes.forEach(function(element,index){
				//console.log('componente-' + index,element);
				if(_.isUndefined(element.qty)){
					self.componentes[index].qty = 0;
				}
			});
			var pedidoProveedor = new PedidosProveedores({
				nPedido: this.nPedido,
				fecha:this.fecha,
				fechaEntrega: this.fechaEntrega,
				proveedor: this.proveedor,
				almacen: this.almacen,
				componentes:this.componentes,
				observaciones:this.observaciones
			});
			
			pedidoProveedor.$save(function(response) {
				//console.log(response);
				$location.path('pedidos-proveedores/' + response.pedidoProveedorId);

				$scope.nPedido = '';
				$scope.fecha = '';
				$scope.proveedor = '';
				$scope.fechaDeEntrega = '';
				$scope.almacen = '';
				$scope.componentes = [];
				$scope.observaciones = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
			//console.log(pedidoProveedor);
		}
		$scope.open = function (size) {
			//$log.log($scope);
			//console.log('open');
		    var modalInstance = $modal.open({
		      animation: $scope.animationsEnabled,
		      templateUrl: 'myModalContent.html',
		      controller: 'ModalInstanceCtrlController',
		      size: size,
		      resolve: {
		        componentes: function () {
		          return $scope.componentes;
		        }
		      }
		    });

		    modalInstance.result.then(function (selectedItem) {
		      var selected = selectedItem;
		      //console.log(selected);
		      selected.forEach(function(element,index){
		      	var compExist = _.findIndex($scope.componentes,'codigo',element.codigo);
		      	//$scope.componentes.push(element);
		      	if(compExist === -1){

		      		$scope.componentes.push(element);
		      		$scope.totalPedido = $scope.calcularTotal($scope.componentes);
		      	}
		      });
		    }, function () {
		     // $log.info('Modal dismissed at: ' + new Date());++
		    });
	  };
	  $scope.openEdit = function (size) {
			//$log.log($scope);
			//console.log('open');
		    var modalInstance = $modal.open({
		      animation: $scope.animationsEnabled,
		      templateUrl: 'myModalContent.html',
		      controller: 'ModalInstanceCtrlController',
		      size: size,
		      resolve: {
		        componentes: function () {
		          return $scope.pedidoProveedor.componentes;
		        }
		      }
		    });

		    modalInstance.result.then(function (selectedItem) {
		      var selected = selectedItem;
		      //console.log(selected);
		      selected.forEach(function(element,index){
		      	var compExist = _.findIndex($scope.pedidoProveedor.componentes,'codigo',element.codigo);
		      	//$scope.componentes.push(element);
		      	if(compExist === -1){

		      		$scope.pedidoProveedor.componentes.push(element);
		      		$scope.totalPedido = $scope.calcularTotal($scope.pedidoProveedor.componentes);
		      	}
		      });
		    }, function () {
		     // $log.info('Modal dismissed at: ' + new Date());
		    });
	  };
	  $scope.toggleAnimation = function () {
	    $scope.animationsEnabled = !$scope.animationsEnabled;
	  };
	  $scope.update = function() {
	  	//console.log(this);
	  	//console.log($scope);
	  	//console.log(this.almacen);
			var pedidoProveedor = $scope.pedidoProveedor;
			//pedidoProveedor.almacen = pedidoProveedor.almacen;
			//pedidoProveedor.proveedor = pedidoProveedor.proveedor;
			//console.log(pedidoProveedor);
			pedidoProveedor.$update(function() {
				$location.path('pedidos-proveedores/' + pedidoProveedor.pedidoProveedorId);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};
 		$scope.order = function(predicate) {
        	$scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
       	 	$scope.predicate = predicate;
        };
        $scope.find = function(){
        	usSpinnerService.spin('cargador');
			$scope.pedidosProveedores = PedidosProveedores.query().$promise.then(function(data){
				usSpinnerService.stop('cargador');
				$scope.pedidosProveedores = data;
				$scope.elCargados = true;
			},function(reject){
				usSpinnerService.stop('cargador');
		
				AlertasFactory.showRejected(reject);
				
			});
        };
        $scope.findOne = function(){
        	$scope.pedidoProveedor =  PedidosProveedores.get(
        		{pedidoProveedorId:$stateParams.pedidoProveedorId}
        		);
        	/*$scope.pedidoProveedor = PedidosProveedores.get(
        		{pedidoProveedorId:$stateParams.pedidoProveedorId}
        		).$promise.then(function(data){
        			//$scope.pedidoProveedor = data;
        			$scope.calcularTotal(data.componentes);
        			//console.log($scope.pedidoProveedor);
        			$scope.fallo = false;
        		},function(reject){
        			$scope.fallo = true;
        			console.log(reject);
        			AlertasFactory.showRejected(reject);
        		});*/
        		
        //console.log($scope.pedidoProveedor);
        }
        $scope.remove = function() {
        	//console.log(pedidoProveedor);
        	if(confirm('Are you sure?')) { 
	        	//console.log($scope.pedidoProveedor);
	        	$scope.pedidoProveedor.pedidoProveedorId = $scope.pedidoProveedor.nPedido;
				

					$scope.pedidoProveedor.$remove(function(data) {
					//	console.log(data);
						$location.path('pedidos-proveedores');
					});
				
			}
		};

	}
]);