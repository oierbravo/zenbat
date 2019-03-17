'use strict';

/**
 * Module dependencies.
 */
var path = require('path');
var zenbatConfig = require(__dirname +'../../zenbat.config.js');


var walk    = require('walk');
var fs      = require('fs');
var XLSX = require('xlsx');
var moment = require('moment');
var Componentes = require(__dirname + '/componentes.server.controller.js');
var json2xls = require('json2xls');
var _ = require('lodash');

var cache = require('memory-cache');

function getArmarioold(id){
	var filepath = path.normalize(zenbatConfig.basePath + zenbatConfig.armarios.folder + '\\' + id + '.xlsx');
    if (fs.existsSync(filepath)) {
  //  console.log('Found file',filepath);
    var workbook = XLSX.readFileSync(filepath);

 	var componentesRaw = XLSX.utils.sheet_to_json(workbook.Sheets.componentes,{header:zenbatConfig.armarios.header,range:3});
    var componentes = componentesRaw.filter(function(element,index){
  		return (element.Cantidad)?true: false;
  	});
  	componentes.forEach(function(element,index){
  		
  	element.faltaID = !Componentes.verificarId(element.Codigo);
  	
    });
 console.log('arm-comps',componentes);
    return {
  		id: id,
  		componentes:componentes
    };
	} else {
		return false;
	}
}


/**
 * Show the current Armario
 */
exports.read = function(req, res) {
  req.armario = req.app.locals.database.getArmario(req.armario.id);
  //req.armario = getArmario();
  res.json(req.armario);
};




/**
 * List of Armarios
 */
exports.list = function(req, res) {
   	var result = [];
	var walker  = walk.walk(zenbatConfig.basePath + zenbatConfig.armarios.folder, { followLinks: false });
	walker.on('file', function(root, fileStat, next){

		var filename = fileStat.name;
		
			
		if(filename.charAt(0) !== '~'){
			if (fs.existsSync(path.normalize(zenbatConfig.basePath + zenbatConfig.armarios.folder + "\\" + fileStat.name))) {
				console.log(fileStat);
				var armarioWorkbook = XLSX.readFileSync(zenbatConfig.basePath + zenbatConfig.armarios.folder + "\\" + fileStat.name);
		 		var componentesRaw = XLSX.utils.sheet_to_json(armarioWorkbook.Sheets.componentes,{header:zenbatConfig.armarios.header,range:3});
		   		var componentes = componentesRaw.filter(function(element,index){
		  			return (element.Cantidad)?true: false;
		  		});
				var armario = {
					id: fileStat.name.replace('.xlsx',''),
					filename: fileStat.name,
					componente:componentes
				};
		   	   result.push(armario);
		   	}
	   	}
   	next();
    });

    walker.on('end', function(){
		exports.armarios = result;
        res.jsonp(exports.armarios);
	});
		
	
};

exports.armarioByID = function(req, res, next, id) {
	req.armario = {
			id:id
		
		};
		next();
};
function getComponentesArmario(armarioId){
	var componentes = [];
	var armario = getArmario(armarioId);
	if(armario){
		componentes = armario.componentes;
	} else {
		componentes = false;
	}
	return componentes;
}
exports.getComponentes =getComponentesArmario;
function verificarStock(armarioId,qtyArmarios,pedidoId){
//	console.log('verificarStock-qtyArmarios',qtyArmarios);
	var armario = getArmario(armarioId);
	var result = [];
		var status = 'OK';
	if(armario){
		var foundFalse = false;
		armario.componentes.forEach(function(element,index){
			if(element.Codigo){
				element.Cantidad = parseFloat(element.Cantidad).toFixed(2);
				var gotComponente = Componentes.verificarStock(element.Codigo,element.Cantidad * qtyArmarios,pedidoId);
//				console.log('gotComponente',gotComponente);
				element.stockSinReservas = Componentes.getComponenteQtyById(element.Codigo);
				element.cantidadReservada = Componentes.getComponenteReservasById(element.Codigo);
				element.cantidadReservadaSinPedido =element.cantidadReservada - element.Cantidad * qtyArmarios;
				if(gotComponente){
					if(gotComponente === true){
						//status = 'ok';
					} else {
						if(!foundFalse){
							status = 'FALTAN COMPONENTES';
						}
					}
				} else if(gotComponente === false) {
					status = 'FALTAN IDS';
					foundFalse = true;
				}
				if(gotComponente === false){
					result.push({
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
					result.push({
						codigo:element.Codigo,
						denominacion:element.Denominacion,
						necesarios: parseFloat(element.Cantidad).toFixed(2),
						stockSinReservas: element.stockSinReservas,
						cantidadReservada: element.cantidadReservada,
						cantidadReservadaSinPedido: element.cantidadReservada,
						disponible: disponible,
						stock: gotComponente
					});
				}
			}
		});
	} else {
		status = 'ERR: ID de armario';
		result = [];
	}
	return {
		status: status,
		componentes:result
	};

}
exports.verificarStock = verificarStock;
exports.verificar = function(req, res){
	var clearCache = true;
	var output = verificarStock(req.armario.id,req.query.qty);
	res.jsonp(output);
};

function entregar(idArmario,qtyArmarios,pedidoId){
	var armario = getArmario(idArmario);
	var result = [];
	var status = 'OK';
	console.log('entregando armario');
	armario.componentes.forEach(function(element,index){
		if(element.Codigo){
			var takeComponente = Componentes.takeComponente(element.Codigo,element.Cantidad * qtyArmarios,pedidoId);
			if(takeComponente === true){
		
			} else {
				status = 'fail';
			}
		}
	});
	if(status === 'OK'){
		return 'OK';
	} else {
		return 'FAIL';
	}
}

exports.entregar = entregar;
exports.getComponentesList = function(armarioId){
	var armario = getArmario(armarioId);
	return armario.componentes;

}

exports.exportar = function(req,res){
    var armarioId = req.armario.id;
    var armario = req.app.locals.database.getArmario(armarioId);
    //console.log('exportar-armarioId',armarioId);
    var options = {
   		fields:{
   			'Codigo Material': 'string',
	   		'Denominación':'string',
	   		'Precio Unitario':'number',
	   		'Cantidad': 'number',
	   		'Precio Total':'string'
	   		
	   	}
    };
    var armarioExport = {
   	componentes:[]
    };
    armario.componentes.forEach(function(element,index){
   	var compDb = Componentes.getComponenteById(element.Codigo);
   		   var componenteExport = {
   		'Codigo Material': element.Codigo,
	   		'Denominación':element.Denominacion,
	   		'Precio Unitario':(compDb.precioUnit)?parseFloat(compDb.precioUnit).toFixed(2):-1,
	   		'Cantidad':parseFloat(element.Cantidad).toFixed(2),
	   		'Precio Total':' '
  		}
 	  armarioExport.componentes.push(componenteExport);
    });
//    console.log('exportar-armario',armarioExport);
	res.xls(armarioId + '.xlsx',armarioExport.componentes,options);
}