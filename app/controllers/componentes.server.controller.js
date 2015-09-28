'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	
	_ = require('lodash');

require('array.prototype.find');
var XLSX = require('xlsx');

var Pedidos =  require('./pedidos.server.controller');
var PedidosProveedores =  require('./pedidos-proveedores.server.controller');

var cache = require('memory-cache');
var zenbatConfig = require('../../zenbat.config.js');

var flatfile = require('flat-file-db');
var dbProductos = flatfile.sync(zenbatConfig.basePath + 'db\\productos.db');
var dbProductosReservados = flatfile.sync(zenbatConfig.basePath + 'db\\productos-reservados.db');
var dbProductosPendientes = flatfile.sync(zenbatConfig.basePath + 'db\\productos-pendientes.db');


var fileProductos = zenbatConfig.componentes.file;
var headerProductos = zenbatConfig.componentes.header;
var headerStock = zenbatConfig.stock.header;
	var json2xls = require('json2xls');

exports.componentesArray = [];
exports.componentes = [];

exports.workbook = '';

exports.componentesReservados = [];

var reloadComponentes = true;
var fileProductosChanged = true;
var firstLoad = true;


/*var chokidar = require('chokidar');
var watcher = chokidar.watch(zenbatConfig.basePath , {
  ignored: /[\/\\]\./,
  persistent: true
});
*/
/*watcher.on('change',function(path){
  if(path.indexOf('productos.xlsx') !== -1){
 	console.log('cambios en productos.xlsx');
 	fileProductosChanged = true;
 	cache.put('componentes-changed',true);
  }
});*/
function a(componenteId){
	var componente = dbProductos.get(componenteId);
}
function updateComponentesFromFile(){
	var componentesFromFile = loadComponentesFromFile();
	componentesFromFile.forEach(function(element,index){
		var dbComp = getComponenteById(element.codigo);
		var result = _.extend(dbComp,element);
		dbProductos.put(element.codigo,result);
		exports.componentes[index] = output;
	});

}
exports.reloadComponentesFromFile = function(req,res){
	updateComponentesFromFile();
	res.status(200);

}
function mergeArrays(arr1,arr2){
	var result = [];
	arr1.forEach(function(element,index){
		_.merge(element, arr2[index]);
		result.push(element);
	});
	return result;
}

function loadComponenteDb(componente){
	var output;
	var dbFields;
	if(dbProductos.has(componente.codigo)){
		dbFields = dbProductos.get(componente.codigo);
		if(fileProductosChanged){
			dbFields = {
				cantidad:dbFields.cantidad
				,cantidadReservada:dbFields.cantidadReservada
			}
		}
		 
	} else {
		dbFields = {
			cantidad: 0,
			cantidadReservada: 0
		};
	}
	output = _.merge(componente,dbFields);
	return output;
}
function loadComponentesFilter(element,index){
				var result = false;
				if(element.stockSeguridad){
					result = true;
				} else {
					result = false;
				}
				if(element.codigo === '0'){
				
					result = false;
				}
				if(element.codigo === ''){

					result =  false;
				}
				if(element.codigo === ' '){

					result =  false;
				}
				if(result === false){
					//console.log(element);
				}
		  	 return result;
	    
}
function loadComponentesForEach(element,index){
	var cached = dbProductos.get(element.codigo);
	cached = false;
	if(cached){
		element = cached;

		componentes[index] = cached;
		return element;
	} else {
    	element = loadComponenteDb(element);
		element.cantidadReservada = 0;
		//element.pedidos = [];
    	element.idx = index;
    	
		if(!element.pedidos){
			element.pedidos = [];
		}

		if(!element.pedidosProveedores){
			element.pedidosProveedores = [];
		}


		
		exports.compIDs.push(element.codigo);
		if(_.isNull(element.cantidad)) {
			element.cantidad = 0;
		} 
		exports.componentes[index] = calcularCosas(element);

		dbProductos.put(element.codigo,exports.componentes[index] );
	}    
}
function calcularCosas(componente){
	componente.status = '';
	componente.status = 'ok';

	var totalReservas = getReservaTotal(componente);
	var totalPedidosProveedores = getProveedoresTotal(componente);
    var usable = parseFloat(componente.cantidad) - totalReservas ;
    var stockMinimo = parseFloat(componente.stockSeguridad);
    var usableFuturo = usable + totalPedidosProveedores;
    var cantReservas = componente.pedidos.length;
    var cantPedidosProveedores = componente.pedidosProveedores.length;
    console.log(componente);
    componente.totalReservas = totalReservas;
    componente.totalPedidosProveedores = totalPedidosProveedores;
    componente.usable = usable;

    componente.cantReservas = cantReservas;
    componente.cantPedidosProveedores = cantPedidosProveedores;


   if(usable < 0){
		componente.status = 'negatibo';
    	if(totalReservas > 0){
    		componente.status += 'ConReserva';
    	}
    } else {
    	if(usable < stockMinimo){
	    	componente.status = 'bajoMinimos';
	    	if(totalReservas > 0){
	    		componente.status += 'ConReserva';
	    	}
   		}
    }
    if(totalPedidosProveedores > 0){
	    if(usableFuturo < 0){
			componente.status = 'negatiboFuturo';
	    	if(totalReservas > 0){
	    		componente.status += 'ConReserva';
	    	}
	    } else {
	    	if(usableFuturo < stockMinimo){
		    	componente.status = 'bajoMinimosFuturo';
		    	if(totalReservas > 0){
		    		componente.status += 'ConReserva';
		    	}
	   		}
	    }
	}


	return updateComponente(componente);
}
function loadComponentes(clearCache){
	if(typeof clearCache === undefined){
		clearCache = false;
	}
	exports.compIDs = [];
	var componentes = [];
	var dbKeys = dbProductos.keys();
	dbKeys.forEach(function(element,index){
		var dbComp = getComponenteById(element);
		componentes.push(dbComp);
	});
    componentes.forEach(loadComponentesForEach);
    //exports.componentes = componentes;
    cache.put('componentes-cargados',true);
    if(!cache.get('pedidos-cargados')){
	//	Pedidos.reload();
	}
	
	if(firstLoad){
		firstLoad = false;
	}
	
	//Pedidos.loadPedidos();
}
function loadComponentesFromFile(){
	var workbook = XLSX.readFileSync(zenbatConfig.basePath + 'productos.xlsx');
			exports.workbook = workbook;
			var componentesRaw = XLSX.utils.sheet_to_json(workbook.Sheets.componentes,{header:headerProductos,range:1});
			var componentes = componentesRaw.filter(loadComponentesFilter);
			return componentes;
}
exports.loadComponentesFromFile = loadComponentesFromFile;
function loadComponenteKeyssFromFile(){
	var workbook = XLSX.readFileSync(zenbatConfig.basePath + 'productos.xlsx');
			exports.workbook = workbook;
			var componentesRaw = XLSX.utils.sheet_to_json(workbook.Sheets.componentes,{header:headerProductos,range:1});
			var componentes = componentesRaw.filter(loadComponentesFilter);
			return componentes;
}
exports.loadComponentesFromFile = loadComponentesFromFile;
/**
 * List of Articles
 */
exports.list = function(req, res) {
	if(_.isEmpty(exports.componentes)){
		loadComponentes();
	}
	
	res.jsonp(exports.componentes );
};
function getComponentes(){
	if(_.isEmpty(exports.componentes)){
		loadComponentes();
	}
	return exports.componentes;
}
exports.getComponentes = getComponentes;
function getComponenteQtyById(id){
	var comp = getComponenteById(id);
	return comp.cantidad;
}

function getComponenteReservasById(id){
	var comp = getComponenteById(id);
	return comp.cantidadReservada;
}

function getComponenteDbById(id){
	var comp = getComponenteById(id);
	return  (comp) ? comp : false;
}

function getComponenteById(id,clearCache){
	var cached = dbProductos.get(id);
	if(cached){
		return cached;
	}
	//getComponentes();
	var componente = _.find(exports.componentes,{codigo:id});
	if(typeof componente === 'undefined'){
		return false;
	}
	return componente;
}

exports.verificarId = function(componenteId){
	var comp = getComponenteById(componenteId);
	return comp ? true: false;
}
function updateComponente(componente){
	dbProductos.put(componente.codigo,componente);
	exports.componentes[componente.idx] = componente;
	return componente;
}

function updateComponenteCantidad(componenteId,qty){
	var componente = dbProductos.get(componenteId);
	if(componente){
		componente.cantidad = qty;
		dbProductos.put(componente.codigo,componente);
		return true;
	} else {

		console.log('fail update qty.no comp',componenteId);
		return false;
	}

}

/**
 * Article authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.componente.user.id !== req.user.id) {
		return res.status(403).send({
			message: 'User is not authorized'
		});
	}
	next();
};
/**
 * Article middleware
 */
exports.componenteByID = function(req, res, next, id) {
	var componente = getComponenteById(id);
	if(!componente){
		return res.status(404).send({
					message: 'Componente not found'
				});		
	}	
	req.componente = componente;
	next();
};
function setPedido(componente,pedidoId,qty){
	if(_.isString(componente)){
		componente = getComponenteById(componenteId);
	}
	if(!componente){
		output =  false;
	} else {
		if(!componente.pedidos){
			componente.pedidos = [];
		}

		if(componente.pedidos){
			var index = _.findIndex(componente.pedidos, { 'pedidoId': pedidoId });
			if(index > -1){
				console.log('componente ya  indexado',pedidoId);
			} else {
				console.log('qty',qty);
				componente.pedidos.push({pedidoId:pedidoId,qty:qty});	
			}
			var usableStock = parseFloat(componente.cantidad) - parseFloat(componente.cantidadReservada);
			if(usableStock <= componente.stockSeguridad){
				componente.bajoMinimos = true;
			} else {
				componente.bajoMinimos = false;
			}	
		}
		componente.pedidos = componente.pedidos.filter(function(element,index){
			var pedido = Pedidos.pedidoExists(element.pedidoId);
			if(pedido){
				return true;
			} else {
				return false;
			}
		});
		updateComponente(componente);
		return componente;
	}

}
function deleteNonXLSComponentes(){
	var keys = dbProductos.keys();
	keys.forEach(function(element,index){
		var exists = dbProductos.has(element)
	});
}
function getPedidosComponenteById(componenteId){
	var pedidosComponente = dbProductosReservados.get(componenteId);
	if(pedidosComponente){
		pedidosComponente.codigo = componenteId;
		return pedidosComponente;
	} else {
		return false
	}
}
function setPedidoNu(componenteId,pedidoId,qty){
	
	var	componente = getPedidosComponenteById(componenteId);
	
	if(!componente){
		output =  false;
	} else {
		if(!componente.pedidos){
			componente.pedidos = [];
		}

		if(componente.pedidos){
			var index = _.findIndex(componente.pedidos, { 'pedidoId': pedidoId });
			if(index > -1){
				console.log('componente ya  indexado',pedidoId);
			} else {
				console.log('qty',qty);
				componente.pedidos.push({pedidoId:pedidoId,qty:qty});	
			}
		}
		componente.pedidos = componente.pedidos.filter(function(element,index){
			var pedido = Pedidos.pedidoExists(element.pedidoId);
			if(pedido){
				return true;
			} else {
				return false;
			}
		});
		updateComponentePedidos(componente);
		return componente;
	}

}
exports.setPedido = setPedidoNu;
function updateComponentePedidos(componente){
	dbProductosReservados.put(componente.codigo,componente);
}
function setPedidoProveedor(componente,pedidoProveedorId,qty){
	if(_.isString(componente)){
		componente = getComponenteById(componenteId);
	}
	if(!componente){
		output =  false;
	} else {
		if(!componente.pedidosProveedores){
			componente.pedidosProveedores = [];
		}

		if(componente.pedidosProveedores){
			var index = _.findIndex(componente.pedidosProveedores, { 'pedidoProveedorId': pedidoProveedorId });
			if(index > -1){
				console.log('pedido PRoveedor componente ya  indexado',pedidoProveedorId);
			} else {
				console.log('qty',qty);
				componente.pedidosProveedores.push({pedidoProveedorId:pedidoProveedorId,qty:qty});	
			}

		}
		componente.pedidosProveedores = componente.pedidosProveedores.filter(function(element,index){
			var pedidoProveedor = PedidosProveedores.pedidoProveedorExists(element.pedidoProveedorId);
			if(pedidoProveedor){
				return true;
			} else {
				return false;
			}
		});
		updateComponente(componente);
		return componente;
	}

}
exports.setPedidoProveedor = setPedidoProveedor;
function getReservaByPedido(componente,pedidoId){
var cantidadReservada = 0;
	_(componente.pedidos).forEach(function(element,index) {
			if(element.pedidoId === pedidoId){
				return false;

			} else {
				cantidadReservada += element.qty;
			}
		});
	return cantidadReservada;
}
function getReservaTotal(componente){
	var cantidadReservadaTotal = 0;
	_(componente.pedidos).forEach(function(element,index) {

				cantidadReservadaTotal += element.qty;
			
		});
	return cantidadReservadaTotal;
}
function getProveedoresTotal(componente){
	var cantidadProveedoresTotal = 0;
	_(componente.pedidosProveedores).forEach(function(element,index) {
				if(PedidosProveedores.pedidoProveedorExists(element.pedidoProveedorId)){
					console.log('pedidoProveedorExists-qty',element.qty);
					cantidadProveedoresTotal += parseFloat(element.qty);
				} else {
					componente.pedidosProveedores.splice(index,1);
				}
			
		});
	return cantidadProveedoresTotal;
}
exports.verificarStock = function(id,qty,pedidoId){
	console.log('verificarStock-qty',qty);
	if(_.isEmpty(exports.componentes)){
			loadComponentes();
		}
	var componente = getComponenteById(id);
	var output;
	if(!componente){
		output =  false;
	} else {

		componente = setPedido(componente,pedidoId,qty);
		
		
		componente.cantidadReservada = getReservaByPedido(componente,pedidoId);
		var cantidad = parseFloat(qty);
		//console.log('cantidad',cantidad);
		var stockUsable = parseFloat(componente.cantidad) - parseFloat(componente.cantidadReservada);
		//console.log('verificar-stockUsable',stockUsable);
		console.log('verificar-cantidad',cantidad);
		console.log('verificar-componente-cantidad',componente.cantidad);
		//console.log('verificar-cantidadReservada',cantidadReservada);
		if(stockUsable < cantidad){
			if(stockUsable < 0){
				output = cantidad;
			} else {
				output = cantidad - stockUsable;
			}
		} else {
			output = true;
		}
		exports.updateComponente(componente);
	}
	return output;

};
function checkMinimos(componente){
	var output = false;
		var usableStock = parseFloat(componente.cantidad) - parseFloat(componente.cantidadReservada);
		var stockSeguridad = parseFloat(componente.stockSeguridad);
		if(usableStock <= stockSeguridad){
			output = true;
		} else {
			output = false;
		}
	return output;
}
/**
 * Show the current componente
 */
exports.stock = function(req, res) {
	var qty = parseFloat(req.query.qty);
	var nowQty = parseFloat(req.componente.cantidad);
	req.componente.cantidad = nowQty + qty;
	req.componente.bajoMinimos = checkMinimos(req.componente);
	req.componente = calcularCosas(req.componente);
	//updateComponente(req.componente);
	res.jsonp(req.componente);
};
/**
 * Show the current componente
 */
exports.read = function(req, res) {
	res.json(req.componente);
};

exports.takeComponente = function(id,qty,pedidoId) {
	var componente =  getComponenteById(id);
	var newStock = parseFloat(componente.cantidad) - parseFloat(qty);
	componente.cantidad = newStock;
	if(componente.pedidos){
		var index = _.findIndex(componente.pedidos, { 'pedidoId': pedidoId });
		if(index > -1){
			componente.pedidos.splice(index, 1);
		}
	}
	updateComponente(componente);
}

exports.reloadFromFile = function(req,res){
	console.log('Reloading file...');
	var componentes = loadComponentesFromFile();
	console.log('Found ' + componentes.length + ' componentes.');
	var status;
	var message = componentes.length + ' componentes procesados.'
	if(componentes.length === 0){
		status = false;
	} else {
		status = true;
	}
	if(!status){
		console.log('Something has gone wrong.');
		return res.status(400).send({
					message: 'Error al leer el archivo de componentes.'
				});		
	}	else {
		console.log('Done.');
		return res.status(200).send({message:message});
	}

	
}


exports.reload = function(){
	reloadComponentes = true;
	cache.put('componentes-cargados',false);
	loadComponentes();
};


exports.componentesToJson = function(req,res){
	loadComponentes();
	Pedidos.loadPedidos();
	var output = [];
	exports.componentes.forEach(function(element,index){
		element.cantidadReal = ' ';
		exports.componentes[index] = element;
	});
	return exports.componentes;	
}

exports.importarComponentes = function(req,res){
	console.log('Import screen');
}
exports.getComponenteQtyById = getComponenteQtyById;
exports.getComponenteReservasById = getComponenteReservasById;
exports.getComponenteDbById = getComponenteDbById;
exports.getComponenteById = getComponenteById;
exports.updateComponente = updateComponente;
exports.updateComponenteCantidad = updateComponenteCantidad;


exports.nuLoad = function(reload) {
	var componetes = [];


	if(reload){
		componentes = componentesFromFile();
	} else {
		componentes = componentesFromCache();

	}
	componentes.forEach(function(element,index){
		var pedidos = Pedidos.getPedidosCompoenenete();
		element.pedidos = pedidos;
		var pedidosProveedores = PedidosProveedores.getPedidosProveedoresComponente();


	});

	
	
	
}
