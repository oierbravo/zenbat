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

var chokidar = require('chokidar');
var watcher = chokidar.watch(zenbatConfig.basePath , {
  ignored: /[\/\\]\./,
  persistent: true
});

var log = console.log.bind(console);

watcher.on('change',function(path){
  //log('File', path, 'has been changed');
  if(path.indexOf('pedidos.xlsx') !== -1){
 	console.log('cambios en pedidos.xlsx');
 	reloadPedidos = true;
 	cache.put('pedidos-changed',true);
  }
});

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
	console.log('result-entregar',entregados);
	
	
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
function loadPedidosFromFile(){
	var workbook = XLSX.readFileSync(zenbatConfig.basePath + zenbatConfig.pedidos.file);

		var sheetName = workbook.SheetNames[workbook.SheetNames.length -1];

		var pedidosSheet = workbook.Sheets[sheetName];
		var pedidos = XLSX.utils.sheet_to_json(pedidosSheet,{header:zenbatConfig.pedidos.header,range:1});
	
		pedidos.forEach(function(element,index){
			if(element.fecha){
				element.fechaUnix = moment(element.fecha).format('x');
			}
		});
		var sortedPedidos = _.sortBy(pedidos,'fechaUnix');

		
		return sortedPedidos;
}
function loadPedidosForEach(element,index){

		
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
			console.log('VERIFICANDO');
			if(element.lastEntregados !== element.entregados){
				var o = element.entregados - element.lastEntregados;
				console.log('por entregar',o);
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
}

exports.loadPedidos = loadPedidos;
function getPedidoFromID(pedidoID){
	var splitted = pedidoID.split('_');
	var nuFecha =splitted[0];
	if(_.isEmpty(exports.pedidos)){
		console.log('pedidos empty CARGANDO');
		loadPedidos();
	}
	var pedido = _.find(exports.pedidos,{pedidoId:pedidoID});
	return pedido;

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




/**
 * List of Pedidos
 */
exports.list = function(req, res) { 
	loadPedidos();
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

