const { valorVenta } = require("./analitica");

function mejorSemana(ventas) {
  const ingresosPorDia = new Map();

  for (const venta of ventas) {
    if (venta.cantidad <= 0) continue;

    const fecha = venta.fecha.trim();
    ingresosPorDia.set(
      fecha,
      (ingresosPorDia.get(fecha) || 0) + valorVenta(venta)
    );
  }

  const dias = [...ingresosPorDia.keys()].sort();
  let inicio = 0;
  let totalVentana = 0;
  let mejor = null;

  for (let fin = 0; fin < dias.length; fin += 1) {
    totalVentana += ingresosPorDia.get(dias[fin]);
    const fechaFin = new Date(`${dias[fin]}T00:00:00Z`);

    while (inicio <= fin) {
      const fechaInicio = new Date(`${dias[inicio]}T00:00:00Z`);
      const diasEntreFechas = (fechaFin - fechaInicio) / 86400000;
      if (diasEntreFechas < 7) break;
      totalVentana -= ingresosPorDia.get(dias[inicio]);
      inicio += 1;
    }

    const rango = {
      inicio: dias[inicio],
      fin: dias[fin],
      total: totalVentana
    };
    if (!mejor || rango.total > mejor.total) mejor = rango;
  }

  return mejor;
}

module.exports = { mejorSemana };
