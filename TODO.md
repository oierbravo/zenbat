#TODO FIXES
- leyenda
* excel cosas pendientes a pedir.  PROVEEDOR - PRODUCTO - CANTIDAD - NOTAS
* verificar entregas parciales (p.prov);
* View componentes detail: Falta codigo comp.


#TODO NU
- new pedido status: "Componentes en camino"
	- stock por llegar e ir descontando.
- Logger:
	* Para cambiar el historial borrar y darle a recargar.
	* Marcar entrada y salida en logs largos
	* Componentes: modif stock,
	* Pedidos: entregado
	- P.Prov: add,update,delete,recibido,
	* Loggear todas las acciones, automaticas tambien. Ej: al entregar un pedido figurara la entrega y todos los componentes descontados. 
- User DropdownList
    - Desplegable con los usuarios siempre visible.
    	- Guardar los historiales con el usuario.
- P.Prov Sortable componentes. Poder decidir el orden final de los componentes.

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


