const assert = require("node:assert/strict");
const ventas = require("./datos");
const { generarVentas } = require("./generador");
const {
  totalVendido,
  totalVendidoM,
  unidadesVendidas,
  unidadesVendidasM,
  ventasPorCiudad,
  ventasPorCiudadM,
  totalCiudadCadena,
  totalCiudadUnaPasada,
  totalPorCiudad,
  unidadesPorProducto,
  topProductosPorValor,
  clientesRecurrentes
} = require("./analitica");

function compararPar(nombrePrueba, resultadoCiclo, resultadoMetodo) {
  const estado = resultadoCiclo === resultadoMetodo ? "OK" : "DIFERENTE";
  console.log(
    `[${estado}] ${nombrePrueba} -> Ciclo: ${resultadoCiclo} | Método: ${resultadoMetodo}`
  );
}

console.log("=== 1. VERIFICACIÓN DE PARES (CICLO VS MÉTODOS) ===");

assert.deepEqual(clientesRecurrentes(ventas), ["C01", "C02", "C03"]);
console.log("[OK] clientesRecurrentes (muestra Día 1) -> C01, C02, C03");

const ventasGeneradas = generarVentas(10000);
const totalCiudadGeneradoCadena = totalCiudadCadena(
  ventasGeneradas,
  "Medellín"
);
const totalCiudadGeneradoUnaPasada = totalCiudadUnaPasada(
  ventasGeneradas,
  "Medellín"
);
const totalCiudadGeneradoOriginal = ventasPorCiudad(
  ventasGeneradas,
  "Medellín"
);
assert.equal(totalCiudadGeneradoCadena, totalCiudadGeneradoUnaPasada);
assert.equal(totalCiudadGeneradoCadena, totalCiudadGeneradoOriginal);
console.log("[OK] totalCiudad versions match ventasPorCiudad (10.000 ventas)");

// Pruebas con muestra completa
compararPar("totalVendido (muestra completa)", totalVendido(ventas), totalVendidoM(ventas));
compararPar("unidadesVendidas (muestra completa)", unidadesVendidas(ventas), unidadesVendidasM(ventas));
compararPar('ventasPorCiudad ("Medellín")', ventasPorCiudad(ventas, "Medellín"), ventasPorCiudadM(ventas, "Medellín"));
compararPar('ventasPorCiudad ("  medellín ")', ventasPorCiudad(ventas, "  medellín "), ventasPorCiudadM(ventas, "  medellín "));
compararPar('ventasPorCiudad ("Bogotá ")', ventasPorCiudad(ventas, "Bogotá "), ventasPorCiudadM(ventas, "Bogotá "));
compararPar('ventasPorCiudad ("Cali")', ventasPorCiudad(ventas, "Cali"), ventasPorCiudadM(ventas, "Cali"));
compararPar('ventasPorCiudad ("Pereira")', ventasPorCiudad(ventas, "Pereira"), ventasPorCiudadM(ventas, "Pereira"));

// Pruebas con arreglo vacío
compararPar("totalVendido ([])", totalVendido([]), totalVendidoM([]));
compararPar("unidadesVendidas ([])", unidadesVendidas([]), unidadesVendidasM([]));
compararPar('ventasPorCiudad ([], "Medellín")', ventasPorCiudad([], "Medellín"), ventasPorCiudadM([], "Medellín"));

console.log("\n=== 2. AGRUPACIONES CON DICCIONARIOS Y RANKINGS ===");

// Guardar copia de los IDs originales antes de ejecutar ordenamientos
const idsOriginales = ventas.map((v) => v.id).join(",");

const ciudades = totalPorCiudad(ventas);
console.log("\nTotal vendido por ciudad (4 ciudades normalizadas):");
console.table(ciudades);
console.log(
  "Verificación cantidad de ciudades (4):",
  Object.keys(ciudades).length === 4 ? "OK" : "DIFERENTE"
);

const unidadesProd = unidadesPorProducto(ventas);
console.log("\nUnidades vendidas por producto:");
console.table(unidadesProd);

const top3 = topProductosPorValor(ventas, 3);
console.log("\nTop 3 productos que más dinero generaron:");
console.table(top3);

// Verificar inmutabilidad del arreglo original
const idsDespues = ventas.map((v) => v.id).join(",");
console.log(
  "Verificación inmutabilidad de ventas:",
  idsOriginales === idsDespues ? "OK" : "DIFERENTE"
);