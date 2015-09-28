'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	
	_ = require('lodash');
var csv = require('ya-csv');
//load csv file 
require('array.prototype.find');
var XLSX = require('xlsx');

//var fileProductos = './data/productos.xlsx';
var cache = require('memory-cache');
var zenbatConfig = require('../../zenbat.config.js');

var flatfile = require('flat-file-db');
var dbProductos = flatfile.sync('./productos.db');
//var headerProductos = ['codigo','denominacion','stockSeguridad','proveedor','codProveedor','pedidoMinimo','yearPrecio','precioUnit','notas','proveedor2','codProveedor2','pedidoMinimo2','yearPrecio2','precioUnit2','notas2'];
//var headerStock = ['codigo','denominacion','cantidad','cantidadReservada'];

var fileProductos = zenbatConfig.componentes.file;
var headerProductos = zenbatConfig.componentes.header;
var headerStock = zenbatConfig.stock.header;

exports.componentesArray = [];
exports.componentes = [];

exports.workbook = '';

function mergeArrays(arr1,arr2){
	var result = [];
	arr1.forEach(function(element,index){
		
		
		
		_.merge(element, arr2[index]);
		result.push(element);
		//console.log(element);
	
	});
	return result;
}

function loadComponente(componente){
	var output;
	var dbFields;
	if(dbProductos.has(componente.codigo)){
		dbFields = dbProductos.get(componente.codigo);
		 
	} else {
		dbFields = {
			cantidad: 0,
			cantidadReservada: 0
		}
	}
	output = _.merge(componente,dbFields);
	cache.put(output.codigo,output);
	return output;
}

function loadComponentes2(){
	var workbook = XLSX.readFileSync('./data/productos.xlsx');
	exports.workbook = workbook;
	var componentesRaw = XLSX.utils.sheet_to_json(workbook.Sheets.componentes,{header:headerProductos,range:1});
	var stockRaw = XLSX.utils.sheet_to_json(workbook.Sheets.stock,{header:headerStock,range:1});
	//var stockRaw = [];
	//console.log(componentesRaw);
	var componentesO = {};

	var result = [];

	componentesRaw.forEach(function(element,index){
	if(element.codigo !== '0' ){
		if(!componentesO[element.codigo]){
			componentesO[element.codigo] = element;
		} else {
			if(element.codigo){
		//	console.log('ori',componentesO[element.codigo]);
		//	console.log('dupl',element);
			}
		}
		/*if(element.proveedor === 'OMRON'){
			console.log(element);
		}*/
		//console.log(element);
	} else {
		//console.log(element);
	}
	});

	stockRaw.forEach(function(element,index){
	if(element.codigo !== '0' ){
		var m = _.merge(element,componentesO[element.codigo] );
		/*if(m.proveedor === 'PEVI' )
			console.log(componentesO[element.codigo]);*/
		componentesO[element.codigo] = m;
		result.push(m);
		
		//console.log(element.codigo);
		//console.log(componentesO[element.codigo]);
		//console.log(element);
	}
	});
	//console.log(componentesO);
	//console.log(componentesRaw);
	//var merged = mergeArrays(componentesRaw,stockRaw);
	//console.log(merged);
	//console.log(result);
	var componentes = result.filter(function(element,index){

		var result = false;
		if(element.proveedor){

			result = true;
		} else {
			//console.log('proveedor',element);
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
    });
    componentes.forEach(function(element,index){
    	cache.put(element.codigo,element);
    });
    exports.componentes = componentes;
    exports.cache = cache;
}
function loadComponentes(clearCache){

	var workbook = XLSX.readFileSync('./data/productos.xlsx');
	exports.workbook = workbook;
	var componentesRaw = XLSX.utils.sheet_to_json(workbook.Sheets.componentes,{header:headerProductos,range:1});
	
	var componentes = componentesRaw.filter(function(element,index){

		var result = false;
		if(element.proveedor){

			result = true;
		} else {
			//console.log('proveedor',element);
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
    });
    componentes.forEach(function(element,index){
    	element = loadComponente(element);
    	//cache.put(element.codigo,element);
    });
    exports.componentes = componentes;
    exports.cache = cache;
}
loadComponentes();
/**
 * List of Articles
 */
exports.list = function(req, res) {

	loadComponentes();
	//exports.componentesArray = componentesO;
	//exports.componentesArray = componentes;
	res.json(exports.componentes );
	
};

function getComponenteById(id,clearCache){
			return cache.get(id);
}
function getComponenteQtyById(id){
	var comp = dbProductos.get(id);
			return comp;
}
function getComponenteById(id,clearCache){
	if(clearCache){

	} else {
		return cache.get(id);
	}
	
	//return exports.componentes.find(function(a) {return a.codigo === id;});

}
exports.getComponenteById = getComponenteById;
/**
 * Article middleware
 */
exports.componenteByID = function(req, res, next, id) {
/*	Componente.findById(id).populate('user', 'displayName').exec(function(err, componente) {
		if (err) return next(err);
		if (!componente) return next(new Error('Error al cargar el componente' + id));
		req.componente = componente;
		next();
	});*/
//console.log(componentesArray);
//var index = componentesArray.find({nproducto:'T100.31.104'});
//var componente = componentesArray[index];

//console.log(componentes);
var componente = getComponenteById(id);

if(!componente){
	return res.status(404).send({
				message: 'Componente not found'
			});

			
		}
			

	/*return res.status(204).send({
			message: 'Componente not found'
		});*/

//return next();


//if (!componente) return next(new Error('Error al cargar el componente ' + id));
		req.componente = componente;
		next();
};
exports.verificarStock = function(id,qty,marcar,clearCache){
	//console.log('componente','verifcando stock');
	if(marcar === undefined){
		marcar = true;
	}
	//var qty = req.params.qty;
	//loadComponentes();
	//console.log('id',id);
	//var componente = cache.get(id);
	var componente = getComponenteQtyById(id);
	//console.log(id);
	//console.log('verificarStock',componente);
	//var componente = exports.componentes.find(function(a) {return a.codigo === id;});
	
	if(!componente){
		//console.log(id,'NO existe');
		return false;
	} else {
		
		//console.log(qty,componente.cantidad);
		if((parseInt(componente.cantidad)) < parseInt(qty)){
			//console.log(id,'NO stock',qty,componente.cantidad);
			return (parseInt(componente.cantidad) - componente.cantidadReservada) - parseInt(qty);
		} else {
			//console.log(id,'hay stock');

			return true;
		}
	}
	if(marcar){
			componente.cantidadReservada += qty;
			updateComponente(componente);
			//cache.put(id,componente);
		}

};
function updateComponente(componente){
	cache.put(componente.codigo,componente);
	var dbObj = {
		codigo: componente.codigo,
		cantidad: componente.cantidad,
		cantidadReservada: componente.cantidadReservada
	}
	dbProductos.put(componente.codigo,componente);
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
 * Show the current componente
 */
exports.stock = function(req, res) {
	console.log('componentes stock');
	var qty = parseInt(req.query.qty);
	//console.log(req.componente);
	//console.log(qty);
	var nowQty = parseInt(req.componente.cantidad);
	req.componente.cantidad = nowQty + qty;
	updateComponente(req.componente);
	res.json(req.componente);
};
/**
 * Show the current componente
 */
exports.read = function(req, res) {
	res.json(req.componente);
};

exports.takeComponente = function(id,qty) {
	loadComponentes();
	//console.log('id',id);
	var componente = cache.get(id);
	//var workbook = XLSX.readFileSync(fileProductos);
	//var worksheet = workbook.Sheets.stock;
	//var worksheet =  exports.workbook.Sheets.stock;
	if(!componente){
		//console.log(id,'NO existe');
		return false;
	} else {
		//console.log(qty,componente.cantidad);
		var newStock = parseInt(componente.cantidad) - parseInt(qty);
		componente.cantidad = newStock;
		updateComponente(componente);
		
		return true;
	}
}

function guardarCambios(){
	//XLSX.writeFile(exports.workbook, fileProductos);

}
exports.guardarCambios = guardarCambios;