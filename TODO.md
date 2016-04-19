* new pedido status: "Componentes en camino"
	* stock por llegar e ir descontando.
* [p.prov] override keypress enter = tab or next line
* [p.prov] Cantidad recomendada a pedir :cantidad en armarios + StockSeguridad – Cant. Actual y el resultado es la cantidad recomendada a pedir
- [HOME] leyenda
- [recarga] mostrar errores
	* pedido: armario no generado

- [Tables] Tooltips.

- [stock] Añadir a pedido
  - View: stock
  	- Añadir columna con boton de añadir a pedido.
  	- Popup para elejir pedido y textinput para qty y unidad
  		- Tabla de p.proveedores tal cual.

- Logger:
	* Para cambiar el historial borrar y darle a recargar.
	* Marcar entrada y salida en logs largos
	* Componentes: modif stock,
	* Pedidos: entregado
	- P.Prov: add,update,delete,recibido,
	* Loggear todas las acciones, automaticas tambien. Ej: al entregar un pedido figurara la entrega y todos los componentes descontados. 

* P.Prov Sortable componentes. Poder decidir el orden final de los componentes.

# TO PRODUCTION
x bck files,dbs,xls
x git fetch
x Startup script.
	-on pc boot
	-workaround for data recover.

##SERVICE
- BAT2EXE 
- NSSM to create service


## Desplegable usuarios.
- User DropdownList
    - Desplegable con los usuarios siempre visible.
    	- Guardar los historiales con el usuario.

