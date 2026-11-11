const ventas = require("./datos");
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

// Formateador de moneda en pesos colombianos (COP)
function formatoCOP(valor) {
  return `$${Math.round(valor).toLocaleString("es-CO")}`;
}

// Función auxiliar para imprimir el resumen de cualquier subconjunto de ventas
function imprimirResumenEjecutivo(titulo, listaVentas) {
  const total = totalVendidoM(listaVentas);
  const unidades = unidadesVendidasM(listaVentas);
  const promedio = ticketPromedio(listaVentas);
  const mayor = ventaMayor(listaVentas);
  const validas = listaVentas.filter((v) => v.cantidad > 0).length;

  console.log(`\n------------------------------------------------------------`);
  console.log(`  ${titulo}`);
  console.log(`------------------------------------------------------------`);
  console.log(`  Registros procesados : ${listaVentas.length} (${validas} ventas efectivas)`);
  console.log(`  Total vendido        : ${formatoCOP(total)}`);
  console.log(`  Unidades vendidas    : ${unidades.toLocaleString("es-CO")} uds.`);
  console.log(`  Ticket promedio      : ${formatoCOP(promedio)}`);

  if (mayor) {
    console.log(
      `  Venta más grande     : ID #${mayor.id} | ${mayor.producto} (${mayor.cantidad} uds.) -> ${formatoCOP(valorVenta(mayor))} [${mayor.ciudad.trim()}]`
    );
  } else {
    console.log(`  Venta más grande     : Sin ventas registradas en este periodo`);
  }
}

console.log("============================================================");
console.log("          INFORME EJECUTIVO DE VENTAS — CAFÉ ORIGEN         ");
console.log("                        Motor v0.1                          ");
console.log("============================================================");

// SECCIÓN 1: Resumen General
imprimirResumenEjecutivo("1. RESUMEN GENERAL (HISTORIAL COMPLETO)", ventas);

// SECCIÓN 2: Ventas por Ciudad
console.log(`\n------------------------------------------------------------`);
console.log(`  2. TOTAL VENDIDO POR CIUDAD`);
console.log(`------------------------------------------------------------`);
const porCiudad = totalPorCiudad(ventas);
const tablaCiudades = Object.entries(porCiudad).map(([ciudad, total]) => ({
  Ciudad: ciudad,
  "Total Vendido (COP)": formatoCOP(total)
}));
console.table(tablaCiudades);

// SECCIÓN 3: Unidades por Producto
console.log(`\n------------------------------------------------------------`);
console.log(`  3. UNIDADES VENDIDAS POR PRODUCTO`);
console.log(`------------------------------------------------------------`);
const porProducto = unidadesPorProducto(ventas);
const tablaProductos = Object.entries(porProducto).map(([producto, unidades]) => ({
  Producto: producto,
  "Unidades Vendidas": unidades
}));
console.table(tablaProductos);

// SECCIÓN 4: Top 3 Productos por Valor Generado
console.log(`\n------------------------------------------------------------`);
console.log(`  4. TOP 3 PRODUCTOS POR VALOR GENERADO`);
console.log(`------------------------------------------------------------`);
const top3 = topProductosPorValor(ventas, 3).map((item, idx) => ({
  Puesto: `#${idx + 1}`,
  Producto: item.producto,
  "Ingresos Generados (COP)": formatoCOP(item.total)
}));
console.table(top3);

// SECCIÓN 5: Consultas Diarias (Día con ventas vs. Día sin ventas)
const fechaConVentas = "2026-09-01";
const ventasDiaActivo = ventasDelDia(ventas, fechaConVentas);
imprimirResumenEjecutivo(
  `5.1. RESUMEN DEL DÍA CON VENTAS (${fechaConVentas})`,
  ventasDiaActivo
);

const fechaSinVentas = "2026-09-10";
const ventasDiaVacio = ventasDelDia(ventas, fechaSinVentas);
imprimirResumenEjecutivo(
  `5.2. RESUMEN DEL DÍA SIN VENTAS (${fechaSinVentas})`,
  ventasDiaVacio
);

// SECCIÓN 6: Demostración de control de calidad (Casos reportados por Gerencia)
console.log(`\n------------------------------------------------------------`);
console.log(`  6. VERIFICACIÓN ANTI-ERRORES (AUDITORÍA v0.1)`);
console.log(`------------------------------------------------------------`);
const muestraConBogotaConEspacio = [
  ...ventas,
  { id: 99, fecha: "2026-09-07", cliente: "C09", producto: "Molino manual", ciudad: "Bogotá ", cantidad: 1, precio: 120000 }
];
const ciudadesAuditoria = Object.keys(totalPorCiudad(muestraConBogotaConEspacio));
console.log(`  Grupos de ciudades con "Bogotá " extra : [${ciudadesAuditoria.join(", ")}] (${ciudadesAuditoria.length} grupos únicos, sin duplicados)`);
console.log(`  Ticket promedio en día sin ventas      : ${formatoCOP(ticketPromedio(ventasDiaVacio))} (Tipo: ${typeof ticketPromedio(ventasDiaVacio)}, ¿Es NaN?: ${Number.isNaN(ticketPromedio(ventasDiaVacio))})`);
console.log("============================================================\n");