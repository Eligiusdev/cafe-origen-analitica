const { spawnSync } = require("node:child_process");
const { performance } = require("node:perf_hooks");
const { resolve } = require("node:path");

const reportes = [
  { version: "v0.1", archivo: resolve(__dirname, "reporte_v01.js") },
  { version: "v1.0", archivo: resolve(__dirname, "reporte.js") }
];
const tamanos = [10000, 100000];
const repeticiones = 3;

function medir(reporte, n) {
  const inicio = performance.now();
  const proceso = spawnSync(process.execPath, [reporte.archivo, String(n)], {
    stdio: "ignore",
    timeout: 30000
  });
  const tiempoMs = performance.now() - inicio;

  if (proceso.error) throw proceso.error;
  if (proceso.status !== 0) {
    throw new Error(
      `${reporte.version} falló con n=${n} (código ${proceso.status})`
    );
  }
  return tiempoMs;
}

const resultados = [];
for (const n of tamanos) {
  for (const reporte of reportes) {
    medir(reporte, n);
    const muestras = Array.from({ length: repeticiones }, () =>
      medir(reporte, n)
    ).sort((a, b) => a - b);
    resultados.push({
      tamaño: n,
      versión: reporte.version,
      mediana_ms: Number(muestras[Math.floor(muestras.length / 2)].toFixed(2)),
      muestras_ms: muestras.map((tiempo) => Number(tiempo.toFixed(2))).join(", ")
    });
  }
}

console.log("Comparación del reporte completo (mediana de 3; incluye proceso y generación)");
console.table(resultados);
