const { performance } = require("node:perf_hooks");
const { generarVentas } = require("./generador");
const { clientesRecurrentes } = require("./analitica");

function clientesRecurrentesV01(ventas) {
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

function medir(funcion, ventas) {
  const inicio = performance.now();
  funcion(ventas);
  return Number((performance.now() - inicio).toFixed(2));
}

const resultados = [];
for (const n of [10000, 100000]) {
  const ventas = generarVentas(n);
  clientesRecurrentes(ventas);
  resultados.push({
    ventas: n,
    version: "v0.1 (doble ciclo)",
    tiempo_ms: medir(clientesRecurrentesV01, ventas)
  });
  resultados.push({
    ventas: n,
    version: "v1.0 (Map)",
    tiempo_ms: medir(clientesRecurrentes, ventas)
  });
}

console.table(resultados);
