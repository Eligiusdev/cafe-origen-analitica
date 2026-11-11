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

function totalVendidoInstrumentado(ventas, contador) {
  let total = 0;
  for (const venta of ventas) {
    contador.operaciones += 1;
    contador.operaciones += 1;
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

function ventaMayorInstrumentada(ventas, contador) {
  let mayorRegistro = null;
  let montoMaximo = -1;

  for (const venta of ventas) {
    contador.operaciones += 1;
    contador.operaciones += 1;
    if (venta.cantidad > 0) {
      const montoActual = valorVenta(venta);
      contador.operaciones += 1;
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

function normalizarNombreCiudad(ciudad) {
  const limpia = ciudad.trim().toLowerCase();
  if (!limpia) return "";
  return limpia.charAt(0).toUpperCase() + limpia.slice(1);
}

function totalVendidoM(ventas) {
  return ventas
    .filter((v) => v.cantidad > 0)
    .map((v) => valorVenta(v))
    .reduce((acum, subtotal) => acum + subtotal, 0);
}

function unidadesVendidasM(ventas) {
  return ventas
    .filter((v) => v.cantidad > 0)
    .map((v) => v.cantidad)
    .reduce((acum, cant) => acum + cant, 0);
}

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

function totalPorCiudad(ventas) {
  return ventas
    .filter((v) => v.cantidad > 0)
    .reduce((diccionario, venta) => {
      const claveCiudad = normalizarNombreCiudad(venta.ciudad);
      diccionario[claveCiudad] = (diccionario[claveCiudad] || 0) + valorVenta(venta);
      return diccionario;
    }, {});
}

function totalPorCiudadInstrumentado(ventas, contador) {
  const totales = {};

  for (const venta of ventas) {
    contador.operaciones += 1;
    contador.operaciones += 1;
    if (venta.cantidad > 0) {
      const claveCiudad = normalizarNombreCiudad(venta.ciudad);
      const existeCiudad = Object.prototype.hasOwnProperty.call(totales, claveCiudad);
      contador.operaciones += 1;
      totales[claveCiudad] =
        (existeCiudad ? totales[claveCiudad] : 0) + valorVenta(venta);
    }
  }

  return totales;
}

function clientesRecurrentes(ventas) {
  const recurrentes = [];

  for (let i = 0; i < ventas.length; i += 1) {
    for (let j = i + 1; j < ventas.length; j += 1) {
      if (
        ventas[i].cliente === ventas[j].cliente &&
        !recurrentes.includes(ventas[i].cliente)
      ) {
        recurrentes.push(ventas[i].cliente);
      }
    }
  }

  return recurrentes;
}

function primeraVenta(ventas, contador) {
  contador.operaciones += 1;
  return ventas[0] || null;
}

function unidadesPorProducto(ventas) {
  return ventas
    .filter((v) => v.cantidad > 0)
    .reduce((diccionario, venta) => {
      const claveProducto = venta.producto.trim();
      diccionario[claveProducto] = (diccionario[claveProducto] || 0) + venta.cantidad;
      return diccionario;
    }, {});
}

function topProductosPorValor(ventas, k = 3) {
  const ingresosPorProducto = ventas
    .filter((v) => v.cantidad > 0)
    .reduce((diccionario, venta) => {
      const claveProducto = venta.producto.trim();
      diccionario[claveProducto] = (diccionario[claveProducto] || 0) + valorVenta(venta);
      return diccionario;
    }, {});

  const listaProductos = Object.entries(ingresosPorProducto).map(
    ([producto, total]) => ({
      producto,
      total
    })
  );

  return [...listaProductos]
    .sort((a, b) => b.total - a.total)
    .slice(0, k);
}

/**
 * 7. Filtra y devuelve las ventas válidas correspondientes a una fecha exacta (YYYY-MM-DD).
 */
function ventasDelDia(ventas, fecha) {
  if (!fecha) return [];
  const fechaBuscada = fecha.trim();
  return ventas.filter(
    (v) => v.cantidad > 0 && v.fecha.trim() === fechaBuscada
  );
}

module.exports = {
  valorVenta,
  totalVendido,
  totalVendidoInstrumentado,
  unidadesVendidas,
  ventaMayor,
  ventaMayorInstrumentada,
  ticketPromedio,
  ventasPorCiudad,
  totalVendidoM,
  unidadesVendidasM,
  ventasPorCiudadM,
  totalPorCiudad,
  totalPorCiudadInstrumentado,
  clientesRecurrentes,
  primeraVenta,
  unidadesPorProducto,
  topProductosPorValor,
  ventasDelDia
};