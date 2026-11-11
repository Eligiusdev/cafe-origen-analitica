# Rendimiento del motor de analítica — v0.2

## Alcance y metodología

Este informe clasifica las funciones de `src/analitica.js` y las funciones de apoyo del generador en `src/generador.js`. Se considera `n` el número de ventas, `p` la cantidad de productos distintos, `u` la cantidad de clientes distintos y `L` la longitud de un nombre de ciudad. La memoria espacial describe el espacio adicional máximo, aparte del arreglo de entrada; cuando una función devuelve una colección, se indica como parte de su espacio de salida.

Las mediciones de 10.000 ventas se hicieron con Node.js v22.22.1 sobre un arreglo producido por `generarVentas(10000)`, generado antes de iniciar los cronómetros. Los tiempos lineales son promedios de cinco ejecuciones después de una ejecución de calentamiento; `clientesRecurrentes` se midió una vez por el costo de cada ejecución. Son tiempos de una máquina y una distribución de datos, no garantías de latencia. La instrumentación de operaciones cuenta visitas y comparaciones según el modelo del MiniReto 5.

## Complejidad por función

| Función | Qué hace | Tiempo | Espacio adicional | Justificación y evidencia con 10.000 ventas |
| :--- | :--- | :--- | :--- | :--- |
| `valorVenta` | Calcula cantidad × precio de una venta. | O(1) | O(1) | Una multiplicación por llamada; se invoca hasta 10.000 veces al totalizar ventas. |
| `totalVendido` | Suma el valor de las ventas válidas. | O(n) | O(1) | Un ciclo y un acumulador; 10.000 registros: 0,164 ms. |
| `totalVendidoInstrumentado` | Suma ventas y cuenta visitas/comparaciones. | O(n) | O(1) | Un ciclo; 20.000 operaciones medidas para 10.000 ventas válidas. |
| `unidadesVendidas` | Suma unidades vendidas. | O(n) | O(1) | Un ciclo y un acumulador; 10.000 registros: 0,076 ms. |
| `ventaMayor` | Busca la venta válida de mayor valor. | O(n) | O(1) | Un ciclo, máximo y referencia a una venta existente; 10.000 registros: 0,087 ms. |
| `ventaMayorInstrumentada` | Busca la venta mayor y cuenta visitas/comparaciones. | O(n) | O(1) | Un ciclo; 30.000 operaciones medidas para 10.000 ventas válidas. |
| `ticketPromedio` | Calcula el promedio de valor de las ventas válidas. | O(n) | O(1) | Un ciclo con suma y contador; 10.000 registros: 0,129 ms. |
| `ventasPorCiudad` | Suma ventas válidas de una ciudad normalizada. | O(n) | O(1) | Un ciclo y un acumulador; 10.000 registros: 0,270 ms. |
| `normalizarNombreCiudad` | Limpia y estandariza un nombre de ciudad. | O(L) | O(L) | Opera sobre la longitud `L` del nombre. En el catálogo actual `L` está acotada; se ejecuta por cada venta agrupada. |
| `totalVendidoM` | Suma ventas con `filter`, `map` y `reduce`. | O(n) | O(n) | Tres etapas lineales y arreglos de filtrado/mapeo; 10.000 registros: 0,407 ms. |
| `unidadesVendidasM` | Suma unidades con métodos de arreglo. | O(n) | O(n) | `filter` y `map` crean arreglos proporcionales a `n`; 10.000 registros: 0,310 ms. |
| `ventasPorCiudadM` | Filtra, calcula subtotales y suma por ciudad. | O(n) | O(n) | `filter` y `map` crean arreglos intermedios; 10.000 registros: 0,434 ms. |
| `totalCiudadCadena` | Normaliza, filtra, calcula subtotales y suma por ciudad. | O(n) | O(n) | Hasta cuatro etapas lineales (`map`, `filter`, `map`, `reduce`) y tres arreglos intermedios; 10.000 registros: 0,625 ms. |
| `totalCiudadUnaPasada` | Suma por ciudad con un único `for...of`. | O(n) | O(1) | Un ciclo, sin arreglos intermedios; 10.000 registros: 0,308 ms. |
| `totalPorCiudad` | Agrupa el valor vendido por ciudad. | O(n) | O(n) | Filtra a un arreglo y acumula en un diccionario de hasta `n` claves; 10.000 registros: 1,614 ms. |
| `totalPorCiudadInstrumentado` | Agrupa por ciudad y cuenta operaciones. | O(n) | O(n) | Un ciclo; el diccionario de salida puede tener hasta `n` claves. El contador registró 30.000 operaciones a n=10.000. |
| `clientesRecurrentes` | Busca clientes que aparecen en más de una venta. | O(n²) en los datos generados; O(n³) en el peor caso adversarial | O(n) | Compara `n(n-1)/2` pares y, cuando coinciden, busca con `includes` en la lista de recurrentes. Midió 411,844 ms a n=10.000 y 63,973 s a n=100.000. |
| `primeraVenta` | Devuelve la primera venta. | O(1) | O(1) | Accede solo a `ventas[0]`; el contador registró 1 operación con 10.000 ventas. |
| `unidadesPorProducto` | Agrupa unidades vendidas por producto. | O(n) | O(n) | Crea un arreglo filtrado y un diccionario de productos; 10.000 registros: 0,556 ms. |
| `topProductosPorValor` | Agrupa ingresos, ordena productos y devuelve los primeros `k`. | O(n + p log p), peor caso O(n log n) | O(n) | Recorre ventas y ordena `p` productos distintos; el filtro, diccionario y arreglos ocupan O(n). Con el catálogo fijo de cinco productos: 0,531 ms para 10.000 ventas. |
| `ventasDelDia` | Filtra ventas válidas de una fecha. | O(n) | O(n) | `filter` puede devolver hasta `n` ventas; 10.000 registros: 0,212 ms. |
| `enteroAleatorio` | Genera un índice aleatorio. | O(1) | O(1) | Un número fijo de operaciones por llamada; el generador lo invoca cuatro veces por venta. |
| `generarVentas` | Construye un historial de `n` ventas. | O(n) | O(n) de salida | Un ciclo crea y agrega cada venta; con n=10.000 produce 10.000 objetos y realiza 40.000 selecciones aleatorias. |

Para `topProductosPorValor`, `p` es la cantidad de productos distintos. Con el catálogo fijo del generador, `p ≤ 5` y el ordenamiento es acotado; con datos arbitrarios, `p` puede llegar a `n`. Por eso la clasificación general incluye el costo O(p log p) del `sort`.

En `totalCiudadCadena`, el máximo es `n + n + m + m ≤ 4n` visitas, donde `m ≤ n` es el resultado del filtro. Por la regla de simplificación, **O(4n) = O(n)**: la cadena y la pasada única tienen el mismo orden temporal, aunque la cadena usa O(n) memoria adicional y la pasada única O(1).

Las funciones instrumentadas agregan el contador recibido por el llamador y no crean estructuras proporcionales a `n`, salvo el diccionario de resultado de `totalPorCiudadInstrumentado`. Las funciones con métodos de arreglo son legibles, pero los arreglos temporales aumentan la presión de memoria.

## Proyección a 1.000.000 de ventas

Para funciones lineales se proyecta el tiempo medido a n=10.000 multiplicándolo por 100: el tamaño de entrada crece 100 veces y se asume trabajo lineal. Para clientes recurrentes se usa la medición real de n=100.000 y el crecimiento cuadrático observado en los tamaños menores; pasar de 100.000 a 1.000.000 multiplica el tiempo estimado por 100. Las proyecciones suponen una distribución similar a la del generador y el mismo entorno de ejecución.

| Reporte | Medición base | Modelo | Estimación para 1.000.000 |
| :--- | :--- | :--- | ---: |
| `totalVendido` | 0,164 ms / 10.000 | O(n), ×100 | 16,4 ms |
| `totalVendidoM` | 0,407 ms / 10.000 | O(n), ×100 | 40,7 ms |
| `unidadesVendidas` | 0,076 ms / 10.000 | O(n), ×100 | 7,6 ms |
| `unidadesVendidasM` | 0,310 ms / 10.000 | O(n), ×100 | 31,0 ms |
| `ventaMayor` | 0,087 ms / 10.000 | O(n), ×100 | 8,7 ms |
| `ticketPromedio` | 0,129 ms / 10.000 | O(n), ×100 | 12,9 ms |
| `ventasPorCiudad` | 0,270 ms / 10.000 | O(n), ×100 | 27,0 ms |
| `ventasPorCiudadM` | 0,434 ms / 10.000 | O(n), ×100 | 43,4 ms |
| `totalCiudadCadena` | 0,625 ms / 10.000 | O(n), ×100 | 62,5 ms |
| `totalCiudadUnaPasada` | 0,308 ms / 10.000 | O(n), ×100 | 30,8 ms |
| `totalPorCiudad` | 1,614 ms / 10.000 | O(n), ×100 | 161,4 ms |
| `unidadesPorProducto` | 0,556 ms / 10.000 | O(n), ×100 | 55,6 ms |
| `topProductosPorValor` | 0,531 ms / 10.000 | O(n) con cinco productos, ×100 | 53,1 ms |
| `ventasDelDia` | 0,212 ms / 10.000 | O(n), ×100 | 21,2 ms |
| `clientesRecurrentes` | 63,973 s / 100.000 | O(n²) observado, ×100 | **106,62 min** |

Las proyecciones de los reportes lineales no incluyen la lectura de disco, serialización, red ni la generación del arreglo de entrada. La pasada encadenada también requiere memoria temporal O(n); no se debe interpretar su baja proyección de CPU como un bajo consumo de memoria. El cálculo de clientes recurrentes es una proyección típica, no el límite teórico: con entradas adversas, `includes` puede llevar el algoritmo a O(n³).

Las funciones instrumentadas de MiniReto 5 tienen estas proyecciones de conteo para un millón de ventas: `totalVendidoInstrumentado`, 2.000.000 operaciones; `ventaMayorInstrumentada`, 3.000.000; `totalPorCiudadInstrumentado`, 3.000.000; y `primeraVenta`, 1. No se convierten en tiempos porque el contador agrega trabajo al propio benchmark.

## Riesgos

Ordenados de mayor a menor, considerando crecimiento temporal, memoria adicional y resultados observados:

1. **`clientesRecurrentes` — mayor riesgo medido.** En el generador el crecimiento observado es cercano a cuadrático, no cúbico; aun así, tardó 63,973 s con 100.000 ventas. `includes` puede llevarlo a O(n³) con una distribución adversarial.
2. **`topProductosPorValor` — riesgo alto si crece el catálogo.** Ordena todos los productos distintos: O(n + p log p), hasta O(n log n), y conserva varias estructuras O(n). El catálogo actual pequeño reduce el costo práctico del `sort`, pero no elimina las asignaciones.
3. **`totalCiudadCadena` y funciones M basadas en arreglos — riesgo de memoria.** Son O(n) en tiempo, pero crean uno o más arreglos de hasta `n` elementos.
4. **`totalPorCiudad`, `totalPorCiudadInstrumentado` y `unidadesPorProducto` — riesgo de memoria según cardinalidad.** Sus diccionarios pueden crecer hasta O(n); algunos también crean un arreglo filtrado.
5. **Recorridos únicos (`totalCiudadUnaPasada`, `totalVendido`, `ventaMayor`, `ticketPromedio`, `ventasPorCiudad`, etc.) — riesgo bajo.** Siguen tardando O(n), pero usan O(1) espacio adicional y evitan copias del historial.
6. **Funciones O(1) (`valorVenta`, `primeraVenta`, `enteroAleatorio`) — riesgo mínimo.** Su trabajo no aumenta con el número de ventas por llamada.

## Plan de optimización

Prioridad: reemplazar el algoritmo de `clientesRecurrentes`, sin modificarlo todavía.

- **Trabajo repetido:** comparar cada venta con muchas ventas posteriores y, ante coincidencias, volver a recorrer `recurrentes` con `includes` para comprobar si el cliente ya se agregó.
- **Información a guardar:** recorrer una vez y mantener un `Map` con el conteo de compras por cliente. Al terminar, seleccionar las claves con conteo mayor que uno. El `Map` conserva el orden de primera aparición, por lo que también permite conservar el orden de salida esperado.
- **Resultado esperado:** O(n) tiempo promedio y O(u) espacio, donde `u` es el número de clientes distintos. Se evita comparar pares y buscar repetidamente en una lista; después se mediría la versión propuesta con los mismos tamaños y datos.
