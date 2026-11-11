const PRODUCTOS = [
  "Origen Huila 500 g",
  "Origen Nariño 250 g",
  "Prensa francesa",
  "Origen Sierra 500 g",
  "Molino manual"
];

const PRECIOS = [42000, 26000, 95000, 45000, 120000];
const CIUDADES = ["Medellín", "Bogotá", "Cali", "Pereira"];

function enteroAleatorio(maximo) {
  return Math.floor(Math.random() * maximo);
}

function generarVentas(n) {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError("n debe ser un entero mayor o igual a 0");
  }

  const ventas = [];
  const cantidadClientes = n === 0 ? 0 : Math.max(1, Math.floor(n / 3));

  for (let i = 0; i < n; i += 1) {
    const indiceProducto = enteroAleatorio(PRODUCTOS.length);
    const dia = String((i % 30) + 1).padStart(2, "0");

    ventas.push({
      id: i + 1,
      fecha: `2026-09-${dia}`,
      cliente: `C${String(enteroAleatorio(cantidadClientes) + 1).padStart(2, "0")}`,
      producto: PRODUCTOS[indiceProducto],
      ciudad: CIUDADES[enteroAleatorio(CIUDADES.length)],
      cantidad: enteroAleatorio(5) + 1,
      precio: PRECIOS[indiceProducto]
    });
  }

  return ventas;
}

module.exports = { generarVentas };
