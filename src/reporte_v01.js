const {
  valorVenta,
  totalVendidoM,
  unidadesVendidasM,
  ventaMayor,
  ticketPromedio,
  totalPorCiudad,
  unidadesPorProducto,
  topProductosPorValor,
  ventasDelDia
} = require("./analitica");
const datosDia1 = require("./datos");
const { generarVentas } = require("./generador");

function seleccionarVentasV01() {
  const argumentos = process.argv.slice(2);
  if (argumentos.length > 1) {
    throw new Error("Usa: node src/reporte_v01.js [cantidad-de-ventas]");
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

function formatoCOP(valor) {
  return `$${Math.round(valor).toLocaleString("es-CO")}`;
}

function imprimirResumenEjecutivo(titulo, ventas) {
  const total = totalVendidoM(ventas);
  const unidades = unidadesVendidasM(ventas);
  const promedio = ticketPromedio(ventas);
  const mayor = ventaMayor(ventas);
  const validas = ventas.filter((venta) => venta.cantidad > 0).length;

  console.log(`\n${titulo}`);
  console.log(`  Registros procesados : ${ventas.length} (${validas} ventas efectivas)`);
  console.log(`  Total vendido        : ${formatoCOP(total)}`);
  console.log(`  Unidades vendidas    : ${unidades.toLocaleString("es-CO")} uds.`);
  console.log(`  Ticket promedio      : ${formatoCOP(promedio)}`);
  if (mayor) {
    console.log(
      `  Venta más grande     : ID #${mayor.id} | ${mayor.producto} (${mayor.cantidad} uds.) -> ${formatoCOP(valorVenta(mayor))} [${mayor.ciudad.trim()}]`
    );
  } else {
    console.log("  Venta más grande     : Sin ventas registradas en este periodo");
  }
}

function ejecutarReporteV01(ventas) {
  console.log("============================================================");
  console.log("          INFORME EJECUTIVO DE VENTAS — CAFÉ ORIGEN         ");
  console.log("                        Motor v0.1                          ");
  console.log("============================================================");

  imprimirResumenEjecutivo("1. RESUMEN GENERAL (HISTORIAL COMPLETO)", ventas);

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
  imprimirResumenEjecutivo(
    `5.1. RESUMEN DEL DÍA CON VENTAS (${fechaConVentas})`,
    ventasDelDia(ventas, fechaConVentas)
  );
  imprimirResumenEjecutivo(
    "5.2. RESUMEN DEL DÍA SIN VENTAS (2026-10-10)",
    ventasDelDia(ventas, "2026-10-10")
  );

  console.log("\n6. AUDITORÍA DE CALIDAD");
  const muestra = [
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
    `  Ciudades únicas tras normalizar "Bogotá ": ${Object.keys(totalPorCiudad(muestra)).length}`
  );
  console.log(
    `  Ticket promedio del día sin ventas: ${formatoCOP(ticketPromedio([]))}`
  );
}

if (require.main === module) {
  ejecutarReporteV01(seleccionarVentasV01());
}

module.exports = { ejecutarReporteV01 };
