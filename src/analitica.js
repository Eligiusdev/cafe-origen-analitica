/**
 * 1. Calcula el subtotal de una venta individual.
 */
function valorVenta(venta) {
  if (!venta) return 0;
  return venta.cantidad * venta.precio;
}

/**
 * 2. Suma el dinero total recaudado en todas las ventas válidas.
 */
function totalVendido(ventas) {
  let total = 0;

  for (const venta of ventas) {
    if (venta.cantidad > 0) {
      total += valorVenta(venta);
    }
  }

  return total;
}

/**
 * 3. Suma el total de unidades físicas vendidas.
 */
function unidadesVendidas(ventas) {
  let totalUnidades = 0;

  for (const venta of ventas) {
    if (venta.cantidad > 0) {
      totalUnidades += venta.cantidad;
    }
  }

  return totalUnidades;
}

/**
 * 4. Encuentra y devuelve el objeto completo de la venta con mayor ingreso (cantidad * precio).
 * Si el arreglo está vacío o no hay ventas con cantidad > 0, devuelve null.
 */
function ventaMayor(ventas) {
  let mayorRegistro = null;
  let montoMaximo = -1;

  for (const venta of ventas) {
    if (venta.cantidad > 0) {
      const montoActual = valorVenta(venta);
      if (montoActual > montoMaximo) {
        montoMaximo = montoActual;
        mayorRegistro = venta;
      }
    }
  }

  return mayorRegistro;
}