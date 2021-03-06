'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    _ = require('lodash');
var cache = require('memory-cache');
var moment = require('moment');

var fs      = require('fs');
var zenbatConfig = require('../../zenbat.config.js');

var EventLogger = require('node-windows').EventLogger;
var syslog = new EventLogger('Zenbat');

var marked = require('marked');
marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false
});
//var winston = require('winston');
/*var log = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({ level: 'verbose' }),
      new (winston.transports.File)({ filename: zenbatConfig.basePath + "historial.log",level: "info" })
    ]
  });*/

var Armarios = require('./armarios.server.controller.js');

var Proveedores = require('./proveedores.server.controller.js');

var XLSX = require('xlsx');


var flatfile = require('flat-file-db');

var fileProductos = zenbatConfig.basePath + zenbatConfig.componentes.file;
var dbProductos = flatfile.sync(zenbatConfig.basePath + zenbatConfig.componentes.dbFile);
var dbPedidos = flatfile.sync(zenbatConfig.basePath + zenbatConfig.pedidos.dbFile ); 

var dbPedidosProveedores = flatfile.sync(zenbatConfig.basePath + zenbatConfig.pedidosProveedores.dbFile);

exports.dbPedidosProveedores = dbPedidosProveedores;

exports.componentes = [];
exports.pedidos = [];
exports.pedidosProveedores = [];

exports.pedidosEntregados = [];

exports.xlsKeys = [];

var now ;

var fileHistorial = zenbatConfig.basePath + 'historial.db';
var dbHistorial = flatfile.sync(fileHistorial);
var dbHistorial;
//var lastLID;
var tempComponentes = [];
var log = {
	info: function(msg,data,user){
		if(typeof data === 'undefined'){
			data = {};
		}
		var timestamp = moment();
		var lid = log.getNextLID();
		var dbObj = {
			lid: lid,
			descripcion: msg,
			timestamp: timestamp.format(),
			user:user
		}
		//console.log(data);
		_.forEach(data,function(el,index){
			dbObj[index] = el;
		});
	/*	data.forEach(function(key){
			dbObj[key] = data[key];
		});*/
		 dbHistorial.put(lid,dbObj)
		 // console.log('[INFO]' +'[' + user +  ']'  + timestamp.format('HH:mm:ss') + ': ' ,msg);
		 console.log('[INFO]'   + timestamp.format('HH:mm:ss') + ': ' ,msg);
	},
	verbose: function(msg,data){
		if(typeof data === 'undefined'){
			data = '';
		}
		console.log(msg,data);
	},
	query: function(options){
		var output = [];
		var ks = dbHistorial.keys()
		ks.forEach(function(el,ind){
			var obj = dbHistorial.get(el);
			output.push(obj);
		})
		//console.log(output);
		return output;
	},
	getNextLID: function(){
		return dbHistorial.keys().length;
	},
	getLastLID: function(){

		var keys = dbHistorial.keys();
		if(keys.length === 0){
			return 0;
		} else {
			var intKeys = keys.map(toInt);
			var max = _.max(intKeys);
			return max;
		}
		//console.log("MAX: ", max);

	},
	init: function(){
		dbHistorial = flatfile.sync(fileHistorial);
		
	}
}

function loadAll(){
	now = moment().format();
	exports.componentes = [];
	exports.pedidos = [];
	exports.pedidosProveedores = [];
	//console.log('cargando datos...')
	//log.info('Iniciando Zenbat');
	log.verbose('preparando historial...');
	//log.init();
	log.verbose('cargando datos...');
	//log.info("Cargando datos");
	loadComponentes();
	loadPedidos();
	loadPedidosProveedores();
	calculos();

}
loadAll();
exports.loadAll = loadAll;
function reLoadAll(){
	log.init();
	loadAll();
}

exports.reLoadAll = reLoadAll;
function reloadAllCli(req,res){
	reLoadAll();
	res.status(200);
	var numComponentes = exports.componentes.length;
	var numPedidos = exports.pedidos.length;


	var numPedidosProveedores = exports.pedidosProveedores.length;
	var numPedidosProveedoresPendientes = _.filter(exports.pedidosProveedores,'pendiente').length;
	var numPedidosEntregados = exports.pedidosEntregados.length;

	var str ='Cargados: ' + numComponentes + ' componentes, ' + numPedidos + ' pedidos y ' + numPedidosProveedoresPendientes +' pedidos a proveedores pendientes. ';
	if(numPedidosEntregados > 0){
		str += numPedidosEntregados + ' pedidos entregados.';
	}
	/*if(lastLID === 0){
		str += "Generado nuevo historial."
	}*/
	res.send({message:str,pedidoEntregados:exports.pedidosEntregados});
}
exports.reloadAllCli = reloadAllCli;
function loadComponentes(){
	exports.componentes = [];
	var componentes = loadComponentesFromFile();
	exports.componentes = componentes;
	exports.componentes.forEach(loadComponentesForEach);
	//console.log(componentes.length + ' componentes cargados.');
	log.verbose(componentes.length + ' componentes cargados.');
	//
}
exports.loadComponentes = loadComponentes;


function loadComponentesFromFile(){
	var workbook = XLSX.readFileSync(fileProductos);
	//exports.workbook = workbook;
	//console.log(workbook);
	//var componentesRaw = XLSX.utils.sheet_to_json(workbook.Sheets.componentes,{header:headerProductos,range:1});
	var componentesRaw = XLSX.utils.sheet_to_json(workbook.Sheets.componentes);
	//console.log('componentesRaw.length',componentesRaw.length);
	var componentes = componentesRaw.filter(loadComponentesFilter);
	//console.log(componentes.length);
	return componentes;
}
exports.loadComponentesFromFile = loadComponentesFromFile;
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
function loadComponenteDb(componenteId){
	if(dbProductos.has(componenteId)){
		return dbProductos.get(componenteId);
	} else {
		return {
			cantidad:0,
			pedidos:[],
			pedidosProveedores: []
		}
	}
	
}
function loadComponentesForEach(element,index){
		//console.log('before',element);
		var data = loadComponenteDb(element.codigo);
		//console.log('loadComponentesForEachNu',data);
		if(data){
			element = _.extend(data,element);
		}
		//console.log('after',element);
	
		
		//if(!element.pedidos){
			element.pedidos = [];
		//}


		element.pedidosSums = [];
		var sum = 0;
	/*	element.pedidos.forEach(function(pedido,index){

			element.pedidosSums[pedido.pedidoId] = sum;
			sum += pedido.qty;
		});*/
		//element.cantidadReservada = sum;
element.cantidadReservada = 0;
//		element.pedidosProveedores = cachePedidosComponente.get(element.codigo + '-pedidosProveedores');
		//element.pedidosProveedores = dbProductosPendientes.get(element.codigo);
		//if(!element.pedidosProveedores){
			element.pedidosProveedores = [];
			element.cantidadProveedores = 0;
//		}



    	element.idx = index;

		exports.componentes[index] = element;
	    cache.put(element.codigo,element);
}
function getComponente(codigo){
	var componente = _.find(exports.componentes,['codigo',codigo]);
	if(componente === -1){
		return false;
	} else {
		return componente;
	}
}
function saveComponente(componente,categoria,diff,accion){
	var dbObj = {
		cantidad:componente.cantidad
	}
	var cInd = _.findIndex(exports.componentes,{codigo:componente.codigo});
	var tComp =dbProductos.get(componente.codigo);
	var msg = 'Componente modificado ';
	switch(categoria){
		case 'manual':
			if(diff > 0){
				msg += '+';
			} else {
				//msg += '-';
			}
			break;
		case 'clientes':
			msg += '-';
			break;
		case 'proveedores':
			msg += '+';
			break;
		case 'importador':
			msg += '=';
			break;
	}

	msg += diff.toString();
	//if(tComp.cantidad !== componente.cantidad){
		log.info(msg,{codigo:componente.codigo,categoria:categoria})
	//}

	dbProductos.put(componente.codigo,dbObj);
	exports.componentes[cInd] = componente;
	return componente;
}
exports.saveComponente = saveComponente;
function makePedidoID(pedido){

	var output = '';
	output += moment(pedido.fecha).format('YYYY-MM-DD');
	output += '_';
	output += pedido.codigo;
	output += '_';
	output += pedido.PC;

	return output;
}
function loadPedidosFromFile(save){
	var workbook = XLSX.readFileSync(zenbatConfig.basePath + zenbatConfig.pedidos.file);

		var sheetName = workbook.SheetNames[workbook.SheetNames.length -1];

		var pedidosSheet = workbook.Sheets[sheetName];
		var pedidos = XLSX.utils.sheet_to_json(pedidosSheet,{header:zenbatConfig.pedidos.header,range:1});
		//var xlsKeys = [];
		pedidos.forEach(function(element,index){

			if(element.fecha){
				element.fecha = new Date(element.fecha);
				element.fechaUnix = moment(element.fecha).format('x');
			}
			//var fecha = moment(element.fecha).format('YYYY-MM-DD');
			//element.fecha = fecha;
			//element.pedidoId =  makePedidoID(element);


			/*var pedidoDb = dbPedidos.get(element.pedidoId)
			var pedido = _.extend(element,pedidoDb);
			pedidos[index] = pedido;
			if(save){
				dbPedidos.put(pedido.pedidoId,pedido);
			}
			xlsKeys.push(pedido.pedidoId);*/
		});

		var sortedPedidos = _.sortBy(pedidos,'fechaUnix');
		//exports.xlsKeys = xlsKeys;
		
		return sortedPedidos;
}
function loadPedidos(){
	exports.pedidos = [];
	exports.pedidosEntregados = [];
	var pedidos = loadPedidosFromFile();
	pedidos.forEach(loadPedidosForEach);
}

exports.loadPedidos = loadPedidos;
function loadPedidosForEach(pedido,index){
	pedido.fecha = new Date(pedido.fecha);
	pedido.pedidoId =  makePedidoID(pedido);
	var fecha = moment(pedido.fecha).format('YYYY-MM-DD');
	pedido.fecha = fecha;
	pedido.fechaUnix = moment(pedido.fecha).format('x');
	//element.pedidoId =  makePedidoID(element);
	if(_.isUndefined(pedido.entregados)){
		pedido.lastEntregados = 0;
		pedido.entregados = 0;
	} else {
		pedido.entregados = parseInt(pedido.entregados);
	}
	
	var dbFields;
	if(dbPedidos.has(pedido.pedidoId )){
		dbFields = dbPedidos.get(pedido.pedidoId);
		 
	} else {
		dbFields = {
			lastEntregados: 0,
			
		}
		
	}
		

	pedido = _.extend(pedido,dbFields);
	//element = output;
	
	var armarioId = pedido.codigo + '-' + pedido.rev;
	pedido.armarioId = armarioId;

	pedido.idx = index;

	pedido.pendientes = pedido.cantidad - pedido.lastEntregados;

	exports.pedidos[index] = pedido;
	var armario = getArmario(armarioId);
	if(armario){
		pedido.armario = armario;

		if(armario.faltanIDs){
			pedido.status = 'FALTAN IDS';
			pedido.entregable = false;
		}
		//entregamos los completos.
		if( pedido.entregados >  pedido.lastEntregados){
			var diff = pedido.entregados - pedido.lastEntregados;
			//console.log(diff + " armarios a entregar");
			log.verbose(diff + " armarios a entregar");
			pedido.porEntregar = diff;
			pedido = entregarPedido(pedido);
			
		} else {
			pedido.porEntregar = 0;
		}
		
		//actualizamos los componentes
		pedido.stock = [];
		armario.componentes.forEach(function(el,ind){
			if(el.Codigo){
				var compI = _.findIndex(exports.componentes,{codigo:el.Codigo});
				var qty = el.Cantidad * pedido.pendientes;
				var qtyUnidad = el.Cantidad;
				//console.log(qty);
				if(compI > -1){
					//exports.componentes[compI].pedidos.push({pedidoId:pedido.pedidoId,qty:qty});
					if(_.isNumber(qty)){
						exports.componentes[compI] = componenteAddPedido(exports.componentes[compI],pedido.pedidoId,qty);

					}
					


					pedido.stock.push({componenteId:el.Codigo,status:'no procesado',cantidad:qty,cantidadUnidad:qtyUnidad});

				} else {
					pedido.stock.push({componenteId:el.Codigo,status:'ID no encontrado.',cantidad:qty,cantidadUnidad:qtyUnidad});
				}
			}
		});

	} else {
		pedido.status = 'EL ARMARIO NO A SIDO GENERADO';
		pedido.entregable = false;
	}

}
exports.loadPedido = function(){

}
function savePedido(pedido){
	var dbObj = {
		
		lastEntregados: pedido.lastEntregados
	}
	dbPedidos.put(pedido.pedidoId,dbObj);
	var pIndex = _.findIndex(exports.pedidos,{pedidoId:pedido.pedidoId});
	exports.pedidos[pIndex] = pedido;
	// console.log('saved ' + pedido.pedidoId + ' with index ' + pIndex);
	log.verbose('saved ' + pedido.pedidoId + ' with index ' + pIndex);
	return pedido;
}
exports.savePedido = savePedido;
function entregarPedido(pedido){
	// console.log('Entregando pedido');
	log.verbose('Entregando pedido');
	// console.log('entregar',pedido);
//	log.verbose('entregar',pedido);
	// console.log('procesando ' + pedido.armario.componentes.length + ' componentes.');
	log.verbose('procesando ' + pedido.armario.componentes.length + ' componentes.');
	log.info('Inicio entrega pedido',{pedidoId:pedido.pedidoId,codigo:pedido.pedidoId,categoria:"clientes"})


	pedido.armario.componentes.forEach(function(element,index){
		var compIndex = _.findIndex(exports.componentes,{codigo:element.Codigo});
		if(compIndex > -1){
			var componente = exports.componentes[compIndex];
			var nuCant =  parseFloat(element.Cantidad) * pedido.porEntregar;

			componente.cantidad -= nuCant;
			var diff = nuCant;
			saveComponente(componente,'clientes',diff);
			
		}
	});
	pedido.lastEntregados = pedido.entregados;
	exports.pedidosEntregados.push(pedido);
	savePedido(pedido);
	log.info('Pedido entregado',{pedidoId:pedido.pedidoId,codigo:pedido.pedidoId,categoria:"clientes"})
	return pedido;
}
exports.entragarPedido = entregarPedido;
function toInt(str){
	return parseInt(str);
}
function getUltimoPedidoProveedores(){
	var keys = dbPedidosProveedores.keys();
	var intKeys = keys.map(toInt);
	var max = _.max(intKeys);
	return max;
	//console.log("MAX: ", max);
}
function getUltimoPedidoProveedoresResponse(req,res){
	var last = getUltimoPedidoProveedores();
	res.send({data:last});
	//res.send(last);
}
exports.getUltimoPedidoProveedores = getUltimoPedidoProveedoresResponse;
function loadPedidosProveedores(){

	//console.log('loadPedidosProveedores.dbPedidosProveedores',dbPedidosProveedores);
	exports.pedidosProveedores = [];
	var keys = dbPedidosProveedores.keys();
	keys.forEach(function(element,index){

		//console.log('Element loadPedidosProveedores',typeof element);
		var elementInt = parseInt(element);
		//console.log('element int',elementInt);
		if(!_.isNaN(elementInt)){
			var pedido = dbPedidosProveedores.get(element);
			//var fecha = moment(pedido.fecha);
			//var f = Date(pedido.fecha);
			//pedido.fecha = f;
			//console.log('f',f);
			//console.log('fecha',pedido.fecha);
			var fechaRaw = pedido.fecha;
			if(!pedido.fecha){
				pedido.fecha = '';
			}
			var f = pedido.fecha.split('-');
			if(f.length == 3){
				if(f[0].length == 4){
					//correct order
				} else {
					//reorder
					pedido.fecha = f[2] + '-' + f[1] + '-' + f[0];
				}
			} else {
				//fecha bad format
			}

			//var fechaEntregaRaw = pedido.fechaEntrega;
			if(typeof pedido.fechaEntrega !== 'undefined'){
				var fe = pedido.fechaEntrega.split('-');
				if(fe.length == 3){
					if(fe[0].length == 4){
						//correct order
					} else {
						//reorder
						pedido.fechaEntrega = fe[2] + '-' + fe[1] + '-' + fe[0];
					}
				} else {
					//fecha bad format
				}
			}

			if(!pedido.completado){
				pedido.componentes.forEach(function(element,index){
					//console.log(element);
					//Componentes.setPedidoProveedor(element,pedido.pedidoProveedorId,pedido.qty);
					componenteAddPedidoProveedor(element.codigo,pedido.pedidoProveedorId,element.qty,element.recibidos,element);
					//if(_.isEmpty(element.componenteData)){
					//stockPorLlegarAddComponente(element.codigo,pedido.pedidoProveedorId,element.qty,element.recibidos,element);
					//}
				});
			} else {
				if(pedido.pendiente){

				} else {
				   pedido.status = 'Completado';
			    }
			}
			if(_.isEmpty(pedido.almacenData)){
				//console.log('almacen vacio');
				pedido.almacenData = Proveedores.getAlmacenById(pedido.almacen);
				//console.log(pedido.almacen);
			}
			if(_.isEmpty(pedido.proveedorData)){
				//console.log('almacen vacio');
				pedido.proveedorData = Proveedores.getProveedorById(pedido.proveedor);
				//console.log(pedido.almacen);
			}
			exports.pedidosProveedores.push(pedido);
		} else {
			//console.log('elemento no int');
		}
	});

	return exports.pedidosProveedores;
	
}
function componenteAddPedido(componente,pedidoId,qty){
	var index =  _.findIndex(exports.componentes,{codigo:componente.codigo});
	var pedidoIndex = _.findIndex(exports.componentes[index].pedidos,{pedidoId:pedidoId});
	if(pedidoIndex > -1){
		exports.componentes[index].pedidos[pedidoIndex].qty +=qty;
	} else {
		exports.componentes[index].pedidos.push({pedidoId:pedidoId,qty:qty});
	}
	return componente;
	
}

function componenteAddPedidoProveedor(componenteId,pedidoProveedorId,qty,recibidos,componente){
	var index =  _.findIndex(exports.componentes,{codigo:componenteId});
	//console.log('componenteId',componenteId);
	//console.log('index',index);
	if(index > -1){
		var componente = exports.componentes[index];
		componente.pedidosProveedores.push({
			pedidoProveedorId:pedidoProveedorId,
			qty:parseInt(qty),
			recibidos:parseInt(recibidos)
		});
		//componente.cantidadProveedores += parseInt(qty); 
	} else {
		// console.log('COMPONENTE NO ENCONTRADO',componenteId);
		log.verbose('COMPONENTE NO ENCONTRADO',componenteId);
	}
	//return componente;
}
function componenteUpdatePedidoProveedor(componenteId,pedidoProveedorId,qty,recibidos){
	var index =  _.findIndex(exports.componentes,{codigo:componenteId});
	//console.log('componenteId',componenteId);
	//console.log('index',index);
	if(index > -1){
		var componente = exports.componentes[index];
		var pedidoIndex =  _.findIndex(componente.pedidosProveedores,{pedidoProveedorId:pedidoProveedorId});
		if(pedidoIndex > -1){
			componente.pedidosProveedores[pedidoIndex].qty = parseInt(qty);
			componente.pedidosProveedores[pedidoIndex].recibidos = parseInt(recibidos);
		} else {
			//añadir
			componente.pedidosProveedores.push(
				{pedidoProveedorId:pedidoProveedorId,
					qty:parseInt(qty),
					recibidos:parseInt(recibidos)
				});
		}

		//componente.cantidadProveedores += parseInt(qty); 
	} else {
		// console.log('COMPONENTE NO ENCONTRADO',componenteId);
		log.verbose('COMPONENTE NO ENCONTRADO',componenteId);
	}
	//return componente;
}
function componenteDeletePedidoProveedor(componenteId,pedidoProveedorId){
	var index =  _.findIndex(exports.componentes,{codigo:componenteId});
	
	if(index > -1){
		var componente = exports.componentes[index];
		var pedidoIndex =  _.findIndex(exports.componentes[index].pedidosProveedores,{pedidoProveedorId:pedidoProveedorId});
		if(pedidoIndex > -1){
			exports.componentes[index].pedidosProveedores.splice(pedidoIndex,1);
			log.info('Componte eliminado del pedido',{nPedido:pedidoProveedorId,codigo:componenteId,categoria:"proveedores"})
		}

	}

}
exports.pedidoProveedorExists = function(req,res){
	res.send({existe:req.existe});
}
exports.pedidoProveedorExistsById = function(req, res, next, id){
	if(exports.dbPedidosProveedores.has(id)){
		req.existe = true;
	} else {
		req.existe = false;
	}
	next();
}
exports.pedidoProveedorByID = function(req, res, next, id) {
	//console.log(req.app.locals.database.pedidosProveedores);
	//var index = _.findIndex(req.app.locals.database.pedidosProveedores,{pedidoProveedorId:id});
	//console.log('pedProdInd',index);
	//if(index > -1){
		//exports.dbPedidosProveedores
		//dbPedidosProveedores = flatfile.sync(zenbatConfig.basePath + zenbatConfig.pedidosProveedores.dbFile);
//console.log('dbPedidosProveedores',dbPedidosProveedores);
	//	console.log('byID.dbPedidosProveedores.keys()',exports.dbPedidosProveedores.keys());
	if(exports.dbPedidosProveedores.has(id)){
		//req.pedidoProveedor = exports.pedidosProveedores[index];
		req.pedidoProveedor = exports.dbPedidosProveedores.get(id);
		next();
	} else {
		return next(res.sendStatus(404))
		//return next(new Error('Pedido a proveedor ' + id + ' no encontrado.'));
	}


	/*var pedidoProveedor = loadById(id);
	console.log('pedidoProveedorByID-id',id);
	//console.log('pedidoProveedorByID-pedidoProveedor',pedidoProveedor);
	if(!pedidoProveedor){
		return res.status(404).send('Pedido no encontrado'
				);		
	}	else {
		req.pedidoProveedor = pedidoProveedor;
	}
	next();*/
};
/**
 * Create a Pedidos proveedore
 */
exports.createPedidoProveedor = function(req, res) {
	//console.log(req.body);
	var pedido = req.body;
	var dbObj = {
		nPedido: pedido.nPedido,
		pedidoProveedorId: pedido.nPedido

	}

	dbObj.fecha = pedido.fecha;
	dbObj.proveedor =pedido.proveedor;
	dbObj.fechaEntrega =pedido.fechaEntrega;
	dbObj.almacen = pedido.almacen;
	dbObj.pendiente = true;
	if(_.isEmpty(pedido.componentes)){
		pedido.componentes = [];
	} else {
		dbObj.componentes = pedido.componentes;
	}
	dbObj.componentes.forEach(function(el,ind){
		componenteAddPedidoProveedor(el.codigo,pedido.nPedido,el.qty,el.recibidos,el);
	});
	dbObj.observaciones = pedido.observaciones;

	dbPedidosProveedores.put(pedido.nPedido,dbObj,function(data){
		exports.pedidosProveedores.push(dbObj);
		//calculos();
		log.info('Pedido proveedor creado',{nPedido:dbObj.nPedido,codigo:dbObj.nPedido,categoria:"proveedores"})
		res.json(dbObj);
	});
	
	//pedido = preparePedidoProveedorData(pedido);
	
	//console.log(dbObj);
	

};


/**
 * Update a Pedidos proveedore
 */
exports.updatePedidoProveedor = function(req, res) {
	// console.log('updating ' + req.pedidoProveedor.nPedido);
	log.verbose('updating ' + req.pedidoProveedor.nPedido);
	var index =  _.findIndex(exports.pedidosProveedores,{pedidoProveedorId:req.pedidoProveedor.nPedido});
	
	var pedidoProveedor = dbPedidosProveedores.get(req.pedidoProveedor.nPedido);
	//console.log('dbPedidosProveedores.keys()',dbPedidosProveedores.keys());
	pedidoProveedor = _.extend(pedidoProveedor, req.body);

	
	pedidoProveedor.componentes.forEach(function(el,ind){
		if(el.removed){
			componenteDeletePedidoProveedor(el.codigo,pedidoProveedor.nPedido);
			pedidoProveedor.componentes.splice(ind,1);
		} else {
			componenteUpdatePedidoProveedor(el.codigo,pedidoProveedor.nPedido,el.qty,el.recibidos);
		}
	});
	dbPedidosProveedores.put(req.pedidoProveedor.nPedido,pedidoProveedor);
	exports.pedidosProveedores[index] = pedidoProveedor;
	//calculos();
	res.json(pedidoProveedor);
};

/**
 * Delete an Pedidos proveedore
 */
exports.deletePedidoProveedor = function(req, res) {
	//console.log('req.params.pedidoProveedorId',req.params.pedidoProveedorId);
	//console.log('req.pedidoProveedor',req.pedidoProveedor);
	// console.log('Deleting ' + req.pedidoProveedor.nPedido);
	log.verbose('Deleting ' + req.pedidoProveedor.nPedido);
	dbPedidosProveedores.del(req.pedidoProveedor.nPedido);
	//borramos tambien el exports
	var index = _.findIndex(exports.pedidosProveedores,{pedidoProveedorId:req.pedidoProveedor.nPedido});
	exports.pedidosProveedores.splice(index,1);
	//y tambien el registro en cada componente
	req.pedidoProveedor.componentes.forEach(function(element,cIndex){
		var cInd = _.findIndex(exports.componentes,{codigo:element.codigo});
		var componente = exports.componentes[cInd];

		var pInd = _.findIndex(componente.pedidosProveedores,{pedidoProveedorId:req.pedidoProveedor.nPedido});
		if(pInd > -1){
			exports.componentes[cInd].pedidosProveedores.splice(pInd,1);
		}
	});
	//calculos();
	log.info('Pedido proveedor borrado',{nPedido:req.pedidoProveedor.nPedido,codigo:req.pedidoProveedor.nPedido,categoria:"proveedores"})
	res.status(200).send({message:"Deleted " + req.pedidoProveedor.nPedido});
};
function completarPedidoProveedor(req,res){
	// console.log("completando pedido " + req.pedidoProveedor.nPedido);
	log.info("Completando pedido " + req.pedidoProveedor.nPedido,{nPedido:req.pedidoProveedor.nPedido,codigo:req.pedidoProveedor.nPedido,categoria:"proveedores"});
	//console.log('completarPedidoProveedor',req.pedidoProveedor);
	var index =  _.findIndex(exports.pedidosProveedores,{pedidoProveedorId:req.pedidoProveedor.nPedido});
	//dbPedidosProveedores = flatfile.sync(zenbatConfig.basePath + zenbatConfig.pedidosProveedores.dbFile);
	//var pedidoProveedor = dbPedidosProveedores.get(req.pedidoProveedor.nPedido);
	//var pedidoProveedor = exports.pedidosProveedores[index];
	//var pedidoProveedor = req.pedidoProveedor;
	var pedidoProveedor = dbPedidosProveedores.get(req.pedidoProveedor.nPedido);
	//console.log('dbPedidosProveedores.keys()',dbPedidosProveedores.keys());
	//console.log(pedidoProveedor);
	
	pedidoProveedor.completado = true;
	dbPedidosProveedores.put(pedidoProveedor.nPedido,pedidoProveedor);
//dbPedidosProveedores.del(pedidoProveedor.nPedido);
	req.pedidoProveedor.componentes.forEach(function(element,index){
		var cInd = _.findIndex(exports.componentes,{codigo:element.codigo});
		//exports.componentes[cInd].cantidad += parseInt(element.recibidos);
		var componente = exports.componentes[cInd];
		if(!_.isNumber(componente.cantidad)){

			componente.cantidad = parseFloat(element.qty);
		} else {
			componente.cantidad += parseFloat(element.qty);
		}
		//console.log('componente.cantidad',componente.cantidad);
		//console.log('element.recibidos',element.recibidos);
		
		var pInd = _.findIndex(componente.pedidosProveedores,{pedidoProveedorId:req.pedidoProveedor.nPedido});
		componente.pedidosProveedores.splice(pInd,1);
		// console.log(componente.codigo + " +" + element.qty);
		log.verbose(componente.codigo + " +" + element.qty);
		var diff = parseFloat(element.qty);
		saveComponente(componente,'proveedores',diff);
	});
	//console.log(dbPedidosProveedores.keys());
	reLoadAll();
	log.info("Pedido a proveedores Nº" + req.pedidoProveedor.nPedido + " completado.",{nPedido:req.pedidoProveedor.nPedido,codigo:req.pedidoProveedor.nPedido,categoria:"proveedores"});
	res.status(200).send({message:"Completado " + req.pedidoProveedor.nPedido});
}
exports.completarPedidoProveedor = completarPedidoProveedor;
function addToPedidoProveedor(req,res){
	console.log('addToPedidoProveedor',req.body);
	


	var pedidoProveedor = exports.dbPedidosProveedores.get(req.body.nPedido);
	
	//var componente = getComponente(req.body.codigo);
	var componenteIndex = _.findIndex(pedidoProveedor.componentes, {'codigo' :req.body.codigo});
	console.log('componenteIndex',componenteIndex);
	var outputQty = 0;
	if(componenteIndex === -1){
		pedidoProveedor.componentes.push({codigo:req.body.codigo,qty:parseInt(req.body.qty),unidad:req.body.unidad,recibidos:0});
		outputQty = req.body.qty;
	} else {
		console.log('comp',pedidoProveedor.componentes[componenteIndex]);
		var comp = pedidoProveedor.componentes[componenteIndex];
		comp.qty += parseInt(qty);
		pedidoProveedor.componentes[componenteIndex] = comp;
		//pedidoProveedor.componentes[componenteIndex].qty += parseInt(qty);
		outputQty = pedidoProveedor.componentes[componenteIndex].qty;
	}
	
	//console.log('pedidoProveedor',pedidoProveedor);
	dbPedidosProveedores.put(req.body.nPedido,pedidoProveedor,function(data){
		//exports.pedidosProveedores.push(dbObj);
		//calculos();
		log.info('Añadido componente' + req.body.codigo +' al pedido',{nPedido:req.body.nPedido,codigo:req.body.nPedido,categoria:"proveedores"})
		//res.json(dbObj);
		res.status(200).send({message:"Añadido " + req.body.codigo +" al pedido " + req.body.nPedido + ". Total componente: " + outputQty});
	});
	
}//res.status(400).send({message:"" + req.body.codigo " al pedido " + req.body.nPedido});
exports.addToPedidoProveedor = addToPedidoProveedor;
function checkComponenteStatus(componente){
	componente.status = 'ok';

	var actual = parseFloat(componente.cantidad) + componente.cantidadRecibida;
	var futura = componente.cantidadProveedores - componente.cantidadRecibida;

//console.log('calcularCosas',componente);

	//var totalReservas = getReservaTotal(componente);

	var totalPedidosProveedores = componente.cantidadProveedores;
    var usable = actual - componente.cantidadReservada ;
    var stockMinimo = parseFloat(componente.stockSeguridad);
    var usableFuturo = usable + componente.cantidadNoRecibida;
    //var cantReservas = componente.pedidos.length;
    //var cantPedidosProveedores = componente.pedidosProveedores.length;
    //console.log(componente);
    componente.hasReservas = false;
    componente.totalReservas = componente.cantidadProveedores;
    componente.totalPedidosProveedores = componente.cantidadProveedores;
    componente.usable = usable;

    componente.cantReservas = componente.pedidos.length;
    componente.cantPedidosProveedores = componente.pedidosProveedores.length;
    if(componente.cantidadReservada > 0){
    	componente.hasReservas = true;
    }
    if(componente.cantidadProveedores > 0){
    	componente.hasProveedores = true;
    }
    

 //   if(totalPedidosProveedores > 0){
	    if(usableFuturo < 0){
			componente.status = 'negativo';
	    	
	    } else {
	    	if(usableFuturo < stockMinimo){
		    	componente.status = 'bajoMinimos';
		    	
	   		}
	    }
//	}
	if(componente.hasReservas){
    		componente.status += ' con PC';
    		if(componente.hasProveedores){
		    		componente.status += ' y Proveedor';
		    	}
    	} else {
    		if(componente.hasProveedores){
		    		componente.status += ' con Proveedor';
		    	}
    	}
    	
	return componente;


}
function _checkComponenteStatusOLD(componente){
	componente.status = 'ok';

	var actual = parseFloat(componente.cantidad) + componente.cantidadRecibida;
	var futura = componente.cantidadProveedores - componente.cantidadRecibida;

//console.log('calcularCosas',componente);

	//var totalReservas = getReservaTotal(componente);

	var totalPedidosProveedores = componente.cantidadProveedores;
    var usable = actual - componente.cantidadReservada ;
    var stockMinimo = parseFloat(componente.stockSeguridad);
    var usableFuturo = usable + componente.cantidadNoRecibida;
    //var cantReservas = componente.pedidos.length;
    //var cantPedidosProveedores = componente.pedidosProveedores.length;
    //console.log(componente);
    componente.hasReservas = false;
    componente.totalReservas = componente.cantidadProveedores;
    componente.totalPedidosProveedores = componente.cantidadProveedores;
    componente.usable = usable;

    componente.cantReservas = componente.pedidos.length;
    componente.cantPedidosProveedores = componente.pedidosProveedores.length;
    if(componente.totalReservas > 0){
    	componente.hasReservas = true;
    }

   if(usable < 0){
		componente.status = 'negativo';
    	if(componente.hasReservas){
    		componente.status += 'ConReserva';
    	}
    } else {
    	if(usable < stockMinimo){
	    	componente.status = 'bajoMinimos';
	    	if(componente.hasReservas){
	    		componente.status += 'ConReserva';
	    	}
   		}
    }
    if(totalPedidosProveedores > 0){
	    if(usableFuturo < 0){
			componente.status = 'negativoFuturo';
	    	if(componente.hasReservas){
	    		componente.status += 'ConReserva';
	    	}
	    } else {
	    	if(usableFuturo < stockMinimo){
		    	componente.status = 'bajoMinimosFuturo';
		    	if(componente.hasReservas){
		    		componente.status += 'ConReserva';
		    	}
	   		}
	    }
	}
	return componente;


}
function calculosComponente(componente){
	componente.cantidadProveedores = 0;
		componente.cantidadRecibida = 0;
		componente.pedidosProveedoresSums = [];
		componente.pedidosProveedores.forEach(function(pedidoProveedor,ppIndex){
		
			
					componente.cantidadProveedores += parseInt(pedidoProveedor.qty);
					componente.cantidadRecibida += parseInt(pedidoProveedor.recibidos);
					componente.pedidosProveedoresSums.push({pedidoId:pedidoProveedor.pedidoProveedorId,sum:componente.cantidadProveedores});
			
		});
		componente.cantidadNoRecibida = componente.cantidadProveedores - componente.cantidadRecibida;

		componente.cantidadReservada = 0;
		componente.pedidosSums = [];
		//var sortedComponentePedidos = _.sortBy(componente.pedidos,'pedidoId');
		//console.log(sortedComponentePedidos)
		componente.pedidos.forEach(function(pedido,pIndex){
			componente.pedidosSums.push({pedidoId:pedido.pedidoId,sum:componente.cantidadReservada});
			componente.cantidadReservada += parseInt(pedido.qty);


		});

		componente.cantidadRecomendada = parseInt(componente.cantidadReservada) + parseInt(componente.stockSeguridad) - parseInt(componente.cantidad);
		//componente.cantidad += componente.cantidadRecibida;
		//console.log("CR:" + componente.cantidadRecomendada + " CRes:" + componente.cantidadReservada + " SS: " + componente.stockSeguridad + " C: " + componente.cantidad );
		componente = checkComponenteStatus(componente);
		return componente;
}
function calculosPedidosProveedor(pedidoProveedor,ppIndex){
	if(pedidoProveedor.completado){
		pedidoProveedor.status = 'Completado';
		pedidoProveedor.pendiente = false;
	} else {
		pedidoProveedor.status = 'Pendiente';
		pedidoProveedor.pendiente = true;
	}
	var total = 0;
	var weight = 0;
	pedidoProveedor.componentes.forEach(function(el,ind){

		var cind =  _.findIndex(exports.componentes,{codigo:el.codigo});
		if(cind > -1){
					//	console.log('componente',cind);
						var componente = exports.componentes[cind];
						//console.log('componente',componente);
						var componenteData = {
							
							status: componente.status,
							cantidad:  componente.cantidad,
							cantidadReservada: componente.cantidadReservada,
							cantidadProveedores: componente.cantidadProveedores,
							stockSeguridad: componente.stockSeguridad,
							cantidadRecomendada: componente.cantidadRecomendada
						};
						//pedidoProveedor.componentes[ind].componenteData = componenteData;
						_.extend(pedidoProveedor.componentes[ind],componente);
//

					}
		//pedidoProveedor.componentes[ind].precioTotal = parseFloat(el.qty) * parseFloat(el.precioUnit) ;
		var precioTotal = parseFloat(el.qty) * parseFloat(el.precioUnit) ;
		pedidoProveedor.componentes[ind].precioTotal = precioTotal;
		if(typeof pedidoProveedor.componentes[ind].weight === 'undefined'){
				pedidoProveedor.componentes[ind].weight = weight;
				weight++;
			}


		

		if(precioTotal > 0){
			total += pedidoProveedor.componentes[ind].precioTotal;
		}
		
	});
	pedidoProveedor.totalPedido = total;
	exports.pedidosProveedores[ppIndex] = pedidoProveedor;
	return pedidoProveedor;
}
function calculosPedido(pedido){
	var faltanComponentes = false;
	var componentesEnCamino;
	if(pedido.status !== 'EL ARMARIO NO A SIDO GENERADO'){
		pedido.stock.forEach(function(componentePedido,index){
			if(componentePedido.status === 'no procesado'){
				//console.log('calculosPedido.componentePedido',componentePedido);
				var cIndex = _.findIndex(exports.componentes,{codigo:componentePedido.componenteId});
				var componente = exports.componentes[cIndex];
				var necesarios = componentePedido.cantidad;
				componentePedido.necesarios = necesarios;
				componentePedido.codigo = componente.codigo;
				componentePedido.stock = componente.cantidad + componente.cantidadRecibida;
				componentePedido.denominacion = componente.denominacion;
				//console.log('calculosPedido.componente',componente);
				componentePedido.cantidadReservada = componente.cantidadReservada;
				componentePedido.cantidadProveedores = componente.cantidadProveedores;
				
				var pedidoInd = _.findIndex(componente.pedidosSums,{pedidoId:pedido.pedidoId});
				var sumPedidoActual = componente.pedidosSums[pedidoInd].sum;
				componentePedido.sumPedidoActual = sumPedidoActual;
				if(componentePedido.stock > (sumPedidoActual + necesarios)){
					componentePedido.faltan = 0;
					
				} else {
			
					componentePedido.faltan = componentePedido.stock - sumPedidoActual - componentePedido.necesarios;
					if(componentePedido.faltan < 0){
						componentePedido.faltan  = -componentePedido.faltan;
					}
				}
				if(componentePedido.faltan === 0){
					componentePedido.disponible = true;
				} else {

					//Checkear si hay componentes en camino
					if(tempComponentes[cIndex].cantidadNoRecibida >= componentePedido.faltan){
						tempComponentes[cIndex].cantidadNoRecibida -= componentePedido.faltan;
						componentesEnCamino = true;
					} else {
						
						
						componentesEnCamino = false;
						componentePedido.disponible = false;
						faltanComponentes = true;
					}
				}
				componentePedido.status = 'procesado';
				pedido.stock[index] = componentePedido;
			}	
		});
	if(pedido.pendientes > 0){
		if(faltanComponentes){

			pedido.entregado = false;
			pedido.status ='FALTAN COMPONENTES';
			pedido.entregable = false;
			pedido.cssClass = 'times';
		} else if(componentesEnCamino) {
			pedido.entregado = false;
			pedido.status ='COMPONENTES EN CAMINO';
			pedido.entregable = false;
			pedido.cssClass = 'hourglass';
		
		} else {
			pedido.status = 'OK';
			pedido.entregado = true;
			pedido.cssClass = 'check';
		}


	} else if(pedido.pendientes === 0){
		pedido.status = 'FINALIZADO';
		pedido.entregado = true;
		pedido.cssClass = 'truck';
	} else {
		pedido.entregado = false;
	}

}
	if(pedido.status === 'FALTAN IDS'){
		pedido.cssClass = 'times';
	} else if(pedido.status === 'EL ARMARIO NO A SIDO GENERADO'){
		pedido.cssClass = 'warning';


	}
	return pedido;
}
function calculos(){

	log.verbose('init calculando...');


	log.verbose('calculos componentes...');
	exports.componentes.forEach(function(componente,cIndex){
		exports.componentes[cIndex] = calculosComponente(componente);
	});	
	tempComponentes = exports.componentes;
	log.verbose('calculos pedidosProveedores...');
	exports.pedidosProveedores.forEach(function(pedidoProveedor,ppIndex){
		
		exports.pedidosProveedores[ppIndex] = calculosPedidosProveedor(pedidoProveedor,ppIndex);
	});	
	log.verbose('calculos pedidos...');
	exports.pedidos.forEach(function(pedido,pIndex){
		exports.pedidos[pIndex] = calculosPedido(pedido);
	});
	log.verbose('fin calculando.');
	//log.info("Carga de datos y calculos finalizados.");
}
exports.calculos = calculos;
function getComponenteById(req,res,next,id){
	//var componente = cache.get(id);
	//componente = loadComponenteElements(componente);
//var index = _.findIndex(exports.componentes,{codigo:id});
var index = _.findIndex(exports.componentes,{codigo:id});
	//console.log('pedProdInd',index);
	if(index > -1){
		exports.componentes[index] = calculosComponente(exports.componentes[index]);
		req.componente = exports.componentes[index];
		next();
	} else {
		return next(new Error('Failed to load componente ' + id));
	}

	//return componente;
}
exports.getComponenteById = getComponenteById;
function getPedidoById(req,res,next,id){
	//var componente = cache.get(id);
	//componente = loadComponenteElements(componente);
//var index = _.findIndex(exports.componentes,{codigo:id});
var index = _.findIndex(exports.pedidos,{pedidoId:id});
	//console.log('pedProdInd',index);
	if(index > -1){
		//exports.pedidos[index] = calculosPedido(exports.pedidos[index]);
		req.pedido = exports.pedidos[index];
		next();
	} else {
		return next(new Error('Failed to load pedido ' + id));
	}

	//return componente;
}
exports.getPedidoById = getPedidoById;
function verificarComponenteId(componenteId){

	//var index = _.findIndex(req.app.locals.database.componentes,{codigo:id});
	//var exists = cache.has(componenteId);
	var index = _.findIndex(exports.componentes,{codigo:componenteId});
	//console.log('verificarComponenteId',index);
	if(index > -1){
		return true;
	} else {
		return false;
	}
	
}
exports.verificarComponenteId = verificarComponenteId 
function getArmario(id){
	var filepath = zenbatConfig.basePath + zenbatConfig.armarios.folder + '\\' + id + '.xlsx';
    if (fs.existsSync(filepath)) {
	  //console.log('Found file',filepath);
	    var workbook = XLSX.readFileSync(filepath);

	 	var componentesRaw = XLSX.utils.sheet_to_json(workbook.Sheets.componentes,{header:zenbatConfig.armarios.header,range:3});
	    var componentes = componentesRaw.filter(function(element,index){
	  		return (element.Cantidad)?true: false;
	  	});
	    var faltanIDs = false;
	  	componentes.forEach(function(element,index){
	  		//verificar returs true if exists
	  		componentes[index].Cantidad = parseFloat(element.Cantidad).toFixed(2);
	  		var faltaID = !verificarComponenteId(element.Codigo);
	  		if(faltaID){
	  			faltanIDs = true;
	  		}
	  		componentes[index].faltaID = faltaID;
	  	
	    });
	 ///console.log('arm-comps',componentes);
	    return {
	  		id: id,
	  		faltanIDs:faltanIDs, 
	  		componentes:componentes
	    };
	} else {
		return false;
	}
}
exports.getArmario = getArmario;
exports.stock = function(req, res) {
	var qty = parseFloat(req.query.qty);
	//console.log(req.componente);
	var nowQty = parseFloat(req.componente.cantidad);
	req.componente.cantidad = nowQty + qty;
	var componente = calculosComponente(req.componente);
	saveComponente(componente,'manual',qty);
	//req.componente.bajoMinimos = checkMinimos(req.componente);
	//req.componente = calcularCosas(req.componente);
	//updateComponente(req.componente);
	
	res.jsonp(req.componente);
};
exports.componentesToJson = function(req,res){
	var componentes = exports.componentes;
//	loadComponentes();
	//Pedidos.loadPedidos();
	var output = [];
	
	componentes.forEach(function(element,index){
		element.cantidadReal = ' ';
		output[index] = element;
	});
	return output;	
}
/*
Usado por el importador de componentes ( XLS -> Zenbat)
*/
exports.updateComponenteCantidad = function(componenteId,cantidad){

	var cIndex = _.findIndex(exports.componentes,{codigo:componenteId});
	if(cIndex > -1){
		exports.componentes[cIndex].cantidad = cantidad;
	saveComponente(exports.componentes[cIndex],'importador',cantidad);
	return true;
} else {
	// console.log('Componente No encontrado: ' + componenteId);
	log.verbose('Componente No encontrado: ' + componenteId);
	return false;
}
	

}
exports.getHomeData = function(req,res){
	var compCount = exports.componentes.length;
	var pedidosFaltan = [];
	pedidosFaltan = _.filter(exports.pedidos,function(pedido){
		if(pedido.status == "FALTAN COMPONENTES"){
			return true;
		} else if(pedido.status == "FALTAN IDS"){
			return true;
		} else {
			return false;
		}
	});
	var pedidosProveedoresPendientes;
	pedidosProveedoresPendientes = _.filter(exports.pedidosProveedores,function(pedido){
		if(pedido.status == "Pendiente"){
			return true;
		} else {
			return false;
		}
	});
	var leyenda = "";
	//var leyendaFile =  zenbatConfig.basePath + "leyenda.txt";
	//leyenda = fs.readFileSync( leyendaFile).toString();
	var leyendaFile =  zenbatConfig.basePath + "leyenda.txt";
	if (fs.existsSync(leyendaFile)) {
		fs.readFile( leyendaFile, function (err, data) {
	  if (err) {
	    throw err; 
	  }
	  //console.log();
	  leyenda =  data.toString();
		});
	} else {
		leyenda=  'file not found';
	}
	
	/*if (fs.existsSync(leyendaFile)) {
		fs.readFileSync( leyendaFile, function (err, data) {
	  if (err) {
	    throw err; 
	  }
	  //console.log();
	 leyenda = data.toString();
	 console.log(leyenda);
		});
	}*/

	var proximosFile =  zenbatConfig.basePath + "proximos-pedidos.xlsx";
	var proximosworkbook = XLSX.readFileSync(proximosFile);
	//exports.workbook = workbook;
	//console.log(proximosworkbook);
	//var componentesRaw = XLSX.utils.sheet_to_json(workbook.Sheets.componentes,{header:headerProductos,range:1});
	var sheetname = proximosworkbook.SheetNames[0];
	var proximosRaw = XLSX.utils.sheet_to_json(proximosworkbook.Sheets[sheetname]);
	//console.log('proximosRaw',proximosRaw);
	//console.log('componentesRaw.length',componentesRaw.length);
	//var componentes = componentesRaw.filter(loadComponentesFilter);
	//console.log(componentes.length);
	//return componentes;

	var proximos;
	

	var output = {
		proximos: proximosRaw,
		numComponentes: compCount,
		pedidosFaltan: pedidosFaltan,
		pedidosProveedoresPendientes:pedidosProveedoresPendientes
	}
	res.send(output);
}
function getLeyendaData(){
	var leyendaFile =  zenbatConfig.basePath + "leyenda.txt";
	if (fs.existsSync(leyendaFile)) {
		fs.readFile( leyendaFile, function (err, data) {
	  if (err) {
	    throw err; 
	  }
	  //console.log();
	  return data.toString();
		});
	} else {
		return 'file not found';
	}
}
exports.getLeyenda = function(req,res){
	var leyendaFile =  zenbatConfig.basePath + "leyenda.txt";
	if (fs.existsSync(leyendaFile)) {
		fs.readFile( leyendaFile, function (err, data) {
	  if (err) {
	    throw err; 
	  }
	  //console.log();
	  return  res.send(marked(data.toString()));
		});
	} else {
		return 'file not found';
	}

		

}

exports.getPedidosAutocomplete = function(req,res){

}
function toJSON(o){
	o.replace('\n','');
	return JSON.parse(o);
}
exports.getHistorial = function(req,res){
	
	//var file = fs.readFileSync( zenbatConfig.basePath + "historial.log",'utf8');
	//var obj = JSON.parse( fs.readFileSync(zenbatConfig.basePath + "historial.log", 'utf8'));
	// var obj = JSON.parse('[' + fs.readFileSync(zenbatConfig.basePath + "historial.log", 'utf8') + ']');
	//var lines = file.split('\r');
	//var jLines = _.map(lines,'toJSON');
	//console.log(jLines);

	/*console.log('Historial');

	 var options = {
    from: '2016-01-01 00:00:00.000',
   // until: new Date,
    // limit: 10,
    // start: 0,
    q:'pedido',
    order: 'desc',
    fields: ['message','codigo','categoria','timestamp','level']
  };
	 log.query(options, function (err, results) {
    if (err) {
      throw err;
    }
    // console.log(results);
res.send(results.file);
     // console.log(results);
  });*/
var logs = log.query();
res.send(logs);
}