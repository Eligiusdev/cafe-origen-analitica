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