'use strict';

/**
 * Module dependencies.
 */
var chalk = require('chalk');
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Pedido = mongoose.model('Pedido'),
	_ = require('lodash');

	var XLSX = require('xlsx');
var moment = require('moment');

var Armarios = require('./armarios.server.controller.js');
var Componentes = require('./componentes.server.controller.js');

require('array.prototype.find');

var cache = require('memory-cache');
var zenbatConfig = require('../../zenbat.config.js');

var headerPedidos = zenbatConfig.pedidos.header;

exports.pedidos = [];
exports.pedidosProcesados = [];

var reloadPedidos = true;
cache.put('reloadPedidos',true);


var flatfile = require('flat-file-db');
var dbPedidos = flatfile.sync(zenbatConfig.basePath + 'db\\pedidos.db');
//var dbPedidosComponente = flatfile.sync(zenbatConfig.basePath + 'db\\pedidosComponente.db');
var cachePedidosComponente = cache;
/*var chokidar = require('chokidar');
var watcher = chokidar.watch(zenbatConfig.basePath , {
  ignored: /[\/\\]\./,
  persistent: true
});
*/
var log = console.log.bind(console);
/*
watcher.on('change',function(path){
  //log('File', path, 'has been changed');
  if(path.indexOf('pedidos.xlsx') !== -1){
 	console.log('cambios en pedidos.xlsx');
 	reloadPedidos = true;
 	cache.put('pedidos-changed',true);
  }
});
*/
function makePedidoID(pedido){

	var output = '';
	output += moment(pedido.fecha).format('YYYY-MM-DD');
	output += '_';
	output += pedido.codigo;
	output += '_';
	output += pedido.PC;

	return output;
}

function entregar(pedido){
	//console.log('entregar',pedido);
	//console.log('por entregar',pedido.porEntregar);

	var entregados = Armarios.entregar(pedido.armarioId,pedido.porEntregar,pedido.pedidoId);
	//console.log('result-entregar',entregados);
	
	
	dbPedidos.put(pedido.pedidoId,{lastEntregados:pedido.entregados});
}
function deleteOldPedidos(){
	var pedidosDB = dbPedidos.keys();
	pedidosDB.forEach(function(element,index){
		var pIndex = _.findIndex(exports.pedidos, 'pedidoId',element);
		if(pIndex === -1){
			//Borrar pedido residual
			dbPedidos.del(element);
		}
	});
}
function loadPedidosFromFile(save){
	var workbook = XLSX.readFileSync(zenbatConfig.basePath + zenbatConfig.pedidos.file);

		var sheetName = workbook.SheetNames[workbook.SheetNames.length -1];

		var pedidosSheet = workbook.Sheets[sheetName];
		var pedidos = XLSX.utils.sheet_to_json(pedidosSheet,{header:zenbatConfig.pedidos.header,range:1});
		var xlsKeys = [];
		pedidos.forEach(function(element,index){
			if(element.fecha){
				element.fechaUnix = moment(element.fecha).format('x');
			}
			var fecha = moment(element.fecha).format('YYYY-MM-DD');
			element.fecha = fecha;
			element.pedidoId =  makePedidoID(element);


			var pedidoDb = dbPedidos.get(element.pedidoId)
			var pedido = _.extend(element,pedidoDb);
			pedidos[index] = pedido;
			if(save){
				dbPedidos.put(pedido.pedidoId,pedido);
			}
			xlsKeys.push(pedido.pedidoId);
		});

		var sortedPedidos = _.sortBy(pedidos,'fechaUnix');
		exports.xlsKeys = xlsKeys;
		
		return sortedPedidos;
}
function getPedido(pedidoId){
	return dbPedidos.get(pedidoId);
}
exports.getPedidosComponente = getPedidosComponente;
function getPedidosComponente(componenteId){
	return cachePedidosComponente.get(componenteId + '-pedidos');
	//return  dbPedidosComponente.get(componenteId);
}

exports.getPedidosComponente = getPedidosComponente;
	
function setPedidosComponente(componenteId,pedidoId,qty){
	console.log('setPedidosComponente',pedidoId,componenteId);
	var pedidosComponente = cachePedidosComponente.get(componenteId + '-pedidos');
	if(!pedidosComponente){
		pedidosComponente = [];
	}
	var index = _.findIndex(pedidosComponente,{pedidoId:pedidoId});
		if(index > 0){
			//found, no hacer nada

			//HACER UPDATE
			pedidosComponente[index] = {pedidoId:pedidoId,qty:qty};
		} else {
			//no found, add
			pedidosComponente.push({pedidoId:pedidoId,qty:qty});
	}
	cachePedidosComponente.put(componenteId + '-pedidos',pedidosComponente);
//	dbPedidosComponente.put(componenteId,pedidosComponente);
}
function setPedidosComponentesArmario(armario,pedidoId){
	armario.componentes.forEach(function(element,index){
		var qty = element.Cantidad * armario.porEntregar;
		setPedidosComponente(componente.Codigo,pedidoId,qty);
	});
}
function loadPedidosForEachNu(element,index){
	//element.pedidos = 
}
function verificarStatus(pedido){

}
function getDbFields(pedido){
	var dbFields;
	if(dbPedidos.has(pedido.pedidoId )){
				dbFields = dbPedidos.get(pedido.pedidoId);
			 
			} else {
				dbFields = {
					lastEntregados: pedido.entregados,
					
				}
				
			}
			return dbFields;
}
function checkStock(status,stocks){
	var result = false;
	var oks = 0;
	var others = [];
	stocks.forEach(function(element,index){
		if(element === 'OK'){
			oks++;
		} else {
			//if()
			others.push(element);
		}
	});
	if(stocks.length === oks){
		result = 'OK';
	} else {

	}
	return {
		status: result,

		componentes:others

	}
}
function loadPedidosForEach(element,index){

		
			var output;
			var fecha = moment(element.fecha).format('YYYY-MM-DD');
			element.fecha = fecha;
			element.pedidoId =  makePedidoID(element);
			if(_.isUndefined(element.entregados)){
				element.lastEntregados = 0;
				element.entregados = 0;
			}
			var dbFields = getDbFields(element);
			
			output = _.extend(element,dbFields);
			element = output;
			
			var armarioId = element.codigo + '-' + element.rev;
			element.armarioId = armarioId;

			var marcarReserva = true;
			//console.log('VERIFICANDO');
			if(element.lastEntregados !== element.entregados){
				var o = element.entregados - element.lastEntregados;
				//console.log('por entregar',o);
				element.porEntregar = o;
				entregar(element);
			}
			if(element.entregados === element.cantidad) {
				element.stock = {
					status: 'FINALIZADO'
				};
				element.entregado = true;
				element.cssClass = 'truck';
			} else if(element.cantidad > element.entregados){
				element.pendientes = element.cantidad - element.entregados;
				var componentes = Armarios.getComponentes(armarioId);
				var stocks = [];
				var  stockComponentes = [];
				var foundFalse = false;
				var status = 'OK';

				/*console.log('armario-componentes',componentes);
				componentes.forEach(function(componente,compIndex){
						if(componente.Codigo){
						var qty = element.pendientes * parseFloat(componente.Cantidad);
						Componentes.setPedido(componente.Codigo,element.pedidoId,qty);
						var gotComponente = Componentes.checkDisponiblePedido(componente,element.pedidoId,qty);
						*/
						//verificarStock = function(id,qty,pedidoId)
						//var gotComponente = Componentes.verificarStock(componente.Codigo,qty,element.pedidoId);
						//element.Cantidad = parseFloat(element.Cantidad);
				//var gotComponente = Componentes.verificarStock(element.Codigo,element.Cantidad * qtyArmarios,pedidoId);
//				console.log('gotComponente',gotComponente);
				//componente.stockSinReservas = Componentes.getComponenteQtyById(element.Codigo);
				//componente.cantidadReservada = Componentes.getComponenteReservasById(element.Codigo);
				//componente.cantidadReservadaSinPedido =componente.cantidadReservada - qty;

				componentes.forEach(function(componente,compIndex){
						if(componente.Codigo){
						var qty = element.pendientes * parseFloat(componente.Cantidad);
						//Componentes.setPedido(componente.Codigo,pedidoId,qty);
						//verificarStock = function(id,qty,pedidoId)
						var gotComponente = Componentes.verificarStock(componente.Codigo,qty,element.pedidoId);
						//element.Cantidad = parseFloat(element.Cantidad);
				//var gotComponente = Componentes.verificarStock(element.Codigo,element.Cantidad * qtyArmarios,pedidoId);
//				console.log('gotComponente',gotComponente);
				componente.stockSinReservas = Componentes.getComponenteQtyById(element.Codigo);
				componente.cantidadReservada = Componentes.getComponenteReservasById(element.Codigo);
				componente.cantidadReservadaSinPedido =componente.cantidadReservada - qty;

				if(gotComponente){
					if(gotComponente === true){
						//status = 'ok';
					} else {
						if(!foundFalse){
							status = 'FALTAN COMPONENTES';
						}
					}
				} else if(gotComponente === false) {

					status = 'disponible IDS';
					foundFalse = true;
				}
				if(disponible === false){

					status = 'FALTAN IDS';
					foundFalse = true;
				}
				if(gotComponente === false){

					stocks.push({
						codigo:element.Codigo,
						denominacion:element.Denominacion,
						necesarios: false,
						stock: false
					});
				} else {
					var disponible = false;
					if(gotComponente === true){
						gotComponente = 0;
						disponible = true;
					}
					stocks.push({
						codigo:element.Codigo,
						denominacion:element.Denominacion,
						necesarios: parseFloat(element.Cantidad),
						stockSinReservas: element.stockSinReservas,
						cantidadReservada: element.cantidadReservada,
						cantidadReservadaSinPedido: element.cantidadReservada,
						disponible: disponible,
						stock: gotComponente
					});
				}


						//stocks.push(stock);
					}
				});

				element.stock = checkStock(status,stocks);


				//element.stock =  Armarios.verificarStock(armarioId,element.pendientes,element.pedidoId );
				
				if(element.stock.status === 'OK'){
					element.entregable = true;
					element.fallo = false;
					element.cssClass = 'check';
				} else {
					element.entregable = false;
					element.fallo = true;
						element.cssClass = 'times';
				}
			}
			exports.pedidos[index] = element;
			cache.put(element.pedidoId,element);
		
}

exports.calcularStock = function(pedido){
	var stock;
	pedido.stock.status = 'OK';
	return stock;
}

function loadPedidosForEachOld(element,index){

		
			var output;
			var fecha = moment(element.fecha).format('YYYY-MM-DD');
			element.fecha = fecha;
			element.pedidoId =  makePedidoID(element);
			if(_.isUndefined(element.entregados)){
				element.entregados = 0;
			}
			var dbFields;
			if(dbPedidos.has(element.pedidoId )){
				dbFields = dbPedidos.get(element.pedidoId);
			 
			} else {
				dbFields = {
					lastEntregados: element.entregados,
					
				}
				dbPedidos.put(element.pedidoId,dbFields);
			}
			output = _.merge(element,dbFields);
			element = output;
			
			var armarioId = element.codigo + '-' + element.rev;
			element.armarioId = armarioId;

			var marcarReserva = true;
			//console.log('VERIFICANDO');
			if(element.lastEntregados !== element.entregados){
				var o = element.entregados - element.lastEntregados;
				//console.log('por entregar',o);
				element.porEntregar = o;
				entregar(element);
			}
			if(element.entregados === element.cantidad) {
				element.stock = {
					status: 'FINALIZADO'
				};
				element.entregado = true;
				element.cssClass = 'truck';
			} else if(element.cantidad > element.entregados){
				element.pendientes = element.cantidad - element.entregados;
				element.stock =  Armarios.verificarStock(armarioId,element.pendientes,element.pedidoId );
				
				if(element.stock.status === 'OK'){
					element.entregable = true;
					element.fallo = false;
					element.cssClass = 'check';
				} else {
					element.entregable = false;
					element.fallo = true;
						element.cssClass = 'times';
				}
			}
			exports.pedidos[index] = element;
			cache.put(element.pedidoId,element);
		
}
function cleanPedidos(){
	var dbKeys = dbPedidos.keys();
	var xlsKeys = getPedidosIds();
	dbKeys.forEach(function(element,index){
		var index = _.findIndex(xlsKeys,element);
		if(index > 0){
			//existe, nothing to do.
		} else {
			//no existe
			dbPedidos.del(element);
		}
	});
}
function getPedidosIds(){
	return exports.xlsKeys;
}
function loadPedidosNu(){
	//if(exports.pedidos.length === 0){
			exports.pedidos = [];		
	//}
	var pedidosKeys = dbPedidos.keys();
	pedidosKeys.forEach(function(element,index){
		var pedido = dbPedidos.get(element);
		if(pedido){
			exports.pedidos.push(pedido)
		}
	});
	cleanPedidos();
}
function loadPedidos(){
	if(_.isEmpty(Componentes.componentes)){
		//Componentes.getComponentes();
	}
	if(reloadPedidos){
		if(exports.pedidos.length === 0){
			exports.pedidos = [];		
		} 			
		var pedidos = loadPedidosFromFile();
		pedidos.forEach(loadPedidosForEach);
		
	
		 
		//borramos los pedidos que no estan en el excel
		deleteOldPedidos();
		exports.pedidos = pedidos;
		cache.put('pedidos-cargados',true);
		
	}
	cleanPedidos();

}

//exports.loadPedidos = loadPedidos;
function getPedidoFromID(pedidoID){
	var splitted = pedidoID.split('_');
	var nuFecha =splitted[0];
	/*if(_.isEmpty(exports.pedidos)){
		console.log('pedidos empty CARGANDO');
		loadPedidos();
	}*/
	//var pedido = _.find(exports.pedidos,{pedidoId:pedidoID});
	//return pedido;
	return cache.get(pedidoID);

}
exports.getPedidoFromID = getPedidoFromID;
exports.pedidoExists = function(pedidoId){
	return dbPedidos.has(pedidoId);
};

/**
 * Show the current Pedido
 */
exports.read = function(req, res) {
	var armarioId = req.pedido.codigo + '-' +  req.pedido.rev;
	res.jsonp(req.pedido);
};

function checkStatus(pedido){

}
function updatePedido(pedido){
	cache.put(pedido.pedidoId,pedido);
	return pedido;

}
function calcularCosas(pedido,index){
	var pedidoStatus = 'UNDEF';
	var oks = 0;
	var stockComponentes = [];
	console.log('calcularCosas',pedido);
	pedido.componentesNecesarios.forEach(function(element,index){
		var componente = Componentes.getComponenteById(element.codigo);
		componente = Componentes.setPedido(componente,pedido.pedidoId,element.qty);
		var disponible = Componentes.checkDisponiblePedido(componente,pedido.pedidoId,element.qty);
		console.log('disponible',disponible);
	});
	pedido.stock = {
		status:pedidoStatus
		,componentes:stockComponentes
	}
	return updatePedido(pedido);
}
exports.calcularCosas = calcularCosas;
function listPedidosForEach(pedido,index){
	var componentes = Armarios.getComponentes(pedido.armarioId);
	var result = [];
	var pedidoStatus = 'UNDEF';
	var oks = 0;
	componentes.forEach(function(el,ind){
	//	console.log('listPedidosForEach',el);
		var componente = Componentes.getComponenteById(el.Codigo);
		var pedidoSum;
		if(componente){

			if(componente.pedidosSums[pedido.pedidoId]){
			   pedidoSum = componente.pedidosSums[pedido.pedidoId];
			} else {
				pedidoSum = 'FAIL';
			}
			var necesarios = pedido.pendientes * parseFloat(componente.Cantidad);
			componente.cantidadReservada = pedidoSum;
			componente.cantidadReservadaSinPedido = pedidoSum - necesarios;
			componente.necesarios = necesarios;
			componente.stockSinReservas =  componente.cantidad;

			if(componente.cantidadReservada > componente.cantidad){
				componente.status = 'FAIL';
			//	result.push(componente);
				pedidoStatus = 'FALTAN COMPONENTES';
			} else {
				componente.status = 'OK';
				oks++;
				//result.push(componente);
			}
			if(oks === componentes.lenght){
				pedidoStatus = 'OK';
			}
			result.push(componente);
		}
	});
	console.log(result);
	pedido.stock = {
		status:pedidoStatus,
		componentes: result
	};
	//console.log('pedido-calculado',pedido);
	exports.pedidos[index] = pedido;
	return updatePedido(pedido);
}
/**
 * List of Pedidos
 */
exports.list = function(req, res) { 
	//loadPedidos();
	//exports.pedidos.forEach(function(element,index){
		exports.pedidos.forEach(listPedidosForEach);
	res.jsonp(exports.pedidos);
};

/**
 * Pedido middleware
 */
exports.pedidoByID = function(req, res, next, id) { 
	//loadPedidos();
	var pedido = getPedidoFromID(id);
		if (! pedido) return next(new Error('Failed to load Pedido ' + id));
		req.pedido = pedido ;
		next();

};

/**
 * Pedido authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.pedido.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};

exports.comprobarComponentes = function(req,res,next,armarioId,cantidad){


};

exports.entregar = function(pedidoId,qty){
	// -> descontar componentes
	console.log('comp entregar');
};
exports.reload = function(){
	reloadPedidos = true;
	loadPedidos();
};
function preparePedido(pedido,index){
	return pedido;
}
function cargarPedidosForEach(element,index){
	var output;
	var fecha = moment(element.fecha).format('YYYY-MM-DD');
	element.fecha = fecha;
	element.pedidoId =  makePedidoID(element);
	if(_.isUndefined(element.entregados)){
		element.lastEntregados = 0;
		element.entregados = 0;
		element.porEntregar = 0;
	}
	var dbFields = getDbFields(element);
	
	output = _.extend(element,dbFields);
	element = output;

	var armarioId = element.codigo + '-' + element.rev;
	element.armarioId = armarioId;
	element.pendientes = element.cantidad - element.entregados;

	element.componentesNecesarios = [];
		var componentes = Armarios.getComponentes(armarioId);
		componentes.forEach(function(componente,compIndex){
			if(componente.Codigo){
				var qty = element.pendientes * parseFloat(componente.Cantidad);
				//Componentes.setPedido(componente.Codigo,element.pedidoId,qty);
				element.componentesNecesarios.push({codigo:componente.Codigo,qty:qty});
			}
		});


	if(element.lastEntregados !== element.entregados){
		var o = element.entregados - element.lastEntregados;
		//console.log('por entregar',o);
		element.porEntregar = o;

		entregar(element);
	}
	if(element.entregados === element.cantidad) {
		element.stock = {
			status: 'FINALIZADO'
		};
		element.entregado = true;
		element.cssClass = 'truck';
	} else if(element.cantidad > element.entregados){
		element.pendientes = element.cantidad - element.entregados;
		
	}
	exports.pedidos[index] = element;
	console.log(element);
    cache.put(element.pedidoId,element);

}
exports.load = function(){
	//exports.pedidos = [];
	var pedidos = loadPedidosFromFile(true);
	pedidos.forEach(cargarPedidosForEach);
	deleteOldPedidos();
	cleanPedidos();
	cache.put('pedidos-loaded',true);
	return pedidos;
}
function loadPedidosForEach2(element,index){

		
			var output;
			var fecha = moment(element.fecha).format('YYYY-MM-DD');
			element.fecha = fecha;
			element.pedidoId =  makePedidoID(element);
			if(_.isUndefined(element.entregados)){
				element.lastEntregados = 0;
				element.entregados = 0;
			}
			var dbFields = getDbFields(element);
			
			output = _.extend(element,dbFields);
			element = output;
			
			var armarioId = element.codigo + '-' + element.rev;
			element.armarioId = armarioId;

			var marcarReserva = true;
			//console.log('VERIFICANDO');
			if(element.lastEntregados !== element.entregados){
				var o = element.entregados - element.lastEntregados;
				//console.log('por entregar',o);
				element.porEntregar = o;
				entregar(element);
			}
			if(element.entregados === element.cantidad) {
				element.stock = {
					status: 'FINALIZADO'
				};
				element.entregado = true;
				element.cssClass = 'truck';
			} else if(element.cantidad > element.entregados){
				element.pendientes = element.cantidad - element.entregados;
				var componentes = Armarios.getComponentes(armarioId);
				var stocks = [];
				var  stockComponentes = [];
				var foundFalse = false;
				var status = 'OK';
				console.log('armario-componentes',componentes);
				componentes.forEach(function(componente,compIndex){
						if(componente.Codigo){
						var qty = element.pendientes * parseFloat(componente.Cantidad);
						Componentes.setPedido(componente.Codigo,element.pedidoId,qty);
						var gotComponente = Componentes.checkDisponiblePedido(componente,element.pedidoId,qty);
						
						//verificarStock = function(id,qty,pedidoId)
						//var gotComponente = Componentes.verificarStock(componente.Codigo,qty,element.pedidoId);
						//element.Cantidad = parseFloat(element.Cantidad);
				//var gotComponente = Componentes.verificarStock(element.Codigo,element.Cantidad * qtyArmarios,pedidoId);
//				console.log('gotComponente',gotComponente);
				//componente.stockSinReservas = Componentes.getComponenteQtyById(element.Codigo);
				//componente.cantidadReservada = Componentes.getComponenteReservasById(element.Codigo);
				//componente.cantidadReservadaSinPedido =componente.cantidadReservada - qty;
				
				if(gotComponente){
					if(gotComponente === true){
						//status = 'ok';
					} else {
						if(!foundFalse){
							status = 'FALTAN COMPONENTES';
						}
					}
				} else if(gotComponente === false) {
					status = 'disponible IDS';
					foundFalse = true;
				}
				if(disponible === false){
					stocks.push({
						codigo:element.Codigo,
						denominacion:element.Denominacion,
						necesarios: false,
						stock: false
					});
				} else {
					var disponible = false;
					if(gotComponente === true){
						gotComponente = 0;
						disponible = true;
					}
					stocks.push({
						codigo:element.Codigo,
						denominacion:element.Denominacion,
						necesarios: parseFloat(element.Cantidad),
						stockSinReservas: element.stockSinReservas,
						cantidadReservada: element.cantidadReservada,
						cantidadReservadaSinPedido: element.cantidadReservada,
						disponible: disponible,
						stock: gotComponente
					});
				}


						//stocks.push(stock);
					}
				});
				console.log('element.stock-b',element.stock);
				element.stock = checkStock(status,stocks);
				console.log('element.stock-a',element.stock);
				//element.stock =  Armarios.verificarStock(armarioId,element.pendientes,element.pedidoId );
				
				if(element.stock.status === 'OK'){
					element.entregable = true;
					element.fallo = false;
					element.cssClass = 'check';
				} else {
					element.entregable = false;
					element.fallo = true;
						element.cssClass = 'times';
				}
			}
			exports.pedidos[index] = element;
			cache.put(element.pedidoId,element);
		
}
