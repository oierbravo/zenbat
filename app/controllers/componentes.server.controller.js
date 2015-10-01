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
//var dbProductosReservados = flatfile.sync(zenbatConfig.basePath + 'db\\pedidosComponente.db');
var cachePedidosComponente = cache;

//var dbProductosPendientes = flatfile.sync(zenbatConfig.basePath + 'db\\productos-pendientes.db');

var cachePedidosComponente = cache;

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
exports.xlsKeys = [];

exports.reloadComponentesFromFile = function(req,res){
	updateComponentesFromFile();
	res.status(200);

}

function loadComponenteDb(componente){
	if(!componente){
		return componente;
	}
	var output;
	var dbFields;
	if(dbProductos.has(componente.codigo)){
		dbFields = dbProductos.get(componente.codigo);
		
			dbFields = {
				cantidad:dbFields.cantidad
				,cantidadReservada:dbFields.cantidadReservada
			}
	
	} else {
		dbFields = {
			cantidad: 0,
			cantidadReservada: 0
		};
	}
	return _.extend(componente,dbFields);
	
}
function loadComponenteElements(componente){
	//console.log('loadComponenteElements',componente);
	if(!componente){
		return componente;
	}
	componente = loadComponenteDb(componente);
	var pedidos = cachePedidosComponente.get(componente.codigo + '-pedidos');
	var pedidosProveedores = cachePedidosProveedores.get(componente.codigo + '-pedidosProveedores');
//	console.log('cachePedidosComponente',pedidos);
	
	//_.extend(componente,dbFields);
	if(!pedidos){
		pedidos = [];
	}
	componente.pedidos = pedidos;

	if(!pedidosProveedores){
		pedidosProveedores = [];
	}
	componente.pedidosProveedores = pedidosProveedores;
	return componente;
}
function loadComponentesFilter(element,index){
	//Necesita stockSeguridad y codigo valido
		var result = false;

		if(element.stockSeguridad){
			result = true;
			//if(element.stockSeguridad)
		} else {
			result = false;
		}
		if(element.codigo){

			if(element.codigo === '0'){
			
				result = false;
			}
			if(element.codigo === ''){

				result =  false;
			}
			if(element.codigo === ' '){

				result =  false;
			}
			if(element.codigo === null){
				result = false;
			}
			if(_.isEmpty(element.codigo)){
				result = false;
			}

		}
		if(result === true){
	//		console.log("true",element);
		}
  	return result;
	    
}
function loadComponentesForEach(element,index){
	if(element !== null){
		var cached = dbProductos.get(element.codigo);
		cached = false;
		if(cached){
			element = cached;

			componentes[index] = cached;
			return element;
		} else {
	    	element = loadComponenteDb(element);
			element.cantidadReservada = 0;
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
}

function loadComponentesFromFile(){
	var workbook = XLSX.readFileSync(zenbatConfig.basePath + 'productos.xlsx');
	exports.workbook = workbook;
	//console.log(workbook);
	//var componentesRaw = XLSX.utils.sheet_to_json(workbook.Sheets.componentes,{header:headerProductos,range:1});
	var componentesRaw = XLSX.utils.sheet_to_json(workbook.Sheets.componentes);
//	console.log(componentesRaw.length);
	var componentes = componentesRaw.filter(loadComponentesFilter);
	//console.log(componentes.length);
	return componentes;
}
exports.loadComponentesFromFile = loadComponentesFromFile;

function calcularCosas(componente){
//	console.log(componente);
	componente.status = '';
	componente.status = 'ok';
//console.log('calcularCosas',componente);

	var totalReservas = getReservaTotal(componente);

	var totalPedidosProveedores = getProveedoresTotal(componente);
    var usable = parseFloat(componente.cantidad) - totalReservas ;
    var stockMinimo = parseFloat(componente.stockSeguridad);
    var usableFuturo = usable + totalPedidosProveedores;
    var cantReservas = componente.pedidos.length;
    var cantPedidosProveedores = componente.pedidosProveedores.length;
    //console.log(componente);
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

exports.cleanComponente = function(componenteId,componentesXLS){
	var index = _.findIndex(componentesXLS,{codigo:codigo});
	if(index > 0){
		//found, nothing to do
	} else {
		//notFound, delete
		dbProductos.del(componenteId);
	}

}
function cleanComponentes(componentesXLS){
	componentesXLS.forEach(function(element,index){
		exports.cleanComponente(element,componentesXLS);
	});
}


function loadComponenteKeysFromFile(){
	var workbook = XLSX.readFileSync(zenbatConfig.basePath + 'productos.xlsx');
	exports.workbook = workbook;
	exports.xlsKeys = [];
	var componentesRaw = XLSX.utils.sheet_to_json(workbook.Sheets.componentes,{header:headerProductos,range:1});
	var componentes = componentesRaw.filter(loadComponentesFilter);
	var keys = [];
	componentes.forEach(function(element,index){
		keys.push(element.codigo);
	});
	exports.xlsKeys = keys;
	return keys;
}
exports.loadComponentesFromFile = loadComponentesFromFile;
/**
 * List of Articles
 */
exports.list = function(req, res) {
	/*if(_.isEmpty(exports.componentes)){
		//loadComponentes();
		exports.componentes = getComponentes();
	}*/
	var componentes = [];
	exports.xlsKeys.forEach(function(element,index){
		var componente = getComponenteById(element);
		componente = loadComponenteElements(componente);
		componentes.push(componente);
	});
	exports.componentes = componentes;
	res.jsonp(exports.componentes );
};
function getComponentes(){
	if(_.isEmpty(exports.componentes)){
		exports.load();
	}
	return exports.componentes;
}
exports.getComponentes = getComponentes;
function getComponenteQtyById(id){
	var comp = getComponenteById(id);
	if(comp !== null){
		return comp.cantidad;
	} else {
		return false;
	}
}

function getComponenteReservasById(id){
	var comp = getComponenteById(id);
	if(comp !== null){
		return comp.cantidadReservada;
	} else {
		return false;
	}
}

function getComponenteDbById(id){
	var comp = getComponenteById(id);
	return  (comp) ? comp : false;
}

function getComponenteById(id,clearCache){
	var componente = cache.get(id);
	//componente = loadComponenteElements(componente);
	return componente;
}

exports.verificarId = function(componenteId){
	var comp = getComponenteById(componenteId);
	return comp ? true: false;
}
function updateComponente(componente){
	var dbObj = {
		codigo:componente.componenteId,
		componenteId:componente.componenteId,
		cantidad:componente.cantidad
	}

	cache.put(componente.codigo,componente);
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

function deleteNonXLSComponentes(){
	var keys = dbProductos.keys();
	keys.forEach(function(element,index){
		var exists = dbProductos.has(element);
		if(existes){
			//exists, nothing to do
		} else {
			//don't exists so delete.
			dbProductos.del(element);
		}
	});
}
function getPedidosComponenteById(componenteId){

	var pedidosComponente = cachePedidosComponente.get(componenteId + '-pedidos');
	if(pedidosComponente){
		pedidosComponente.codigo = componenteId;
		return pedidosComponente;
	} else {
		return false
	}
}
function setPedido(componente,pedidoId,qty){
	var output;
	//var cached = cachePedidosComponente.get(componenteId + '-pedidos');
//	console.log('cached',cached);
	//var	componente = getPedidosComponenteById(componenteId);
//	var componente = cached;
	if(!componente || _.isNull(componente)){
		output =  false;
		console.log('componente null or false');
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
		var cantidadReservada = 0;
		var pedidosSums = [];
		componente.pedidos.forEach(function(el,ind){
			pedidosSums[el.pedidoId] = cantidadReservada;
			cantidadReservada += el.qty;
		});
		componente.pedidosSums = pedidosSums;
		componente.cantidadReservada =cantidadReservada;
		componente.cantidadReservadaTotal = cantidadReservada;
		console.log('fin-setPedido',componente);
		//updateComponentePedidos(componente);
		return updateComponente(componente);
	}

}
exports.setPedido = setPedido;
function updateComponentePedidos(componente){
	var cached = cachePedidosComponente.get(componenteId + '-pedidos');
	cached.pedidos = componente.pedidos;
	cached.pedidosSums = componente.pedidosSums;
	cached.cantidadReservada = componente.cantidadReservada;
	cachePedidosComponente.put(componenteId + '-pedidos',cached);
	//dbProductosReservados.put(componente.codigo,componente);
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
			//	console.log('qty',qty);
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
		var pedidosProveedoresSums = 0;
		componente.pedidosProveedoresSums = [];
		componente.pedidosProveedores.forEach(function(el,ind){
			 componente.pedidosProveedoresSums[el.pedidoProveedorId] = pedidosProveedoresSums;
			 pedidosProveedoresSums += el.qty;
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
	//console.log('getReservaTotal',componente);
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
					//console.log('pedidoProveedorExists-qty',element.qty);
					cantidadProveedoresTotal += parseFloat(element.qty);
				} else {
					componente.pedidosProveedores.splice(index,1);
				}
			
		});
	return cantidadProveedoresTotal;
}
exports.verificarStock = function(id,qty,pedidoId){
	var componente = getComponenteById(id);
	console.log('verificarStock',componente);
	}
exports.verificarStockold= function(id,qty,pedidoId){
	console.log('verificarStock-qty',qty);
	/*if(_.isEmpty(exports.componentes)){
			loadComponentes();
		}*/
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
		if(_.isNaN(componente.cantidad)){
			componente.cantidad = 0;
		}
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
exports.descontarComponente = function(componentId,cantidad){

}
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
	if(componente){
		console.log('takeComponente',componente);
		console.log('takeComponente.id',id);
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
	var componentes = getComponentes();
//	loadComponentes();
	//Pedidos.loadPedidos();
	var output = [];
	exports.componentes = output;
	componentes.forEach(function(element,index){
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
	var componentes = [];


	if(reload){
		componentes = componentesFromFile();
	} else {
		componentes = componentesFromCache();

	}
	componentes.forEach(loadComponentesForEachNu);
	exports.componentes = componetes;

	
	

}

exports.load = function(){
  exports.componentes = [];
  var componentes = loadComponentesFromFile();
  exports.xlsKeys = [];
  componentes.forEach(loadComponentesForEachNu);
 // console.log('keys',exports.keys);
  console.log(componentes.length + ' componentes indexed.')
  exports.componentes = componentes;
  cache.put('componentes-keys',exports.keys);
  cache.put('componentes-loaded',true);
  return componentes;

}

exports.getKeys = function(){
	return cache.get('componentes-keys');
}
function loadComponentesForEachNu(element,index){
		//console.log('before',element);
		var data = dbProductos.get(element.codigo);
		//console.log('loadComponentesForEachNu',data);
		if(data){
			element = _.extend(data,element);
		}
		//console.log('after',element);
	
		element.pedidos = cachePedidosComponente.get(element.codigo + '-pedidos');
		if(!element.pedidos){
			element.pedidos = [];
		}


		element.pedidosSums = [];
		var sum = 0;
		element.pedidos.forEach(function(pedido,index){

			element.pedidosSums[pedido.pedidoId] = sum;
			sum += pedido.qty;
		});
		element.cantidadReservada = sum;

		element.pedidosProveedores = cachePedidosComponente.get(element.codigo + '-pedidosProveedores');
		//element.pedidosProveedores = dbProductosPendientes.get(element.codigo);
		if(!element.pedidosProveedores){
			element.pedidosProveedores = [];
		} 

    	//element = loadComponenteDb(element);
		//element.cantidadReservada = 0;
		//element.pedidos = [];
    	element.idx = index;
    	
	
		
		/*exports.compIDs.push(element.codigo);
		if(_.isNull(element.cantidad)) {
			element.cantidad = 0;
		} */

		exports.xlsKeys.push(element.codigo);

		exports.keys.push(element.codigo);

		element = calcularCosas(element);
		cache.put(element.codigo,element);
		exports.componentes[index] = element;
		//keys
		//dbProductos.put(element.codigo,exports.componentes[index] );
	    
}
exports.checkDisponiblePedido = function(componente,pedidoId,qty){
	if(!componente){
		var usable = componente.cantidad - cantidad.pedidosSums[pedidoId];
		if(usable > qty){
			return 'OK';
		} else {
			return usable;
		}
	} else {
		return 'ID de componente no encontrado.';
	}

}