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