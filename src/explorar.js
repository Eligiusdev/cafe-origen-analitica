const ventas = require("./datos");

console.log("=== EXPLORACIÓN DE VENTAS: CAFÉ ORIGEN ===\n");

// 1. Cantidad total de registros
console.log("Cantidad de registros:", ventas.length);

// 2. Primer registro (índice 0)
console.log("\nPrimer registro:", ventas[0]);

// 3. Último registro (usando length - 1)
console.log("\nÚltimo registro:", ventas[ventas.length - 1]);

// 4. Propiedad 'producto' del registro en la posición 4 (índice 4 -> 5to elemento, id: 5)
console.log("\nProducto en la posición 4 (índice 4):", ventas[4].producto);

// 5. Tabla completa
console.log("\nTabla completa de ventas:");
console.table(ventas);
const {
  valorVenta,
  totalVendido,
  unidadesVendidas,
  ventaMayor,
  ticketPromedio,
  ventasPorCiudad
} = require("./analitica");

console.log("\n=== PRUEBAS DE INDICADORES (CICLOS MANUALES) ===");

// Entrada 1: Arreglo completo (12 registros)
console.log("\n--- 1. Muestra completa (12 registros) ---");
console.log("valorVenta(ventas[0]):", valorVenta(ventas[0])); // 84000
console.log("totalVendido:", totalVendido(ventas)); // 985000
console.log("unidadesVendidas:", unidadesVendidas(ventas)); // 21
console.log("ventaMayor:", ventaMayor(ventas)); // id: 10 (168000)
console.log("ticketPromedio:", ticketPromedio(ventas)); // 89545.4545... (985000 / 11)
console.log('ventasPorCiudad("Medellín"):', ventasPorCiudad(ventas, "Medellín")); // 356000
console.log('ventasPorCiudad("  medellín "):', ventasPorCiudad(ventas, "  medellín ")); // 356000

// Entrada 2: Arreglo de un solo elemento
const unaVenta = [ventas[0]];
console.log("\n--- 2. Arreglo de un solo elemento ([ventas[0]]) ---");
console.log("totalVendido:", totalVendido(unaVenta)); // 84000
console.log("unidadesVendidas:", unidadesVendidas(unaVenta)); // 2
console.log("ventaMayor:", ventaMayor(unaVenta)); // Objeto id: 1
console.log("ticketPromedio:", ticketPromedio(unaVenta)); // 84000
console.log('ventasPorCiudad("Medellín"):', ventasPorCiudad(unaVenta, "Medellín")); // 84000

// Entrada 3: Arreglo vacío ([])
const vacio = [];
console.log("\n--- 3. Arreglo vacío ([]) ---");
console.log("totalVendido([]):", totalVendido(vacio)); // 0
console.log("unidadesVendidas([]):", unidadesVendidas(vacio)); // 0
console.log("ventaMayor([]):", ventaMayor(vacio)); // null
console.log("ticketPromedio([]):", ticketPromedio(vacio)); // 0 (Sin NaN)
console.log('ventasPorCiudad([], "Medellín"):', ventasPorCiudad(vacio, "Medellín")); // 0