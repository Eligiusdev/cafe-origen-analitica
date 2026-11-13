const { PRODUCTOS } = require("./generador");
const { valorVenta, normalizarNombreCiudad } = require("./analitica");

function productoEstrellaPorCiudad(ventas) {
  const totales = new Map();

  for (const venta of ventas) {
    if (venta.cantidad <= 0) continue;

    const ciudad = normalizarNombreCiudad(venta.ciudad);
    const producto = venta.producto.trim();
    let productos = totales.get(ciudad);
    if (!productos) {
      productos = new Map();
      totales.set(ciudad, productos);
    }
    productos.set(
      producto,
      (productos.get(producto) || 0) + valorVenta(venta)
    );
  }

  const resultado = [];
  for (const [ciudad, productos] of totales) {
    let estrella = null;
    let totalMaximo = -1;
    for (const [producto, total] of productos) {
      if (total > totalMaximo) {
        estrella = producto;
        totalMaximo = total;
      }
    }
    resultado.push({ ciudad, producto: estrella, total: totalMaximo });
  }

  return resultado;
}

function comboRegaloSugerido(ventas) {
  const indiceProducto = new Map(
    PRODUCTOS.map((producto, indice) => [producto, indice])
  );
  const productosPorCliente = new Map();

  for (const venta of ventas) {
    if (venta.cantidad <= 0) continue;

    const indice = indiceProducto.get(venta.producto.trim());
    if (indice === undefined) {
      throw new RangeError(
        `Producto fuera del catálogo del generador: ${venta.producto}`
      );
    }

    let productos = productosPorCliente.get(venta.cliente);
    if (!productos) {
      productos = new Set();
      productosPorCliente.set(venta.cliente, productos);
    }
    productos.add(indice);
  }

  const frecuenciaPorCombo = new Map();
  for (const productos of productosPorCliente.values()) {
    for (let i = 0; i < PRODUCTOS.length; i += 1) {
      if (!productos.has(i)) continue;
      for (let j = i + 1; j < PRODUCTOS.length; j += 1) {
        if (!productos.has(j)) continue;

        const clave = `${i}:${j}`;
        frecuenciaPorCombo.set(
          clave,
          (frecuenciaPorCombo.get(clave) || 0) + 1
        );
      }
    }
  }

  let mejorCombo = null;
  for (const [clave, clientes] of frecuenciaPorCombo) {
    if (!mejorCombo || clientes > mejorCombo.clientes) {
      const [i, j] = clave.split(":").map(Number);
      mejorCombo = { productos: [PRODUCTOS[i], PRODUCTOS[j]], clientes };
    }
  }

  return mejorCombo;
}

function clienteParaCupon(ventas) {
  const resumenPorCliente = new Map();

  for (const venta of ventas) {
    if (venta.cantidad <= 0) continue;

    let resumen = resumenPorCliente.get(venta.cliente);
    if (!resumen) {
      resumen = { compras: 0, total: 0 };
      resumenPorCliente.set(venta.cliente, resumen);
    }
    resumen.compras += 1;
    resumen.total += valorVenta(venta);
  }

  let clienteElegido = null;
  let resumenElegido = null;
  for (const [cliente, resumen] of resumenPorCliente) {
    if (
      !resumenElegido ||
      resumen.compras > resumenElegido.compras ||
      (resumen.compras === resumenElegido.compras &&
        resumen.total > resumenElegido.total)
    ) {
      clienteElegido = cliente;
      resumenElegido = resumen;
    }
  }

  return clienteElegido
    ? { cliente: clienteElegido, ...resumenElegido }
    : null;
}

module.exports = {
  productoEstrellaPorCiudad,
  comboRegaloSugerido,
  clienteParaCupon
};
