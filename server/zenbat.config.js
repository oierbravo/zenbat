'use strict';

var path = require('path');
var zenbatXlsx = require(path.join(__dirname, '..', 'lib', 'zenbat-xlsx.cjs'));
var basePath = process.env.ZENBAT_DATA_PATH || path.join(__dirname, 'data');
if (!basePath.endsWith(path.sep)) basePath += path.sep;

module.exports = {
	basePath: basePath,
	componentes: {
		file: 'productos.xlsx',
		dbFile:'db/productos.db',
		header: ['codigo','denominacion','stockSeguridad','proveedor','codProveedor','pedidoMinimo','yearPrecio','precioUnit','notas','proveedor2','codProveedor2','pedidoMinimo2','yearPrecio2','precioUnit2','notas2','proveedor3','codProveedor3','pedidoMinimo3','yearPrecio3','precioUnit3','notas3']

	}
	,stock: {
		header: ['codigo','denominacion','cantidad','cantidadReservada']
	}
	,armarios: {
		folder: 'armarios',
		header: zenbatXlsx.ARMARIO_HEADER
	}
	,pedidos: {
		file:'pedidos.xlsx',
		dbFile:'db/pedidos.db',
		dbFileComponentes:'db/pedidosComponente.db',
		header:['fecha','codigo','rev','cantidad','PC','PT','Grua','Notas','vacio','cables','perfiles','canaleta','material','cableados','entregados']
	},
	proveedores: {
		file: 'proveedores.xlsx',
		header:['Nombre','Direccion','CP','Poblacion','Tlf','Fax','Email','Notas']
	},
	pedidosProveedores: {
		dbFile: 'db/pedidosProveedores.db',
		dbFileComponentes: 'db/pedidosProveedoresComponentes.db'
	},
	config: {
		dbFile: 'db/config.db'
	}
	
}; 
//folder: 'C:/Ezarri/Zenbat/armarios'