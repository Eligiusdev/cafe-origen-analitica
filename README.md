# Café Origen — motor de analítica de ventas v1.0

Motor de consola para explorar el historial de ventas de Café Origen, auditar datos y obtener indicadores y recomendaciones comerciales. El reporte funciona con la muestra real del Día 1 o con un historial sintético de cualquier tamaño.

## Requisitos

- Node.js 18 o posterior.
- No requiere paquetes externos ni instalación de dependencias.

## Ejecución rápida

Desde la raíz del repositorio:

```bash
# Reporte completo con los 12 registros reales del Día 1
node src/reporte.js

# Reporte completo con 100.000 ventas sintéticas
node src/reporte.js 100000
```

El segundo argumento debe ser un entero no negativo. El reporte incluye resumen ejecutivo, ventas por ciudad y producto, top productos, consultas de fecha, auditoría de calidad, clientes recurrentes, producto estrella por ciudad, combo sugerido, candidato a cupón y mejor ventana de siete días.

## Preguntas que responde

- ¿Cuánto se vendió, cuántas unidades y cuál fue el ticket promedio?
- ¿Qué ciudades y productos generan más ingresos?
- ¿Cuáles son los productos más vendidos y cuál lidera en cada ciudad?
- ¿Qué clientes vuelven a comprar y quién sería el candidato para un cupón?
- ¿Qué par de productos aparece con más frecuencia en historiales de clientes compartidos?
- ¿Cuál ventana de siete días tuvo más ingresos?
- ¿Cómo se comportan las funciones al crecer el historial y cuánto tarda el reporte?

El combo se basa en productos que aparecen en el historial del mismo cliente, no en pedidos identificados: el esquema actual no incluye un ID de pedido. La recomendación de cupón prioriza cantidad de compras y desempata por gasto. No hay un límite de presupuesto configurado, por lo que la ventana de mejor semana no aplica esa restricción.

## Verificación y mediciones

```bash
# Verificar resultados, casos borde y recomendaciones
node src/verificar.js

# Medir el tiempo total de los reportes v0.1 y v1.0 (10.000 y 100.000 ventas)
node src/medir_reportes.js

# Medir conteos de operaciones de las funciones instrumentadas
node src/medir.js
```

`src/reporte_v01.js` conserva el informe previo como línea base de rendimiento. `node src/medir_recurrentes.js` compara el doble ciclo histórico con la versión Map; la muestra de 100.000 puede tardar cerca de un minuto. No es necesario para ejecutar el producto.

## Datos y criterios

Los registros usan `id`, `fecha` (`YYYY-MM-DD`), `cliente`, `producto`, `ciudad`, `cantidad` y `precio` unitario en COP. El valor vendido se calcula como `cantidad × precio`; las ventas con cantidad cero no se consideran efectivas. Las ciudades se normalizan antes de agrupar.

El generador produce fechas del 1 al 30 de septiembre de 2026 y el catálogo de cinco productos definido en `src/generador.js`. Para agregar productos al generador, actualiza el catálogo junto con su precio; el cálculo de combos valida que el producto pertenezca a ese catálogo. Los empates en las recomendaciones mantienen el orden de primera aparición.

## Estructura del proyecto

```text
src/
  datos.js             Muestra original del Día 1
  explorar.js          Inspección inicial de los datos
  analitica.js          Indicadores, agregaciones y clientes recurrentes
  comercial.js          Producto estrella, combo y candidato a cupón
  temporal.js           Mejor ventana de siete días
  generador.js          Catálogo y generación de ventas sintéticas
  reporte.js            Reporte final v1.0; acepta N por process.argv
  reporte_v01.js        Informe previo usado como línea base
  verificar.js          Verificaciones ejecutables
  medir.js              Conteo de operaciones instrumentadas
  medir_recurrentes.js  Medición histórica de clientes recurrentes
  medir_reportes.js     Comparación de tiempo total v0.1 vs v1.0
bitacora.md             Decisiones, trazas, mediciones y cierre de los 12 MiniRetos
RENDIMIENTO.md          Complejidad, mediciones y comparación de versiones
```

## Documentación adicional

- [RENDIMIENTO.md](./RENDIMIENTO.md): complejidad temporal y espacial, metodología y mediciones.
- [bitacora.md](./bitacora.md): análisis de datos, trazas, depuración y resumen de cada MiniReto.
