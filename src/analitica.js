/**
 * ==========================================
 * PARTE 1: FUNCIONES CON CICLOS MANUALES
 * ==========================================
 */

function valorVenta(venta) {
  if (!venta) return 0;
  return venta.cantidad * venta.precio;
}

function totalVendido(ventas) {
  let total = 0;
  for (const venta of ventas) {
    if (venta.cantidad > 0) {
      total += valorVenta(venta);
    }
  }
  return total;
}

function unidadesVendidas(ventas) {
  let totalUnidades = 0;
  for (const venta of ventas) {
    if (venta.cantidad > 0) {
      totalUnidades += venta.cantidad;
    }
  }
  return totalUnidades;
}

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

function ticketPromedio(ventas) {
  let sumaTotal = 0;
  let contadorValidas = 0;

  for (const venta of ventas) {
    if (venta.cantidad > 0) {
      sumaTotal += valorVenta(venta);
      contadorValidas += 1;
    }
  }

  if (contadorValidas === 0) return 0;
  return sumaTotal / contadorValidas;
}

function ventasPorCiudad(ventas, ciudad) {
  if (!ciudad) return 0;
  const ciudadBuscada = ciudad.trim().toLowerCase();
  let totalCiudad = 0;

  for (const venta of ventas) {
    const ciudadRegistro = venta.ciudad.trim().toLowerCase();
    if (venta.cantidad > 0 && ciudadRegistro === ciudadBuscada) {
      totalCiudad += valorVenta(venta);
    }
  }
  return totalCiudad;
}

/**
 * ==========================================
 * PARTE 2: VERSIONES CON MÉTODOS DE ARREGLO
 * ==========================================
 */

// Auxiliar para normalizar texto a Title Case ("  medellín " -> "Medellín")
function normalizarNombreCiudad(ciudad) {
  const limpia = ciudad.trim().toLowerCase();
  if (!limpia) return "";
  return limpia.charAt(0).toUpperCase() + limpia.slice(1);
}

/**
 * 1. Equivalente a totalVendido usando filter, map y reduce.
 */
function totalVendidoM(ventas) {
  return ventas
    .filter((v) => v.cantidad > 0)
    .map((v) => valorVenta(v))
    .reduce((acum, subtotal) => acum + subtotal, 0);
}

/**
 * 2. Equivalente a unidadesVendidas usando filter, map y reduce.
 */
function unidadesVendidasM(ventas) {
  return ventas
    .filter((v) => v.cantidad > 0)
    .map((v) => v.cantidad)
    .reduce((acum, cant) => acum + cant, 0);
}

/**
 * 3. Equivalente a ventasPorCiudad usando filter, map y reduce.
 */
function ventasPorCiudadM(ventas, ciudad) {
  if (!ciudad) return 0;
  const ciudadBuscada = ciudad.trim().toLowerCase();

  return ventas
    .filter(
      (v) => v.cantidad > 0 && v.ciudad.trim().toLowerCase() === ciudadBuscada
    )
    .map((v) => valorVenta(v))
    .reduce((acum, subtotal) => acum + subtotal, 0);
}

/**
 * 4. Agrupa por ciudad normalizada y devuelve un diccionario { Ciudad: totalVendido }.
 * Consolida "Medellín", "medellín" y "Bogotá " en exactamente 4 ciudades.
 */
function totalPorCiudad(ventas) {
  return ventas
    .filter((v) => v.cantidad > 0)
    .reduce((diccionario, venta) => {
      const claveCiudad = normalizarNombreCiudad(venta.ciudad);
      diccionario[claveCiudad] = (diccionario[claveCiudad] || 0) + valorVenta(venta);
      return diccionario;
    }, {});
}

/**
 * 5. Agrupa por producto y suma las unidades físicas vendidas { Producto: totalUnidades }.
 */
function unidadesPorProducto(ventas) {
  return ventas
    .filter((v) => v.cantidad > 0)
    .reduce((diccionario, venta) => {
      const claveProducto = venta.producto.trim();
      diccionario[claveProducto] = (diccionario[claveProducto] || 0) + venta.cantidad;
      return diccionario;
    }, {});
}

/**
 * 6. Devuelve los k productos que más dinero generaron, ordenados de mayor a menor,
 * sin mutar el arreglo original.
 */
function topProductosPorValor(ventas, k = 3) {
  // 1. Agrupar ingresos por producto en un objeto diccionario
  const ingresosPorProducto = ventas
    .filter((v) => v.cantidad > 0)
    .reduce((diccionario, venta) => {
      const claveProducto = venta.producto.trim();
      diccionario[claveProducto] = (diccionario[claveProducto] || 0) + valorVenta(venta);
      return diccionario;
    }, {});

  // 2. Transformar entradas a objetos { producto, total }
  const listaProductos = Object.entries(ingresosPorProducto).map(
    ([producto, total]) => ({
      producto,
      total
    })
  );

  // 3. Copiar con spread (...), ordenar de mayor a menor y recortar con slice
  return [...listaProductos]
    .sort((a, b) => b.total - a.total)
    .slice(0, k);
}

module.exports = {
  valorVenta,
  totalVendido,
  unidadesVendidas,
  ventaMayor,
  ticketPromedio,
  ventasPorCiudad,
  totalVendidoM,
  unidadesVendidasM,
  ventasPorCiudadM,
  totalPorCiudad,
  unidadesPorProducto,
  topProductosPorValor
};