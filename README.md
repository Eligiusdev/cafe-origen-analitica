# Café Origen — Analítica de Ventas

Proyecto de exploración, auditoría de calidad de datos y análisis de historial de ventas para **Café Origen**.

## Estructura del proyecto

- `src/datos.js`: Muestra original de 12 registros de ventas exportada como arreglo de objetos.
- `src/explorar.js`: Script de inspección inicial (conteo, extremos, acceso por índice y visualización tabular).
- `src/analitica.js`: Módulo para funciones de limpieza y procesamiento analítico.
- `src/generador.js`: Genera historiales de ventas aleatorios con el esquema del proyecto.
- `src/medir.js`: Compara el conteo de operaciones de funciones lineales y constantes.
- `src/medir_recurrentes.js`: Mide el tiempo del reporte de clientes recurrentes.
- `bitacora.md`: Diccionario de datos y decisiones sobre los casos borde encontrados.

## Ejecución

Para ejecutar el script de exploración en la terminal:

```bash
node src/explorar.js
```

Para generar historiales y medir el crecimiento de las operaciones:

```bash
node src/medir.js
```

Para medir el tiempo del reporte de clientes recurrentes:

```bash
node src/medir_recurrentes.js
```