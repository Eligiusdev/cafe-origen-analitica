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