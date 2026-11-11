# Bitácora de Análisis — Café Origen

## 1. Diccionario de datos

Cada elemento del arreglo `ventas` es un objeto literal de JavaScript que representa una transacción registrada en el historial de Café Origen.

| Propiedad | Tipo de dato (JS) | Significado y descripción | Ejemplo |
| :--- | :--- | :--- | :--- |
| `id` | `number` (Entero) | Identificador único secuencial de la transacción de venta. | `1` |
| `fecha` | `string` (ISO `YYYY-MM-DD`) | Fecha en la que se registró la operación comercial. | `"2026-09-01"` |
| `cliente` | `string` | Código alfanumérico que identifica de forma única al comprador. | `"C01"` |
| `producto` | `string` | Nombre comercial del artículo vendido (café en grano/molido o accesorio). | `"Origen Huila 500 g"` |
| `ciudad` | `string` | Ciudad de destino o sucursal donde se efectuó la venta. | `"Medellín"` |
| `cantidad` | `number` (Entero) | Número de unidades del producto incluidas en la transacción. | `2` |
| `precio` | `number` (Entero) | Precio unitario de venta del producto expresado en pesos colombianos (COP). | `42000` |

---

## 2. Casos borde detectados

Al inspeccionar los 12 registros con `src/explorar.js`, se identificaron los siguientes problemas de calidad y particularidades en los datos:

### Caso 1: Inconsistencia de mayúsculas/minúsculas en `ciudad` (Registro `id: 5`)
* **Problema detectado:** En el registro `id: 5`, la propiedad `ciudad` tiene el valor `"medellín"` (con inicial minúscula), mientras que en los registros `1`, `4` y `11` aparece como `"Medellín"`. Si se agrupa por texto exacto, el sistema contará a `"Medellín"` y `"medellín"` como dos ciudades distintas.
* **Decisión analítica:** Estandarizar los nombres de las ciudades antes de agrupar o filtrar (aplicando `.trim()` y normalizando el formato a *Title Case* o comparando en minúsculas con `.toLowerCase()`), consolidando ambos bajo `"Medellín"`.

### Caso 2: Venta con `cantidad: 0` (Registro `id: 8`)
* **Problema detectado:** El registro `id: 8` (`cliente: "C06"`, `producto: "Origen Huila 500 g"`, `ciudad: "Cali"`) tiene `cantidad: 0` y `precio: 42000`. Representa un pedido anulado, un error de digitación o una cotización sin salida de inventario. Si no se filtra, distorsiona el conteo de transacciones efectivas y el ticket promedio por venta.
* **Decisión analítica:** Excluir o filtrar en los reportes de ventas efectivas todo registro cuya `cantidad <= 0` (`ventas.filter(v => v.cantidad > 0)`), reportando el registro `id: 8` por separado en una métrica de auditoría de "transacciones en cero o anuladas".

### Caso 3: Clientes recurrentes vs. conteo de clientes únicos (`cliente`)
* **Problema detectado:** Aunque existen 12 registros de venta, solo hay **8 clientes únicos** (`C01` a `C08`). Clientes como `C01` (3 compras: IDs `1`, `4`, `11`), `C02` (2 compras: IDs `2`, `7`) y `C03` (2 compras: IDs `3`, `9`) aparecen múltiples veces. Incluso `C01` compró el mismo producto en dos fechas distintas y `C06` solo registra una operación con `cantidad: 0`.
* **Decisión analítica:** No usar `ventas.length` como sinónimo de "cantidad de clientes". Para métricas de clientes activos se extraerán valores únicos (`new Set`) únicamente sobre las ventas válidas (`cantidad > 0`), lo que deja 7 clientes con compra efectiva y 1 cliente (`C06`) sin compra completada.

### Caso 4: Mezcla de categorías en `producto` y significado de `precio`
* **Problema detectado:** El catálogo mezcla café por peso (`Origen Huila 500 g`, `Origen Nariño 250 g`, `Origen Sierra 500 g`) con equipos de preparación (`Prensa francesa` a `$95.000`, `Molino manual` a `$120.000`). Además, `precio` representa el **valor unitario** y no el total de la línea.
* **Decisión analítica:** Calcular siempre el ingreso de cada registro mediante `subtotal = cantidad * precio` (nunca sumando la columna `precio` directamente).
* ---

## 3. Plan en pseudocódigo de los indicadores

Antes de implementar las funciones en `src/analitica.js`, se diseñó el plan paso a paso especificando recorrido, condición, acumulador/contador y valor inicial:

### 3.1. `valorVenta(venta)`
* **Propósito:** Calcular el ingreso bruto de un registro individual.
* **Lógica:** Si `venta` no existe, retornar `0`. En caso contrario, retornar `venta.cantidad * venta.precio`.

### 3.2. `totalVendido(ventas)` (Patrón Acumulador)
* **Valor inicial:** `total = 0`
* **Recorrido:** Cada objeto `venta` dentro del arreglo `ventas` (`for...of`).
* **Condición:** `venta.cantidad > 0` (ignora ventas anuladas o en cero).
* **Acumulación:** `total = total + valorVenta(venta)`
* **Retorno:** `total`

### 3.3. `unidadesVendidas(ventas)` (Patrón Acumulador)
* **Valor inicial:** `totalUnidades = 0`
* **Recorrido:** Cada objeto `venta` dentro del arreglo `ventas` (`for...of`).
* **Condición:** `venta.cantidad > 0`
* **Acumulación:** `totalUnidades = totalUnidades + venta.cantidad`
* **Retorno:** `totalUnidades`

### 3.4. `ventaMayor(ventas)` (Patrón Máximo)
* **Valor inicial:** `mayorRegistro = null` y `montoMaximo = -1`
* **Recorrido:** Cada objeto `venta` dentro del arreglo `ventas` (`for...of`).
* **Condición:** `venta.cantidad > 0` y `valorVenta(venta) > montoMaximo`.
* **Actualización de máximo:** Si se cumple la condición, `montoMaximo = valorVenta(venta)` y `mayorRegistro = venta` (guardando el objeto completo).
* **Retorno:** `mayorRegistro`

### 3.5. `ticketPromedio(ventas)` (Patrón Acumulador + Contador)
* **Valores iniciales:** `sumaTotal = 0` y `contadorValidas = 0`
* **Recorrido:** Cada objeto `venta` dentro del arreglo `ventas` (`for...of`).
* **Condición:** `venta.cantidad > 0` (excluye el registro `id: 8` con `cantidad: 0` para no inflar el denominador con una venta no efectiva).
* **Acumulación y conteo:**
  * `sumaTotal = sumaTotal + valorVenta(venta)`
  * `contadorValidas = contadorValidas + 1`
* **Validación de borde (División por cero):** Si `contadorValidas === 0`, retornar `0`.
* **Retorno:** `sumaTotal / contadorValidas`

### 3.6. `ventasPorCiudad(ventas, ciudad)` (Normalización + Acumulador filtrado)
* **Valores iniciales:** `ciudadBuscada = ciudad.trim().toLowerCase()` y `totalCiudad = 0`
* **Recorrido:** Cada objeto `venta` dentro del arreglo `ventas` (`for...of`).
* **Condición:** `venta.cantidad > 0` y `venta.ciudad.trim().toLowerCase() === ciudadBuscada`.
* **Acumulación:** `totalCiudad = totalCiudad + valorVenta(venta)`
* **Retorno:** `totalCiudad`

---

## 4. Decisiones para casos borde y arreglo vacío (`[]`)

Para garantizar que ninguna función lance excepciones ni retorne `NaN` o `undefined` al recibir `[]` (o un arreglo donde todas las ventas tengan `cantidad: 0`):

| Función | Retorno con `[]` | Justificación técnica y de negocio |
| :--- | :--- | :--- |
| `valorVenta(null)` | `0` | Si no recibe un objeto válido, el valor monetario es `0`. |
| `totalVendido([])` | `0` | El elemento neutro de la suma monetaria es `0`. |
| `unidadesVendidas([])` | `0` | Si no hay transacciones, salieron `0` unidades de inventario. |
| `ventaMayor([])` | `null` | No existe ningún registro de venta para devolver; `null` representa explícitamente la ausencia de un objeto. |
| `ticketPromedio([])` | `0` | Al dividir `0 / 0` en JavaScript se obtiene `NaN`. Se valida `contadorValidas === 0` antes de dividir para devolver `0` de forma segura. |
| `ventasPorCiudad([], c)`| `0` | Sin ventas registradas, la facturación acumulada de cualquier ciudad es `0`. |

---

## 5. Verificación manual con tablas de traza

### Traza 1: `ventasPorCiudad(ventas, "Medellín")` y `ventaMayor(ventas)` sobre la muestra completa
* **Parámetro normalizado:** `ciudadBuscada = "medellín"`
* **Valores iniciales:** `totalCiudad = 0`, `montoMaximo = -1`, `mayorRegistro = null`

| Iteración (`id`) | `ciudad` normalizada | `cantidad` | `precio` | `valorVenta(v)` | ¿Suma a Medellín? | `totalCiudad` acumulado | ¿Supera `montoMaximo`? | `mayorRegistro` (`montoMaximo`) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | `"medellín"` | 2 | 42.000 | 84.000 | Sí | **84.000** | Sí (`84.000 > -1`) | `id: 1` (84.000) |
| **2** | `"bogotá"` | 1 | 26.000 | 26.000 | No | 84.000 | No | `id: 1` (84.000) |
| **3** | `"cali"` | 1 | 95.000 | 95.000 | No | 84.000 | Sí (`95.000 > 84.000`) | `id: 3` (95.000) |
| **4** | `"medellín"` | 1 | 42.000 | 42.000 | Sí | **126.000** | No | `id: 3` (95.000) |
| **5** | `"medellín"` | 3 | 45.000 | 135.000 | Sí | **261.000** | Sí (`135.000 > 95.000`) | `id: 5` (135.000) |
| **6** | `"bogotá"` | 2 | 26.000 | 52.000 | No | 261.000 | No | `id: 5` (135.000) |
| **7** | `"bogotá"` | 1 | 120.000 | 120.000 | No | 261.000 | No | `id: 5` (135.000) |
| **8** | `"cali"` | **0** | 42.000 | 0 | No (`cant=0`) | 261.000 | Ignorado (`cant=0`) | `id: 5` (135.000) |
| **9** | `"cali"` | 2 | 45.000 | 90.000 | No | 261.000 | No | `id: 5` (135.000) |
| **10** | `"pereira"` | 4 | 42.000 | 168.000 | No | 261.000 | Sí (`168.000 > 135.000`)| **`id: 10` (168.000)** |
| **11** | `"medellín"` | 1 | 95.000 | 95.000 | Sí | **356.000** | No | `id: 10` (168.000) |
| **12** | `"bogotá"` | 3 | 26.000 | 78.000 | No | 356.000 | No | `id: 10` (168.000) |

* **Resultado manual `ventasPorCiudad(ventas, "Medellín")`:** `356000` (coincide con el programa).
* **Resultado manual `ventaMayor(ventas)`:** Registro `id: 10` con valor `168000` (coincide con el programa).

---

### Traza 2: `totalVendido(ventas)`, `unidadesVendidas(ventas)` y `ticketPromedio(ventas)`
* **Valores iniciales:** `sumaTotal = 0`, `totalUnidades = 0`, `contadorValidas = 0`

| Iteración (`id`) | `cantidad` | `precio` | ¿Es válida (`cantidad > 0`)? | `valorVenta(v)` | `sumaTotal` (`totalVendido`) | `totalUnidades` (`unidadesVendidas`) | `contadorValidas` |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | 2 | 42.000 | Sí | 84.000 | 84.000 | 2 | 1 |
| **2** | 1 | 26.000 | Sí | 26.000 | 110.000 | 3 | 2 |
| **3** | 1 | 95.000 | Sí | 95.000 | 205.000 | 4 | 3 |
| **4** | 1 | 42.000 | Sí | 42.000 | 247.000 | 5 | 4 |
| **5** | 3 | 45.000 | Sí | 135.000 | 382.000 | 8 | 5 |
| **6** | 2 | 26.000 | Sí | 52.000 | 434.000 | 10 | 6 |
| **7** | 1 | 120.000 | Sí | 120.000 | 554.000 | 11 | 7 |
| **8** | **0** | 42.000 | **No** | 0 | 554.000 *(sin cambio)* | 11 *(sin cambio)* | 7 *(sin cambio)* |
| **9** | 2 | 45.000 | Sí | 90.000 | 644.000 | 13 | 8 |
| **10** | 4 | 42.000 | Sí | 168.000 | 812.000 | 17 | 9 |
| **11** | 1 | 95.000 | Sí | 95.000 | 907.000 | 18 | 10 |
| **12** | 3 | 26.000 | Sí | 78.000 | **985.000** | **21** | **11** |

* **Resultado manual `totalVendido(ventas)`:** `985000` (coincide con el programa).
* **Resultado manual `unidadesVendidas(ventas)`:** `21` (coincide con el programa).
* **Resultado manual `ticketPromedio(ventas)`:** `985000 / 11 = 89545.45454545454` (coincide con el programa).
* ---

## 6. Análisis de funciones con métodos de arreglo (Las 5 preguntas sobre colecciones)

Para reemplazar los ciclos manuales por tuberías declarativas (`filter`, `map`, `reduce`, `Object.entries`, `sort` y `slice`) sin alterar los resultados, se definió cómo responde cada función a las cinco preguntas clave sobre colecciones:

| Función | 1. ¿Qué recorro? | 2. ¿Qué filtro? | 3. ¿Qué transformo? | 4. ¿Qué acumulo? | 5. ¿Cómo agrupo? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`totalVendidoM(ventas)`** | El arreglo de objetos `ventas`. | Las ventas válidas con `v.cantidad > 0` (`filter`). | Cada objeto `venta` en su subtotal numérico `valorVenta(v)` (`map`). | La suma de todos los subtotales iniciando en `0` (`reduce`). | No agrupa (reduce toda la colección a un único número escalar). |
| **`unidadesVendidasM(ventas)`** | El arreglo de objetos `ventas`. | Las ventas válidas con `v.cantidad > 0` (`filter`). | Cada objeto `venta` en su número de unidades `v.cantidad` (`map`). | La suma total de unidades vendidas iniciando en `0` (`reduce`). | No agrupa (reduce toda la colección a un único entero). |
| **`ventasPorCiudadM(ventas, ciudad)`** | El arreglo de objetos `ventas`. | Las ventas con `v.cantidad > 0` cuya ciudad normalizada (`trim().toLowerCase()`) coincida con la ciudad buscada (`filter`). | Cada venta filtrada en su ingreso `valorVenta(v)` (`map`). | La suma de los subtotales de esa ciudad iniciando en `0` (`reduce`). | No crea diccionario; aisla un único grupo mediante el predicado del `filter`. |
| **`totalPorCiudad(ventas)`** | El arreglo de objetos `ventas`. | Las ventas efectivas con `v.cantidad > 0` (`filter`). | El nombre de `v.ciudad` a formato estándar (*Title Case* sin espacios sobrantes: `"Medellín"`, `"Bogotá"`, `"Cali"`, `"Pereira"`). | El valor monetario `valorVenta(venta)` dentro de la clave de cada ciudad iniciando en `{}` (`reduce`). | Usando un objeto como diccionario `{ [ciudadNormalizada]: totalAcumulado }`. |
| **`unidadesPorProducto(ventas)`** | El arreglo de objetos `ventas`. | Las ventas efectivas con `v.cantidad > 0` (`filter`). | El nombre del producto limpio con `v.producto.trim()`. | La cantidad de unidades `v.cantidad` asociada a cada producto iniciando en `{}` (`reduce`). | Usando un objeto como diccionario `{ [producto]: unidadesAcumuladas }`. |
| **`topProductosPorValor(ventas, k)`** | 1) El arreglo `ventas` y 2) Las entradas `Object.entries()` del diccionario de productos. | 1) Ventas con `v.cantidad > 0` (`filter`) y 2) Los primeros `k` elementos tras ordenar (`slice(0, k)`). | Cada par `[producto, total]` de `Object.entries` en un objeto `{ producto, total }` (`map`), y una copia `[...lista]` ordenada de mayor a menor (`sort((a, b) => b.total - a.total)`). | El ingreso total `valorVenta(venta)` por cada producto en el diccionario intermedio (`reduce` con `{}`). | Agrupa primero por clave `producto` en un diccionario y luego clasifica la colección resultante en un ranking descendente sin mutar `ventas`. |

### Resultados verificados de las agrupaciones
* **`totalPorCiudad(ventas)`:**
  * `Medellín`: `$356.000` (unifica registros `1`, `4`, `5` escrito `"medellín"` y `11`).
  * `Bogotá`: `$276.000` (registros `2`, `6`, `7` y `12`).
  * `Cali`: `$185.000` (registros `3` y `9`; excluye `id: 8` por `cantidad: 0`).
  * `Pereira`: `$168.000` (registro `10`).
* **`topProductosPorValor(ventas, 3)`:**
  1. `Origen Huila 500 g`: `$294.000` (7 unidades × `$42.000`)
  2. `Origen Sierra 500 g`: `$225.000` (5 unidades × `$45.000`)
  3. `Prensa francesa`: `$190.000` (2 unidades × `$95.000`)

## 7. Registro de depuración sistemática (Reporte de Gerencia — v0.1)

La gerencia reportó dos fallos observados en una versión preliminar externa. A continuación se documenta el análisis de causa raíz, la reproducción controlada y la demostración de por qué el motor **Café Origen v0.1** es inmune a ambos defectos.

---

### Caso de Depuración 1: Duplicación de ciudades (`"Bogotá"` aparece dos veces)

* **Síntoma:** En la tabla de ventas por ciudad de la versión preliminar del compañero, aparecían dos filas separadas para la misma ciudad: `"Bogotá"` y `"Bogotá "` (o `"Medellín"` y `"medellín"`), dividiendo el dinero acumulado en dos grupos distintos.
* **Entrada que lo produce:** Registros cuya propiedad `ciudad` contiene espacios en blanco al inicio/final o variaciones de mayúsculas/minúsculas, por ejemplo:
  ```js
  [
    { id: 2, ciudad: "Bogotá", cantidad: 1, precio: 26000 },
    { id: 99, ciudad: "Bogotá ", cantidad: 1, precio: 120000 },
    { id: 5, ciudad: "medellín", cantidad: 3, precio: 45000 }
  ]
  ```

## 8. Medición del crecimiento de operaciones

### Predicción previa

Antes de ejecutar `node src/medir.js`, predigo que al multiplicar `n` por 10:

| Función | Predicción del crecimiento |
| :--- | :--- |
| `totalVendidoInstrumentado` | Aproximadamente 10 veces más operaciones: recorre cada venta y evalúa una condición por elemento. |
| `ventaMayorInstrumentada` | Aproximadamente 10 veces más operaciones: visita cada venta y compara su valor con el máximo. |
| `totalPorCiudadInstrumentado` | Aproximadamente 10 veces más operaciones: recorre cada venta y actualiza un grupo de ciudad mediante una búsqueda de costo constante promedio. |
| `primeraVenta` | El mismo número de operaciones: solo accede al índice `0`, sin recorrer la colección. |

El contador registra una operación por elemento visitado y una por cada comparación contabilizada en el código instrumentado. Por ello, `totalVendidoInstrumentado` suma dos operaciones por venta; `ventaMayorInstrumentada`, tres por venta válida; y `totalPorCiudadInstrumentado`, tres por venta válida (visita, condición de cantidad y existencia de ciudad). El generador produce cantidades de 1 a 5, así que todas las ventas medidas son válidas.

### Resultados observados

Ejecutando `node src/medir.js`, la tabla mostró:

| n | `totalVendido` | `ventaMayor` | `totalPorCiudad` | `primeraVenta` |
| ---: | ---: | ---: | ---: | ---: |
| 100 | 200 | 300 | 300 | 1 |
| 1.000 | 2.000 | 3.000 | 3.000 | 1 |
| 10.000 | 20.000 | 30.000 | 30.000 | 1 |
| 100.000 | 200.000 | 300.000 | 300.000 | 1 |

En cada aumento de 10 veces en `n`, los conteos de las tres funciones de recorrido también aumentan exactamente 10 veces bajo este modelo de conteo; el de `primeraVenta` permanece en 1. Los resultados coinciden con la predicción.

### Clasificación Big O y justificación

| Función | Complejidad | Justificación |
| :--- | :--- | :--- |
| `totalVendidoInstrumentado` | **O(n)** | Un único ciclo visita `n` elementos y hace una cantidad fija de trabajo por venta. |
| `ventaMayorInstrumentada` | **O(n)** | Un único ciclo compara cada venta con el máximo actual; el trabajo por iteración es constante. |
| `totalPorCiudadInstrumentado` | **O(n)** | Un único ciclo procesa cada venta y agrupa usando claves de ciudad. El catálogo de ciudades es fijo, por lo que la búsqueda promedio en el objeto no agrega otro recorrido. |
| `primeraVenta` | **O(1)** | Solo consulta `ventas[0]`; el tamaño del arreglo no cambia el número de accesos. |

Ninguna de estas funciones es **O(n²)**: no hay ciclos anidados ni un recorrido completo por cada elemento. Los conteos medidos respaldan las clasificaciones lineales y constante.

## 9. Reporte de clientes recurrentes: costo de los ciclos anidados

Se agregó `clientesRecurrentes(ventas)` a `src/analitica.js` conservando el algoritmo del reporte: compara cada par de ventas y utiliza `recurrentes.includes()` para no devolver dos veces al mismo cliente.

### Verificación y traza con cinco ventas

Con el historial del Día 1, `clientesRecurrentes(ventas)` devuelve `["C01", "C02", "C03"]`. Para contar comparaciones se toma como comparación principal cada igualdad `ventas[i].cliente === ventas[j].cliente`; las búsquedas de `includes` se cuentan por separado.

Traza para `[C01, C02, C01, C03, C02]`:

| Índice `i` | Ventas posteriores comparadas | Igualdades de cliente | Comparaciones dentro de `includes` |
| ---: | :--- | ---: | ---: |
| 0 | C02, C01, C03, C02 | 4 | 0 (se encuentra C01 por primera vez) |
| 1 | C01, C03, C02 | 3 | 1 (busca C02 en `[C01]`) |
| 2 | C03, C02 | 2 | 0 |
| 3 | C02 | 1 | 0 |
| **Total** |  | **10** | **1** |

El ciclo interno visita todos los pares con `i < j`: con `n` ventas hace `n(n - 1) / 2` igualdades de clientes. Para cinco ventas son 10; ese componente crece como **O(n²)**. En esta traza se hace además una comparación de `includes`, para un total de 11 comparaciones si contamos ambos tipos.

### Medición de tiempo

`node src/medir_recurrentes.js` usa `generarVentas` y `console.time`/`console.timeEnd`; el tiempo medido corresponde solo a `clientesRecurrentes`, no a la generación aleatoria de los datos. Los resultados observados fueron:

| Ventas (`n`) | Tiempo |
| ---: | ---: |
| 1.000 | 3,20 ms |
| 2.000 | 15,10 ms |
| 4.000 | 55,53 ms |
| 8.000 | 275,21 ms |
| 16.000 | 1.004,59 ms |
| 100.000 | 63.973,32 ms (63,97 s) |

En las primeras cuatro duplicaciones el tiempo creció aproximadamente **4,72×, 3,68×, 4,96× y 3,65×**, respectivamente. La variación es esperable en una medición de tiempo real; la tendencia de multiplicarse cerca de cuatro al duplicar `n` concuerda con **O(n²)**. La prueba de 100.000 se ejecutó porque, extrapolando cuadráticamente desde 16.000, se estimaban 39,24 s, menos del límite de dos minutos. El resultado fue 63,97 s, más alto que la proyección.

### Estimaciones

La estimación para un millón se ancla en la medición real de 100.000 y en el crecimiento cuadrático observado para los tamaños menores: multiplicar `n` por 10 implica multiplicar el tiempo estimado por `10² = 100`. Por tanto, `63.973,32 ms × 100 = 6.397.332 ms`, aproximadamente **106,62 minutos**. Es una proyección, no una medición; la diferencia entre la primera proyección de 100.000 (39,24 s) y su tiempo real (63,97 s) evidencia que la estimación puede desviarse.

### Costo oculto de `includes` y peor caso

`includes` recorre `recurrentes` hasta hallar al cliente o llegar al final. No se ejecuta en cada pareja, sino cuando dos ventas tienen el mismo cliente; cada llamada puede costar **O(r)**, donde `r` es el número de clientes ya registrados. Con un historial adverso se pueden registrar Θ(n) clientes recurrentes antes de procesar Θ(n²) pares de otro cliente repetido; esas búsquedas recorren Θ(n) entradas y agregan hasta **O(n³)** trabajo en el peor caso. Por eso el doble ciclo por sí solo tiene costo O(n²), pero la función completa con `includes` puede llegar a O(n³); el generador aleatorio medido mostró una tendencia aproximadamente cuadrática, no un límite para todos los historiales.

### Conclusión para la gerente

El reporte compara las ventas entre sí, no procesa cada venta una sola vez. Al duplicar el historial, el trabajo puede acercarse a cuatro veces más; con 100.000 registros ya tardó más de un minuto. En historiales con muchos clientes repetidos, la búsqueda adicional para evitar nombres duplicados puede hacerlo todavía más lento. Por eso no conviene usar este reporte sobre todo el historial anual tal como está.

## 10. Complejidad espacial: reporte por ciudad

Se agregaron dos versiones equivalentes para sumar ventas válidas de una ciudad:

- `totalCiudadCadena(ventas, ciudad)` normaliza cada ciudad con `map`, filtra las ventas válidas de esa ciudad, transforma las ventas a subtotales con otro `map` y suma con `reduce`.
- `totalCiudadUnaPasada(ventas, ciudad)` normaliza y filtra dentro de un solo ciclo `for...of`, acumulando el total en un escalar.

La verificación genera 10.000 ventas y confirma que ambas funciones devuelven exactamente el mismo total para `"Medellín"`.

| Versión | Recorridos de colecciones | Arreglos nuevos | Tiempo | Espacio auxiliar |
| :--- | ---: | ---: | :--- | :--- |
| `totalCiudadCadena` | 4 etapas: `map` y `filter` recorren `n`; el segundo `map` y `reduce` recorren las `m` ventas filtradas (máximo `4n` visitas). | 3 (`map`, `filter`, `map`); el primer `map` también crea un objeto auxiliar por venta. | O(4n), que se simplifica a **O(n)** al eliminar la constante 4. | **O(n)** por los arreglos y objetos intermedios. |
| `totalCiudadUnaPasada` | 1 recorrido de `n` ventas. | 0. | **O(n)**. | **O(1)**: solo mantiene la ciudad buscada, el total y los valores temporales de cada iteración. |

Aunque la cadena recorre hasta cuatro veces sus colecciones, cuatro veces una entrada de tamaño `n` sigue creciendo linealmente: **O(4n) = O(n)**. La ventaja de la pasada única no es cambiar la complejidad temporal, sino reducir los recorridos constantes y evitar memoria temporal proporcional al historial.

### Clasificación espacial del motor

La complejidad siguiente mide memoria adicional máxima respecto a la entrada. Se consideran las funciones del motor analítico en `src/analitica.js` y el generador en `src/generador.js`; la salida que construye el generador también requiere espacio proporcional a `n`.

| Función | Espacio | Motivo |
| :--- | :--- | :--- |
| `valorVenta` | **O(1)** | Calcula un subtotal escalar. |
| `totalVendido` | **O(1)** | Mantiene un acumulador escalar. |
| `totalVendidoInstrumentado` | **O(1)** | Usa un acumulador y el contador recibido por referencia. |
| `unidadesVendidas` | **O(1)** | Mantiene un acumulador escalar. |
| `ventaMayor` | **O(1)** | Mantiene el máximo y una referencia a la venta existente. |
| `ventaMayorInstrumentada` | **O(1)** | Mantiene el máximo, una referencia y el contador recibido. |
| `ticketPromedio` | **O(1)** | Mantiene suma y cantidad de ventas válidas. |
| `ventasPorCiudad` | **O(1)** | Mantiene el total; solo normaliza la ciudad actual. |
| `normalizarNombreCiudad` | **O(1)** | Produce una cadena temporal de tamaño acotado por el nombre de ciudad. |
| `totalVendidoM` | **O(n)** | `filter` y `map` crean arreglos intermedios proporcionales a las ventas. |
| `unidadesVendidasM` | **O(n)** | `filter` y `map` crean arreglos intermedios proporcionales a las ventas. |
| `ventasPorCiudadM` | **O(n)** | `filter` y `map` crean arreglos intermedios. |
| `totalCiudadCadena` | **O(n)** | Crea tres arreglos intermedios y objetos normalizados por venta. |
| `totalCiudadUnaPasada` | **O(1)** | Usa un solo acumulador y no crea arreglos. |
| `totalPorCiudad` | **O(n)** | Crea un arreglo filtrado y un diccionario con hasta `n` ciudades distintas. |
| `totalPorCiudadInstrumentado` | **O(n)** | El diccionario de resultados puede contener hasta `n` claves distintas. |
| `clientesRecurrentes` | **O(n)** | El arreglo de salida puede contener hasta `n` clientes. |
| `primeraVenta` | **O(1)** | Devuelve una referencia al primer elemento sin copiar la colección. |
| `unidadesPorProducto` | **O(n)** | Crea un arreglo filtrado y un diccionario de productos. |
| `topProductosPorValor` | **O(n)** | El filtro, diccionario, entradas, mapeo, copia para ordenar y resultado pueden ocupar espacio proporcional a la cantidad de productos, que puede llegar a `n`. |
| `ventasDelDia` | **O(n)** | `filter` crea un arreglo con hasta `n` ventas. |
| `enteroAleatorio` | **O(1)** | Calcula y devuelve un entero. |
| `generarVentas` | **O(n)** | Construye y devuelve el arreglo de `n` ventas. |

Las versiones instrumentadas reciben un contador creado por quien las llama; ese objeto externo no cambia su espacio auxiliar asintótico. `totalPorCiudad` y `topProductosPorValor` no son O(1): el número de claves distintas puede crecer con la entrada aunque, en los datos generados actualmente, los catálogos sean fijos.

### Decisión para producción

Se deja `totalCiudadUnaPasada` como la opción de producción para el servidor con memoria limitada. Ambas versiones son O(n) en tiempo y son legibles, pero la pasada única evita tres arreglos y los objetos normalizados que crearía la cadena. `totalCiudadCadena` se conserva en el motor como comparación didáctica y para verificar que ambas estrategias producen el mismo resultado.