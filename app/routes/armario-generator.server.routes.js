'use strict';
var uuid = require('uuid'); // https://github.com/defunctzombie/node-uuid
var multiparty = require('multiparty'); // https://github.com/andrewrk/node-multiparty

var componentes = require('../../app/controllers/componentes.server.controller');
var database = require('../../app/controllers/database.server.controller');
var XLSX = require('xlsx');
var _ = require('lodash');
var json2xls = require('json2xls');
var cache = require('memory-cache');

module.exports = function(app) {

  app.use(json2xls.middleware);
  app.get('/generar-armario/:nombreArchivo',function(req,res) {
   var options = {
            fields:{
              'Codigo Material':'string',
              'Denominación':'string',
              'Precio Unitario': 'number',
              'Cantidad':'number',
              'Precio total': 'number',
              'Proveedor' : 'string'
            }
         };
       //  var componentesAll = componentes.componentesToJson();
          var componentesAll = database.loadComponentesFromFile();
         console.log('componentesAll',componentesAll);
         req.armario.forEach(function(element,index){
        //  console.log('element.codigo',element.codigo);
          //  var componente = componentes.getComponenteDbById(element.codigo);
            var  componenteIndex = _.findIndex(componentesAll, { 'codigo': element.codigo });
            //console.log(componente);
            var componente = componentesAll[componenteIndex];
            if(componente){
              element['Precio Unitario'] = (componente.precioUnit) ? componente.precioUnit : null;
              element['Proveedor'] = (componente.proveedor) ? componente.proveedor : null;
            }
         });
       /*  options = {
          fields:['Codigo Material','Denominación','Precio Unitario']
         }
         options = {
          fields:['codigo','denominacion','cantidad']
         }*/
         console.log('mandando xlsx');
       //  armario = cache.get(req.armario.nombreArchivo);
      // console.log(req.armario);
         res.xls(req.nombreArchivo + '.xlsx',req.armario,options);
    });
  app.param('nombreArchivo', function(req, res, next, nombre){
       console.log('nombre',nombre);
      var armario = cache.get('generator-' + nombre);
      if (! armario) return next(new Error('Failed to download armario ' + nombre));
      req.armario = armario ;
      req.nombreArchivo = nombre ;
      next();
  });

  app.post('/generar-armario',function(req,res) {
    var armario = cache.put('generator-' + req.body.nombreArchivo,req.body.componentes);
      //console.log('req',req);
     // res.send(200);
      req.armario = armario;
      req.nombreArchivo = req.body.nombreArchivo;
      res.redirect('/generar-armario/' + req.body.nombreArchivo);

         // res.xls('export-componentes_' + fecha + '.xlsx',componentesJSON,options);
  });
 
};