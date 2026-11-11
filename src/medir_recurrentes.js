const { performance } = require("node:perf_hooks");
const { generarVentas } = require("./generador");
const { clientesRecurrentes } = require("./analitica");

const tamanos = [1000, 2000, 4000, 8000, 16000];
const resultados = [];

clientesRecurrentes(generarVentas(1000));

function medir(n) {
  const ventas = generarVentas(n);
  const etiqueta = `clientesRecurrentes n=${n}`;

  console.time(etiqueta);
  const inicio = performance.now();
  clientesRecurrentes(ventas);
  const tiempoMs = performance.now() - inicio;
  console.timeEnd(etiqueta);

  return { n, tiempoMs: Number(tiempoMs.toFixed(2)) };
}

for (const n of tamanos) {
  resultados.push(medir(n));
}

const ultimaMedicion = resultados[resultados.length - 1];
const estimacion100000 =
  ultimaMedicion.tiempoMs * (100000 / ultimaMedicion.n) ** 2;

console.log(`Estimación para 100.000 ventas: ${(estimacion100000 / 1000).toFixed(2)} s`);
if (estimacion100000 < 120000) {
  resultados.push(medir(100000));
} else {
  console.log("Se omite n=100.000: la estimación alcanza o supera dos minutos.");
}

const anclaMillon = resultados[resultados.length - 1];
const estimacion1000000 =
  anclaMillon.tiempoMs * (1000000 / anclaMillon.n) ** 2;

console.table(resultados);
console.log(
  `Estimación para 1.000.000 de ventas: ${(estimacion1000000 / 60000).toFixed(2)} min`
);
