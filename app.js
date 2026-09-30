/* ==========================================================================
   RADAR SEMANAL DE SOSTENIBILIDAD — app.js
   Aplicación estática (HTML + CSS + JavaScript) para GitHub Pages.

   Cómo funciona, en pocas palabras (fuente "puente", la recomendada):
   • La página NO guarda contraseñas ni tokens. Envía cada reporte a un
     "puente" (Google Apps Script) protegido con el código del equipo.
   • El puente guarda el reporte como Issue en el repositorio de datos de
     GitHub (puede ser privado) usando un token que solo existe en el puente.
   • Cualquier persona con el código del equipo puede registrar, corregir,
     dar seguimiento y cerrar temas sin tener cuenta de GitHub.
   • CONSULTAR y RADAR: la tabla, los indicadores, los gráficos, el informe
     y el Excel se construyen con los reportes que entrega el puente.

   Otras fuentes: "github" (sin puente: abre GitHub con el reporte
   prellenado; exige cuenta de GitHub) y DEMO_MODE (datos ficticios).

   Índice del archivo:
     1. Configuración (lo que normalmente se cambia)
     2. Listas de opciones (divisiones, personas, activos, instancias)
     3. Datos de demostración
     4. Constantes y estado interno
     5. Utilidades (texto, fechas, almacenamiento, mensajes)
     6. Fuentes de datos (GitHub y Demo)
     7. Lectura de GitHub (API, paginación, errores)
     8. Interpretación de Issues
     9. Carga de reportes
    10. Navegación entre secciones
    11. Formulario: inicialización y lista con buscador
    12. Formulario: validación, armado del Issue y envío
    13. Confirmación y "abrir el registro creado"
    14. Filtros y búsqueda
    15. Tabla de reportes
    16. Indicadores (Radar de Gestión)
    17. Gráficos
    18. Informe de temas reportados
    19. Exportar a Excel
    20. Diálogos
    21. Arranque de la aplicación
   ========================================================================== */
"use strict";

/* ==========================================================================
   1. CONFIGURACIÓN — README, "Conectar la página con el puente"
   ========================================================================== */
