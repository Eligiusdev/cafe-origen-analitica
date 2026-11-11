const { generarVentas } = require("./generador");
const {
  totalVendidoInstrumentado,
  ventaMayorInstrumentada,
  totalPorCiudadInstrumentado,
  primeraVenta
} = require("./analitica");

const tamanos = [100, 1000, 10000, 100000];
const resultados = [];

for (const n of tamanos) {
  const ventas = generarVentas(n);
  const totalVendidoContador = { operaciones: 0 };
  const ventaMayorContador = { operaciones: 0 };
  const totalPorCiudadContador = { operaciones: 0 };
  const primeraVentaContador = { operaciones: 0 };

  totalVendidoInstrumentado(ventas, totalVendidoContador);
  ventaMayorInstrumentada(ventas, ventaMayorContador);
  totalPorCiudadInstrumentado(ventas, totalPorCiudadContador);
  primeraVenta(ventas, primeraVentaContador);

  resultados.push({
    n,
    totalVendido: totalVendidoContador.operaciones,
    ventaMayor: ventaMayorContador.operaciones,
    totalPorCiudad: totalPorCiudadContador.operaciones,
    primeraVenta: primeraVentaContador.operaciones
  });
}

console.table(resultados);
