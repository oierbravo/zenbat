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
require('array.prototype.find');
var cache = require('memory-cache');
var zenbatConfig = require('../../zenbat.config.js');

var headerPedidos = zenbatConfig.pedidos.header;

exports.pedidos = [];
exports.pedidosProcesados = [];

var reloadPedidos = true;

var flatfile = require('flat-file-db');
var dbPedidos = flatfile.sync('./pedidos.db');

var chokidar = require('chokidar');
var watcher = chokidar.watch('./data/' , {
  ignored: /[\/\\]\./,
  persistent: true
});

var log = console.log.bind(console);

watcher.on('change',function(path){
 //log('File', path, 'has been changed');
 if(path.indexOf("pedidos.xlsx") != -1){
 	console.log('cambios en pedidos.xlsx');
 	reloadPedidos = true;
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

function getPedidoFromID(pedidoID){
	//console.log(pedidoID);
	return cache.get(pedidoID);
	/*var spl = pedidoID.split('_');
	var fecha = spl[0];
	var codigoArmario = spl[1];
	var PC = spl[2];
	var pedido = exports.pedidos.find(function(el){
		var result = false;
		if(el.codigo === codigoArmario && el.PC === PC && el.fecha === fecha){
			result = true;
		}
		return result;
	});
	//console.log(pedido);
	return pedido;
*/
}

function loadPedidos(){
	if(reloadPedidos){
		var workbook = XLSX.readFileSync(zenbatConfig.pedidos.file);

		var sheetName = workbook.SheetNames[workbook.SheetNames.length -1];

		var pedidosSheet = workbook.Sheets[sheetName];
		var pedidos = XLSX.utils.sheet_to_json(pedidosSheet,{header:zenbatConfig.pedidos.header,range:1});
	

		var sortedPedidos = _.sortBy(pedidos,'fecha').reverse();
		sortedPedidos.forEach(function(element,index){
			
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
			if(element.cantidad !== element.entregados){
				element.stock =  Armarios.verificarStock(armarioId,element.cantidad - element.entregados,marcarReserva);
				if(element.stock.status === 'ok'){
					element.entregable = true;
				} else {
					element.entregable = false;
				}
				if(element.lastEntregados !== element.entregados){
					var o = element.entregados - element.lastEntregados;
					console.log('por entregar',o);
					element.porEntregar = o;
					entregar(element);
				}
			} else {
				element.stock = {
					status: 'FINALIZADO'
				}
			}
			cache.put(element.pedidoId,element);
			sortedPedidos[index] = element;

			console.log('pedidos foreach',element);
		});
	
		if(pedidos.length === 0){

			exports.pedidos = [];

				
		} else {
			exports.pedidos = sortedPedidos;
		}
	
		cache.put('pedido-cargados',true);

		reloadPedidos = false;
	}

}

/**
 * Show the current Pedido
 */
exports.read = function(req, res) {
	//console.log('pedido read');
	var armarioId = req.pedido.codigo + '-' +  req.pedido.rev;
	//console.log(armarioId);
	//var stock = Armarios.verificarStock(armarioId,req.pedido.cantidad);
	//console.log(stock);
	//req.pedido.stock  = stock ;
	res.jsonp(req.pedido);
};




/**
 * List of Pedidos
 */
exports.list = function(req, res) { 
	//console.log('pedidos list');

		loadPedidos();
	

	  res.jsonp(exports.pedidos);


};

/**
 * Pedido middleware
 */
exports.pedidoByID = function(req, res, next, id) { 
	//console.log('pedidoById');
	//console.log(id);
	loadPedidos();
	var pedido = getPedidoFromID(id);
		//console.log('pedidoById',pedido);
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
function entregar(pedido){
	console.log('entregar',pedido);
	console.log('por entregar',pedido.porEntregar);

	var entregados = Armarios.entregar(pedido.armarioId,pedido.porEntregar);
	console.log('result-entregar',entregados);
	
	
	dbPedidos.put(pedido.pedidoId,{lastEntregados:pedido.entregados});
}
exports.entregar = function(pedidoId,qty){
	// -> descontar componentes
	console.log('comp entregar');
};