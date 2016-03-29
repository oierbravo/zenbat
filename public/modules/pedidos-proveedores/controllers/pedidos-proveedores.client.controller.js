'use strict';

angular.module('pedidos-proveedores').controller('PedidosProveedoresController', ['$scope', '$stateParams', '$location', 'Authentication','AlertasFactory','$modal','$log','PedidosProveedores','Proveedores','Almacenes','usSpinnerService','$http',
	function($scope, $stateParams, $location, Authentication, AlertasFactory, $modal, $log,PedidosProveedores,Proveedores,Almacenes,usSpinnerService,$http) {
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
		$scope.pedidoProveedor = {};
		$scope.showCompletados = false;
		var ultimoPedidoProveedor = PedidosProveedores.ultimo().$promise.then(
			function(success){
				//console.log(success);
				$scope.nPedido = success.data + 1;
			},
			function(reject){
				console.log(reject);
			});
		//$scope.nPedido = ultimoPedidoProveedor;
		console.log(ultimoPedidoProveedor);
		$scope.toggleShowCompletados = function(){
			$scope.showCompletados = !$scope.showCompletados
		}
		$scope.removeComponente = function(componenteId,update){
			var index;
			if(!update){
				index  = _.findIndex($scope.componentes,{codigo:componenteId});
				$scope.componentes.splice(index,1);
			} else {
				index  = _.findIndex($scope.pedidoProveedor.componentes,{codigo:componenteId});
				
				
				//$scope.pedidoProveedor.componentes.splice(index,1);
				$scope.pedidoProveedor.componentes[index].removed = true;

			}
		}
		$scope.calcularPreciosView = function(){
			if($scope.pedidoProveedor){
				
					_.forEach($scope.pedidoProveedor.componentes,function(el,ind){
						if(el.precioUnit){
							$scope.pedidoProveedor.componentes[ind].precioTotal = parseFloat(el.precioUnit)  * parseFloat(el.qty);
						} else {
							$scope.pedidoProveedor.componentes[ind].precioTotal = 0;
						}
					});
			} else {
				_.forEach($scope.componentes,function(el,ind){
						if(el.precioUnit){
							$scope.componentes[ind].precioTotal = parseFloat(el.precioUnit)  * parseFloat(el.qty);
						} else {
							$scope.componentes[ind].precioTotal = 0;
						}
					});
			}
		}
		$scope.calcularTotal = function(){
			console.log('calculando total...');
			$scope.calcularPreciosView();
			var componentes;

			if(!$scope.pedidoProveedor.componentes){
				componentes = $scope.componentes;
			} else {
				componentes = $scope.pedidoProveedor.componentes;
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
			console.log(componentes);
			$scope.pedidoProveedor.totalPedido = total;
			$scope.totalPedido = total;
			//return total;
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
				observaciones:this.observaciones,
				pedidosAsociados:this.pedidosAsociados,
				completado:false
			});
			//verificar que no existe.
			var existe
			PedidosProveedores.existe(
        		{pedidoProveedoresExistsId:this.nPedido}
        		).$promise.then(
        		function(success){
        			existe = success.existe;
        			var guardar = true;
        			if(existe){
        				
	        			if(confirm('El pedido ya existe, se sobreescribira. ¿Estas seguro?')) { 
        			
		        			//Guardando pedido a proveedor.
				        	console.log('aceptado sobreescribir');
				        	
							
						} else {
							console.log('cancelado');
							guardar = false;
						}
						
					}
					if(guardar){
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

								$scope.pedidosAsociados = [];

							}, function(errorResponse) {
								$scope.error = errorResponse.data.message;
							});
						}
        		},
        		function(reject){
        	
        			console.log(reject);
        		});

			
			
			/*
*/
			//console.log(pedidoProveedor);
		}
		$scope.open = function (size) {
			//$log.log($scope);
			//console.log('open');
			size = 'lg';
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
		      	element.removed = false;
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
			size = 'lg';
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
		      	} else {
		      		$scope.pedidoProveedor.componentes[compExist].removed = false;
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
			$scope.pedidoProveedor.completado = false;
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
        	$scope.state = 'list';
        	usSpinnerService.spin('cargador');
			$scope.pedidosProveedores = PedidosProveedores.query().$promise.then(function(data){
				usSpinnerService.stop('cargador');
				$scope.pedidosProveedores = data;
				console.log('pedidosProveedores',data);
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

        	//$scope.calcularTotal();
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
        		
        console.log($scope.pedidoProveedor);
        };
        $scope.remove = function() {
        	//console.log(pedidoProveedor);
        	if(confirm('Se eliminara el pedido ¿Estas seguro?')) { 
	        	//console.log($scope.pedidoProveedor);
	        	$scope.pedidoProveedor.pedidoProveedorId = $scope.pedidoProveedor.nPedido;
				

					$scope.pedidoProveedor.$remove(function(data) {
					//	console.log(data);
						$location.path('pedidos-proveedores');
					});
				
			}
		};
		$scope.completar = function(){
			if(confirm('Se va a marcar como completado ¿Estas seguro?')) {
				usSpinnerService.spin('cargador');
	        	console.log($scope.pedidoProveedor);
	        	$scope.pedidoProveedor.$completar(function(success){
	        		//console.log(success);
	        		AlertasFactory.show({message:'Pedido completado',type:'success'});
	        		$location.path('/pedidos-proveedores');
	        		
	        	});
	        	/*$scope.pedidoProveedor.pedidoProveedorId = $scope.pedidoProveedor.nPedido;
					$http.get('/pedidos-proveedores/' + $scope.pedidoProveedor.nPedido + '/completar').success(function(data){
						AlertasFactory.show({message:'Pedido completado',type:'success'});
						$location.path('pedidos-proveedores');
					});
				*/
					
				
			}
		};

	}
]);