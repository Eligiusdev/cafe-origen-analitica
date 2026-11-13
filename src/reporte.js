const datosDia1 = require("./datos");
const { generarVentas } = require("./generador");
const {
  valorVenta,
  totalVendido,
  unidadesVendidas,
  ventaMayor,
  ticketPromedio,
  totalPorCiudad,
  unidadesPorProducto,
  topProductosPorValor,
  ventasDelDia,
  clientesRecurrentes
} = require("./analitica");
const {
  productoEstrellaPorCiudad,
  comboRegaloSugerido,
  clienteParaCupon
} = require("./comercial");
const { mejorSemana } = require("./temporal");

function formatoCOP(valor) {
  return `$${Math.round(valor).toLocaleString("es-CO")}`;
}

function seleccionarVentas(argumentos = process.argv.slice(2)) {
  if (argumentos.length > 1) {
    throw new Error("Usa: node src/reporte.js [cantidad-de-ventas]");
  }
  if (argumentos.length === 0) return datosDia1;

  const [argumento] = argumentos;
  if (!/^\d+$/.test(argumento)) {
    throw new RangeError("La cantidad de ventas debe ser un entero no negativo.");
  }
  const cantidad = Number(argumento);
  if (!Number.isSafeInteger(cantidad)) {
    throw new RangeError("La cantidad de ventas excede el límite seguro.");
  }
  return generarVentas(cantidad);
}

function imprimirResumenEjecutivo(titulo, ventas) {
  const validas = ventas.reduce(
    (total, venta) => total + (venta.cantidad > 0 ? 1 : 0),
    0
  );
  const total = totalVendido(ventas);
  const unidades = unidadesVendidas(ventas);
  const promedio = ticketPromedio(ventas);
  const mayor = ventaMayor(ventas);

  console.log(`\n${titulo}`);
  console.log(`  Registros procesados : ${ventas.length} (${validas} ventas efectivas)`);
  console.log(`  Total vendido        : ${formatoCOP(total)}`);
  console.log(`  Unidades vendidas    : ${unidades.toLocaleString("es-CO")} uds.`);
  console.log(`  Ticket promedio      : ${formatoCOP(promedio)}`);
  console.log(
    `  Venta más grande     : ${
      mayor
        ? `ID #${mayor.id} | ${mayor.producto} (${mayor.cantidad} uds.) -> ${formatoCOP(valorVenta(mayor))} [${mayor.ciudad.trim()}]`
        : "Sin ventas registradas"
    }`
  );
}

function ejecutarReporte(ventas) {
  console.log("============================================================");
  console.log("          INFORME EJECUTIVO DE VENTAS — CAFÉ ORIGEN         ");
  console.log("                        Motor v1.0                          ");
  console.log("============================================================");

  imprimirResumenEjecutivo("1. RESUMEN GENERAL", ventas);

  console.log("\n2. TOTAL VENDIDO POR CIUDAD");
  console.table(
    Object.entries(totalPorCiudad(ventas)).map(([ciudad, total]) => ({
      Ciudad: ciudad,
      "Total vendido (COP)": formatoCOP(total)
    }))
  );

  console.log("\n3. UNIDADES VENDIDAS POR PRODUCTO");
  console.table(
    Object.entries(unidadesPorProducto(ventas)).map(
      ([producto, unidades]) => ({ Producto: producto, Unidades: unidades })
    )
  );

  console.log("\n4. TOP 3 PRODUCTOS POR VALOR GENERADO");
  console.table(
    topProductosPorValor(ventas, 3).map((item, indice) => ({
      Puesto: `#${indice + 1}`,
      Producto: item.producto,
      "Ingresos generados (COP)": formatoCOP(item.total)
    }))
  );

  const fechaConVentas = ventas[0]?.fecha || "2026-09-01";
  const ventasDiaActivo = ventasDelDia(ventas, fechaConVentas);
  const ventasDiaVacio = ventasDelDia(ventas, "2026-10-10");
  imprimirResumenEjecutivo(
    `5. RESUMEN DEL DÍA CON VENTAS (${fechaConVentas})`,
    ventasDiaActivo
  );
  imprimirResumenEjecutivo(
    "6. RESUMEN DEL DÍA SIN VENTAS (2026-10-10)",
    ventasDiaVacio
  );

  console.log("\n7. AUDITORÍA DE CALIDAD");
  const muestraNormalizacion = [
    ...ventas,
    {
      id: "auditoría",
      fecha: "2026-09-07",
      cliente: "AUDIT",
      producto: "Molino manual",
      ciudad: "Bogotá ",
      cantidad: 1,
      precio: 120000
    }
  ];
  console.log(
    `  Ciudades únicas tras normalizar "Bogotá ": ${Object.keys(totalPorCiudad(muestraNormalizacion)).length}`
  );
  console.log(
    `  Ticket promedio del día sin ventas: ${formatoCOP(ticketPromedio(ventasDiaVacio))}`
  );

  console.log("\n8. CLIENTES RECURRENTES");
  const recurrentes = clientesRecurrentes(ventas);
  console.log(`  Clientes con más de una compra efectiva: ${recurrentes.length}`);
  console.log(
    `  Muestra (máximo 10): ${recurrentes.slice(0, 10).join(", ") || "Ninguno"}`
  );

  console.log("\n9. PRODUCTO ESTRELLA POR CIUDAD");
  console.table(
    productoEstrellaPorCiudad(ventas).map((item) => ({
      Ciudad: item.ciudad,
      Producto: item.producto,
      "Ingresos generados (COP)": formatoCOP(item.total)
    }))
  );

  console.log("\n10. COMBO DE REGALO SUGERIDO");
  const combo = comboRegaloSugerido(ventas);
  if (combo) {
    console.log(
      `  ${combo.productos.join(" + ")} (historial compartido por ${combo.clientes} cliente(s))`
    );
    console.log("  Sugerencia basada en coocurrencia por cliente, no en pedidos identificados.");
  } else {
    console.log("  No hay historial de clientes con dos productos distintos.");
  }

  console.log("\n11. CLIENTE PARA CUPÓN");
  const candidato = clienteParaCupon(ventas);
  console.log(
    candidato
      ? `  ${candidato.cliente}: ${candidato.compras} compras efectivas, ${formatoCOP(candidato.total)} acumulados`
      : "  Sin compras efectivas para recomendar."
  );
  console.log("  Criterio: más compras; desempate por mayor gasto acumulado.");

  console.log("\n12. MEJOR SEMANA (VENTANA MÓVIL DE 7 DÍAS)");
  const semana = mejorSemana(ventas);
  console.log(
    semana
      ? `  ${semana.inicio} a ${semana.fin}: ${formatoCOP(semana.total)}`
      : "  Sin ventas efectivas para analizar."
  );
  console.log("  No se aplica filtro de presupuesto: el proyecto no define un límite.");
  console.log("============================================================");
}

if (require.main === module) {
  ejecutarReporte(seleccionarVentas());
}

module.exports = { ejecutarReporte, seleccionarVentas };
