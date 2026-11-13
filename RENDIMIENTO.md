# Rendimiento del motor de analítica — v1.0

## Alcance y metodología

Se clasifica el motor en `src/analitica.js`, `src/comercial.js`, `src/temporal.js` y `src/generador.js`. Se considera `n` el número de ventas, `p` la cantidad de productos distintos, `u` los clientes distintos, `d` las fechas distintas y `L` la longitud de un nombre de ciudad. El espacio auxiliar excluye el arreglo de entrada y considera colecciones devueltas como espacio de salida.

Las mediciones v1.0 se hicieron con Node.js v22.22.1. Los tiempos aislados de funciones usan arreglos generados antes de iniciar el cronómetro. `node src/medir_reportes.js` compara el proceso completo: incluye arranque de Node, generación, cálculo y escritura (stdout descartado); informa la mediana de tres ejecuciones tras una calentada. Los datos se generan aleatoriamente, así que los tiempos pueden variar y no son garantías de latencia.

## Complejidad por función

| Función | Qué hace | Tiempo | Espacio adicional | Evidencia / nota |
| :--- | :--- | :--- | :--- | :--- |
| `valorVenta` | Calcula cantidad × precio de una venta. | O(1) | O(1) | Una multiplicación por llamada. |
| `totalVendido` | Suma el valor de las ventas válidas. | O(n) | O(1) | Recorrido y acumulador. |
| `totalVendidoInstrumentado` | Suma ventas y cuenta operaciones. | O(n) | O(1) | Dos operaciones contadas por venta válida. |
| `unidadesVendidas` | Suma unidades vendidas. | O(n) | O(1) | Recorrido y acumulador. |
| `ventaMayor` | Busca la venta válida de mayor valor. | O(n) | O(1) | Recorrido, máximo y referencia. |
| `ventaMayorInstrumentada` | Busca el máximo y cuenta operaciones. | O(n) | O(1) | Tres operaciones contadas por venta válida. |
| `ticketPromedio` | Calcula el promedio por venta efectiva. | O(n) | O(1) | Mantiene suma y contador. |
| `ventasPorCiudad` | Suma ventas de una ciudad normalizada. | O(n) | O(1) | Un recorrido y un acumulador. |
| `normalizarNombreCiudad` | Limpia y estandariza una ciudad. | O(L) | O(L) | Opera sobre la longitud del nombre. |
| `totalVendidoM` | Suma ventas con `filter`, `map` y `reduce`. | O(n) | O(n) | Arreglos intermedios; 0,407 ms a n=10.000 en la medición base. |
| `unidadesVendidasM` | Suma unidades con métodos de arreglo. | O(n) | O(n) | Arreglos intermedios; medición base: 0,310 ms a n=10.000. |
| `ventasPorCiudadM` | Filtra, transforma y suma por ciudad. | O(n) | O(n) | Arreglos intermedios; medición base: 0,434 ms a n=10.000. |
| `totalCiudadCadena` | Agrupa por ciudad mediante una cadena de métodos. | O(n) | O(n) | Hasta cuatro etapas lineales y tres arreglos intermedios. |
| `totalCiudadUnaPasada` | Suma una ciudad en un solo recorrido. | O(n) | O(1) | Evita arreglos temporales; medición base: 0,308 ms a n=10.000. |
| `totalPorCiudad` | Agrupa ingresos por ciudad. | O(n) promedio | O(n) | El diccionario puede contener hasta n claves. |
| `totalPorCiudadInstrumentado` | Agrupa ingresos y cuenta operaciones. | O(n) promedio | O(n) | Conteo de 30.000 operaciones a n=10.000 en la medición base. |
| `clientesRecurrentes` | Devuelve clientes con más de una compra efectiva. | O(n) promedio | O(u) | `Map` en una pasada; 1,38 ms (10.000) y 7,99 ms (100.000). |
| `primeraVenta` | Devuelve el primer registro. | O(1) | O(1) | Un acceso a `ventas[0]`. |
| `unidadesPorProducto` | Agrupa unidades por producto. | O(n) promedio | O(n) | Filtrado y diccionario. |
| `topProductosPorValor` | Agrupa ingresos, ordena y devuelve los primeros k. | O(n + p log p) | O(n + p) | Con p=5 en el catálogo, el sort es pequeño; con datos arbitrarios p puede crecer. |
| `ventasDelDia` | Filtra ventas efectivas por fecha. | O(n) | O(n) | `filter` puede devolver hasta n registros. |
| `productoEstrellaPorCiudad` | Busca el producto de más ingresos por ciudad. | O(n) promedio | O(n) | Mapas ciudad-producto; 17,26 ms a n=100.000. |
| `comboRegaloSugerido` | Cuenta clientes que comparten cada par de productos. | O(n + u·p²); O(n) con p=5 fijo | O(n) | Máximo diez pares por cliente con el catálogo actual; 37,60 ms a n=100.000. Producto no catalogado: error explícito. |
| `clienteParaCupon` | Recomienda al cliente con más compras; desempata por gasto. | O(n) promedio | O(u) | Acumula compras e ingresos con `Map`; 15,88 ms a n=100.000. |
| `mejorSemana` | Busca la ventana calendario de siete días con más ingresos. | O(n + d log d) | O(d) | Agrupa fechas, las ordena y desliza dos punteros; 20,86 ms a n=100.000. |
| `enteroAleatorio` | Genera un índice aleatorio. | O(1) | O(1) | Número fijo de operaciones por llamada. |
| `generarVentas` | Construye un historial de n ventas. | O(n) | O(n) de salida | Cuatro selecciones aleatorias por registro. |
| `seleccionarVentas` | Lee el tamaño de `process.argv` o selecciona Día 1. | O(1) para Día 1; O(n) al generar | O(1) u O(n) de salida | Rechaza argumentos inválidos. |
| `imprimirResumenEjecutivo` | Imprime indicadores de un subconjunto. | O(n) | O(1) | Número constante de recorridos. |
| `ejecutarReporte` | Integra las doce secciones de v1.0. | O(n + d log d + p log p) | O(n) | Mediana de 299,76 ms a n=100.000, incluido arranque y generación. |

Las funciones de métodos de arreglo son alternativas didácticas; sus copias pueden aumentar el uso de memoria. El reporte v1.0 prefiere las agregaciones de una pasada cuando están disponibles.

`comboRegaloSugerido` usa el catálogo cerrado de cinco productos de `generador.js`, por lo que `p` es constante y cada cliente aporta a lo sumo diez pares. Si se amplía el catálogo, hay que actualizarlo y volver a medir.

## Comparación v0.1 vs v1.0

Mediana de tres ejecuciones tras una calentada en Node.js v22.22.1. La medición abarca el proceso completo; las ventas son generadas por cada ejecución y stdout se descarta para evitar que la terminal sesgue el resultado.

| Ventas | Reporte v0.1 | Reporte v1.0 | Diferencia |
| ---: | ---: | ---: | ---: |
| 10.000 | 115,84 ms | 131,50 ms | +13,5 % |
| 100.000 | 212,02 ms | 299,76 ms | +41,4 % |

El v1.0 ejecuta cinco secciones adicionales, por eso el reporte completo tarda más que la línea base ligera. Aun así, 100.000 ventas se procesan en aproximadamente 0,30 s, por debajo del criterio de cinco segundos.

Para comparar la optimización principal en trabajo equivalente, se midieron las dos implementaciones de clientes recurrentes sobre los mismos arreglos generados:

| Ventas | v0.1: doble ciclo | v1.0: `Map` | Mejora observada |
| ---: | ---: | ---: | ---: |
| 10.000 | 396,13 ms | 1,38 ms | 287× más rápido |
| 100.000 | 62.448,36 ms | 7,99 ms | 7.816× más rápido |

`node src/medir_recurrentes.js` reproduce esta comparación. La versión v0.1 del algoritmo puede tardar cerca de un minuto con 100.000 registros.

## Proyección y riesgos

La mediana observada del reporte v1.0 a n=100.000 permite proyectar aproximadamente **3,00 s para 1.000.000** bajo el mismo catálogo, distribución y entorno. Es una extrapolación lineal, no una medición directa.

Los riesgos actuales son la memoria O(n) de los diccionarios y arreglos que pueden crecer con cardinalidad, y el costo O(p log p) si el catálogo de productos crece mucho. `clientesRecurrentes`, `clienteParaCupon` y los recorridos de ventas son lineales; no hay ciclos anidados dependientes de n en el reporte final. Los conteos instrumentados de MiniReto 5 predicen para un millón de ventas: 2.000.000 operaciones para `totalVendidoInstrumentado`, 3.000.000 para `ventaMayorInstrumentada`, 3.000.000 para `totalPorCiudadInstrumentado` y 1 para `primeraVenta`.

## Estrategias aplicadas

- **Clientes recurrentes:** se reemplazaron las comparaciones de pares y `includes` por un `Map` de conteos; se ignoran ventas no efectivas.
- **Recomendaciones comerciales:** una pasada acumula ingresos por ciudad-producto y frecuencias por cliente; el catálogo acotado hace constante el número de pares.
- **Mejor semana:** los ingresos se agrupan por fecha, se ordenan las fechas y dos punteros mantienen una ventana de hasta siete días.
- **Reporte:** las funciones analíticas se reutilizan y la lista de clientes recurrentes se limita a diez elementos para mantener la salida acotada.
