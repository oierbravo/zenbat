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
var Armarios = require('./armarios.server.controller.js');

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



function loadAll(){
	loadComponentes();
	loadPedidos();
	loadPedidosProveedores();
	calculos();

}
loadAll();
exports.loadAll = loadAll;
function reLoadAll(){
	loadAll();
}
exports.reLoadAll = reLoadAll;
function reloadAllCli(req,res){
	reLoadAll();
	res.status(200);
	var numComponentes = exports.componentes.length;
	var numPedidos = exports.pedidos.length;
	var numPedidosProveedores = exports.pedidosProveedores.length;

	var numPedidosEntregados = exports.pedidosEntregados.length;

	var str ='Cargados: ' + numComponentes + ' componentes, ' + numPedidos + ' pedidos y ' + numPedidosProveedores +' pedidos a proveedores. ';
	if(numPedidosEntregados > 0){
		str += numPedidosEntregados + ' pedidos entregados';
	}
	res.send({message:str,pedidoEntregados:exports.pedidosEntregados});
}
exports.reloadAllCli = reloadAllCli;
function loadComponentes(){
	exports.componentes = [];
	var componentes = loadComponentesFromFile();
	exports.componentes = componentes;
	exports.componentes.forEach(loadComponentesForEach);
	console.log(componentes.length + ' componentes loaded');
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

function saveComponente(componente){
	var dbObj = {
		cantidad:componente.cantidad
	}
	dbProductos.put(componente.codigo,dbObj);
	var cInd = _.findIndex(exports.componentes,{codigo:componente.codigo});
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
	pedido.armario = armario;
	if(armario.faltanIDs){
		pedido.status = 'FALTAN IDS';
		pedido.entregable = false;
	}
	//entregamos los completos.
	if( pedido.entregados >  pedido.lastEntregados){
		var diff = pedido.entregados - pedido.lastEntregados;
		console.log(diff + " armarios a entregar");
		pedido.porEntregar = diff;
		pedido = entregarPedido(pedido);
		
	} else {
		pedido.porEntregar = 0;
	}
	
	//actualizam os los componentes
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

}
exports.loadPedido = function(){

}
function savePedido(pedido){
	var dbObj = {
		entregados:pedido.entregados,
		lastEntregados: pedido.lastEntregados
	}
	dbPedidos.put(pedido.pedidoId,dbObj);
	var pIndex = _.findIndex(exports.pedidos,{pedidoId:pedido.pedidoId});
	exports.pedidos[pIndex] = pedido;
	console.log('saved ' + pedido.pedidoId + ' with index ' + pIndex);
	return pedido;
}
exports.savePedido = savePedido;
function entregarPedido(pedido){
	console.log('Entregando pedido');
	console.log('entregar',pedido);
	console.log('procesando ' + pedido.armario.componentes.length + ' componentes.');
	pedido.armario.componentes.forEach(function(element,index){
		var compIndex = _.findIndex(exports.componentes,{codigo:element.Codigo});
		if(compIndex > -1){
			var componente = exports.componentes[compIndex];
			componente.cantidad -= parseFloat(element.Cantidad) * pedido.porEntregar;
			saveComponente(componente);
		}
	});
	pedido.lastEntregados = pedido.entregados;
	exports.pedidosEntregados.push(pedido);
	savePedido(pedido);
	return pedido;
}
exports.entragarPedido = entregarPedido;
function loadPedidosProveedores(){
	//console.log('loadPedidosProveedores.dbPedidosProveedores',dbPedidosProveedores);
	exports.pedidosProveedores = [];
	var keys = dbPedidosProveedores.keys();
	keys.forEach(function(element,index){
		var pedido = dbPedidosProveedores.get(element);
		if(!pedido.completado){
			pedido.componentes.forEach(function(element,index){
				//console.log(element);
				//Componentes.setPedidoProveedor(element,pedido.pedidoProveedorId,pedido.qty);
				componenteAddPedidoProveedor(element.codigo,pedido.pedidoProveedorId,element.qty,element.recibidos)
			});
		} else {
			pedido.status = 'Completado';
		}
		exports.pedidosProveedores.push(pedido);
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

function componenteAddPedidoProveedor(componenteId,pedidoProveedorId,qty,recibidos){
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
		console.log('COMPONENTE NO ENCONTRADO',componenteId);
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
		console.log('COMPONENTE NO ENCONTRADO',componenteId);
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
		}

	}

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
		return next(new Error('Failed to load Pedido ' + id));
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
	if(_.isEmpty(pedido.componentes)){
		pedido.componentes = [];
	} else {
		dbObj.componentes = pedido.componentes;
	}
	dbObj.componentes.forEach(function(el,ind){
		componenteAddPedidoProveedor(el.codigo,pedido.nPedido,el.qty,el.recibidos);
	});
	dbObj.observaciones = pedido.observaciones;

	dbPedidosProveedores.put(pedido.nPedido,dbObj,function(data){
		exports.pedidosProveedores.push(dbObj);
		res.json(dbObj);
	});
	
	//pedido = preparePedidoProveedorData(pedido);
	
	//console.log(dbObj);
	

};


/**
 * Update a Pedidos proveedore
 */
exports.updatePedidoProveedor = function(req, res) {
	console.log('updating ' + req.pedidoProveedor.nPedido);
	
	var index =  _.findIndex(exports.pedidosProveedores,{pedidoProveedorId:req.pedidoProveedor.nPedido});
	
	var pedidoProveedor = dbPedidosProveedores.get(req.pedidoProveedor.nPedido);
	console.log('dbPedidosProveedores.keys()',dbPedidosProveedores.keys());
	pedidoProveedor = _.extend(pedidoProveedor, req.body);

	dbPedidosProveedores.put(req.pedidoProveedor.nPedido,pedidoProveedor);
	pedidoProveedor.componentes.forEach(function(el,ind){
		if(el.removed){
			componenteDeletePedidoProveedor(el.codigo,pedidoProveedor.nPedido);
			pedidoProveedor.componentes.splice(ind,1);
		} else {
			componenteUpdatePedidoProveedor(el.codigo,pedidoProveedor.nPedido,el.qty,el.recibidos);
		}
	});
	
	exports.pedidosProveedores[index] = pedidoProveedor;
	res.json(pedidoProveedor);
};

/**
 * Delete an Pedidos proveedore
 */
exports.deletePedidoProveedor = function(req, res) {
	//console.log('req.params.pedidoProveedorId',req.params.pedidoProveedorId);
	//console.log('req.pedidoProveedor',req.pedidoProveedor);
	console.log('Deleting ' + req.pedidoProveedor.nPedido);
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
	calculos();
	res.status(200).send({message:"Deleted " + req.pedidoProveedor.nPedido});
};
function completarPedidoProveedor(req,res){
	console.log('completarPedidoProveedor',req.pedidoProveedor);
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

			componente.cantidad = parseFloat(componente.cantidad);
		}
		//console.log('componente.cantidad',componente.cantidad);
		//console.log('element.recibidos',element.recibidos);
		componente.cantidad += element.cantidad;
		var pInd = _.findIndex(componente.pedidosProveedores,{pedidoProveedorId:req.pedidoProveedor.nPedido});
		componente.pedidosProveedores.splice(pInd,1);
		saveComponente(componente);
	});
	//console.log(dbPedidosProveedores.keys());
	reLoadAll();
	res.status(200).send({message:"Completado " + req.pedidoProveedor.nPedido});
}
exports.completarPedidoProveedor = completarPedidoProveedor;

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
    componente.totalReservas = componente.cantidadProveedores;
    componente.totalPedidosProveedores = componente.cantidadProveedores;
    componente.usable = usable;

    componente.cantReservas = componente.pedidos.length;
    componente.cantPedidosProveedores = componente.pedidosProveedores.length;


   if(usable < 0){
		componente.status = 'negatibo';
    	if(componente.cantidadNoRecibida > 0){
    		componente.status += 'ConReserva';
    	}
    } else {
    	if(usable < stockMinimo){
	    	componente.status = 'bajoMinimos';
	    	if(componente.cantidadNoRecibida > 0){
	    		componente.status += 'ConReserva';
	    	}
   		}
    }
    if(totalPedidosProveedores > 0){
	    if(usableFuturo < 0){
			componente.status = 'negatiboFuturo';
	    	if(componente.cantidadNoRecibida > 0){
	    		componente.status += 'ConReserva';
	    	}
	    } else {
	    	if(usableFuturo < stockMinimo){
		    	componente.status = 'bajoMinimosFuturo';
		    	if(componente.cantidadNoRecibida > 0){
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
		componente.pedidosProveedores.forEach(function(pedidoProveedor,ppIndex){
		
			
					componente.cantidadProveedores += parseInt(pedidoProveedor.qty);
					componente.cantidadRecibida += parseInt(pedidoProveedor.recibidos);
					
			
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
		componente = checkComponenteStatus(componente);
		return componente;
}
function calculosPedidosProveedor(pedidoProveedor,ppIndex){
	if(pedidoProveedor.completado){
		pedidoProveedor.status = 'Completado';
	} else {
		pedidoProveedor.status = 'Pendiente';
	}
	exports.pedidosProveedores[ppIndex] = pedidoProveedor;
	return pedidoProveedor;
}
function calculosPedido(pedido){
	var faltanComponentes = false;
	pedido.stock.forEach(function(componentePedido,index){
		if(componentePedido.status === 'no procesado'){
			//console.log('calculosPedido.componentePedido',componentePedido);
			var cIndex = _.findIndex(exports.componentes,{codigo:componentePedido.componenteId});
			var componente = exports.componentes[cIndex];
			var necesarios = componentePedido.cantidad;
			componentePedido.necesarios = necesarios;
			componentePedido.codigo = componente.codigo;
			componentePedido.stock = componente.cantidad;
			componentePedido.denominacion = componente.denominacion;
			//console.log('calculosPedido.componente',componente);
			
			
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
				componentePedido.disponible = false;
				faltanComponentes = true;
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
	if(pedido.status === 'FALTAN IDS'){
		pedido.cssClass = 'times';
	}
	return pedido;
}
function calculos(){
	console.log('init calculando...');
	console.log('calculos componentes...');
	exports.componentes.forEach(function(componente,cIndex){
		//console.log('calculando-componente-foreach',componente);
		
		exports.componentes[cIndex] = calculosComponente(componente);
	});	
	console.log('calculos pedidosProveedores...');
	exports.pedidosProveedores.forEach(function(pedidoProveedor,ppIndex){
		//console.log('calculando-componente-foreach',componente);
		
		exports.pedidosProveedores[ppIndex] = calculosPedidosProveedor(pedidoProveedor,ppIndex);
	});	
	console.log('calculos pedidos...');
	exports.pedidos.forEach(function(pedido,pIndex){
		exports.pedidos[pIndex] = calculosPedido(pedido);
	});
	console.log('fin calculando');
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
  		componentes[index].Cantidad = parseFloat(element.Cantidad);
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
	saveComponente(componente);
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
exports.updateComponenteCantidad = function(componenteId,cantidad){
	var cIndex = _.findIndex(exports.componentes,{codigo:componenteId});
	if(cIndex > -1){
		exports.componentes[cIndex].cantidad = cantidad;
	saveComponente(exports.componentes[cIndex]);
	return true;
} else {
	console.log('Componente No encontrado: ' + componenteId);
	return false;
}
	

}