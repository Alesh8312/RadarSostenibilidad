# RADAR SEMANAL DE SOSTENIBILIDAD

**Temas, alertas y gestión de la Subgerencia de Sostenibilidad**

Aplicación web sencilla (HTML + CSS + JavaScript) que se publica gratis con **GitHub Pages** y guarda cada tema reportado como un **Issue de GitHub**.

- **Registrar tema:** formulario tipo *Forms*. Al presionar **Registrar tema**, se abre GitHub con el reporte ya escrito; la persona solo presiona **Create**.
- **Consultar reportes:** tabla con filtros combinables, búsqueda y botón **Ver / editar**.
- **Radar de Gestión:** indicadores, gráficos, informe en pantalla y descarga en Excel.

> ⚠ **Antes de empezar, lea la sección [Seguridad: lo que debe saber](#seguridad-lo-que-debe-saber).** Con esta configuración, **todo lo que se registre queda público en internet.**

---

## Archivos

```
/
├── index.html                          ← estructura de la página
├── styles.css                          ← diseño
├── app.js                              ← lógica (aquí se configura owner y repo)
├── README.md                           ← estas instrucciones
└── .github/workflows/radar-etiqueta.yml ← pone la etiqueta automáticamente (recomendado)
```

---

## Instalación paso a paso

Necesita una cuenta gratuita de GitHub. Si no la tiene, créela en <https://github.com/signup>.

### PASO 1 — Crear el repositorio

1. Entre a <https://github.com> e inicie sesión.
2. Arriba a la derecha presione **+** → **New repository**.
3. En **Repository name** escriba: `radar-sostenibilidad`
4. Seleccione **Public** (ver la sección de seguridad).
5. No marque ninguna otra opción.
6. Presione **Create repository**.

### PASO 2 — Subir los cuatro archivos

1. En la página del repositorio recién creado, presione el enlace **uploading an existing file**
   (o **Add file → Upload files**).
2. Arrastre a la ventana: `index.html`, `styles.css`, `app.js` y `README.md`.
3. Abajo presione **Commit changes**.

### PASO 3 — Cambiar `owner` y `repo`

1. En el repositorio, haga clic en **app.js**.
2. Presione el ícono del **lápiz** (✏️ *Edit this file*), arriba a la derecha del archivo.
3. Busque estas líneas (están casi al principio):

   ```js
   owner: "CAMBIAR_AQUI",
   repo: "CAMBIAR_AQUI",
   ```

4. Cámbielas por los datos de su repositorio. Si la dirección de su repositorio es
   `https://github.com/JBOGLOP/radar-sostenibilidad`, entonces:

   ```js
   owner: "JBOGLOP",
   repo: "radar-sostenibilidad",
   ```

   (Conserve las comillas y la coma final.)
5. Presione **Commit changes…** y luego otra vez **Commit changes**.

### PASO 4 — Crear el label `radar-sostenibilidad`

1. En el repositorio, abra la pestaña **Issues**.
   *(Si no la ve, haga primero el PASO 5.)*
2. Presione **Labels** (junto al buscador). También puede ir directo a
   `https://github.com/SU_USUARIO/radar-sostenibilidad/labels`.
3. Presione **New label**.
4. En **Label name** escriba exactamente: `radar-sostenibilidad`
5. Elija un color sobrio y presione **Create label**.

#### PASO 4B — Etiquetado automático (recomendado)

GitHub **no permite** que una persona que no sea colaboradora del repositorio ponga etiquetas. Por eso la aplicación no envía la etiqueta en el enlace (si lo hiciera, esas personas verían un error *404*). Este pequeño archivo hace que GitHub ponga la etiqueta sola:

1. En el repositorio presione **Add file → Create new file**.
2. En el nombre del archivo escriba exactamente: `.github/workflows/radar-etiqueta.yml`
   (al escribir cada `/` GitHub crea la carpeta).
3. Copie y pegue el contenido del archivo `radar-etiqueta.yml` que recibió.
4. Presione **Commit changes…** → **Commit changes**.

No usa contraseñas ni secretos: GitHub le da un permiso temporal en cada ejecución. Aunque no lo instale, la aplicación reconoce los reportes igual (por el título `[RADAR]` y una marca oculta al final del texto).

### PASO 5 — Activar Issues

1. En el repositorio presione **Settings** (⚙, arriba a la derecha).
2. En **General**, baje hasta **Features**.
3. Verifique que la casilla **Issues** esté marcada. (En repositorios públicos normalmente ya lo está.)

#### PASO 5B — Permisos de edición para el equipo

- **Cualquier persona con cuenta de GitHub** puede registrar temas y **editar los que ella misma creó**.
- Para que una persona pueda **editar cualquier registro** (incluidos los de otros):
  **Settings → Collaborators → Add people** → escriba su usuario o correo de GitHub → **Add**.
  La persona debe aceptar la invitación que le llega por correo. Es gratis y no hay límite de colaboradores.
  *(Si el repositorio pertenece a una organización, en lugar de "Collaborators" verá "Collaborators and teams": asigne el rol **Write**.)*

### PASO 6 — Activar GitHub Pages

1. En el repositorio presione **Settings**.
2. En el menú de la izquierda presione **Pages** (**Settings → Pages**).
3. En **Build and deployment → Source** seleccione **Deploy from a branch**.
4. En **Branch** seleccione **main** y la carpeta **/ (root)**.
5. Presione **Save**.
6. Espere 1 a 3 minutos y recargue la página de Settings → Pages. Arriba aparecerá:
   **Your site is live at** `https://SU_USUARIO.github.io/radar-sostenibilidad/`

### PASO 7 — Abrir la aplicación

Abra la dirección del paso anterior. Esa es la dirección que compartirá con el equipo (puede guardarla como favorito o convertirla en acceso directo en el celular).

### PASO 8 — Registrar un tema de prueba

1. Presione **+ Registrar nuevo tema**.
2. Complete todos los campos. En **Tema y descripción**, la **primera línea** se usa como título.
3. Presione **Registrar tema**.
4. Se abre GitHub en una pestaña nueva con todo escrito. Si GitHub pide iniciar sesión, hágalo.
5. Presione **Create** (en algunas versiones de GitHub el botón dice **Submit new issue**).
6. Vuelva a la aplicación y presione **Abrir el registro creado** para comprobarlo.

### PASO 9 — Consultar el reporte

1. Vaya a **Consultar reportes**. Si no aparece el tema recién creado, presione **↻ Actualizar datos**.
2. Pruebe los filtros: por ejemplo **Activo / BL = GUAVIO** y **Periodo rápido = Mes actual**.
3. Presione **Ver / editar** para abrir el registro original en GitHub.

### PASO 10 — Descargar Excel

1. En **Consultar reportes** o en **Radar de Gestión**, presione **Descargar informe en Excel**.
   El archivo `Radar_Sostenibilidad_AAAA-MM-DD.xlsx` contiene **exactamente** los reportes que cumplen los filtros.
2. **Descargar todo** / **Descargar todos los reportes** trae todo lo registrado, sin filtros.
3. El Excel incluye la hoja **Reportes** (con autofiltro) y la hoja **Criterios** (qué filtros se usaron).

---

## Quién puede diligenciar y editar

| Acción | ¿Quién puede? |
|---|---|
| Abrir la página y diligenciar el formulario | **Cualquier persona**, sin cuenta |
| Guardar el reporte (presionar *Create* en GitHub) | Cualquier persona **con cuenta gratuita de GitHub** y sesión iniciada |
| Editar, ampliar o cerrar **su propio** reporte | Quien lo creó |
| Editar **cualquier** reporte | Colaboradores del repositorio (PASO 5B) |
| Comentar un reporte | Cualquier persona con cuenta de GitHub |
| Consultar, ver el Radar y descargar Excel | Cualquier persona (el repositorio es público) |

**No es posible** que alguien sin cuenta de GitHub guarde o edite registros de forma segura desde una página estática: haría falta escribir una contraseña o *token* dentro del código, y cualquiera podría copiarlo. Por eso esta herramienta no lo hace.

### Cómo editar un registro

1. **Consultar reportes → Ver / editar** (se abre el registro en GitHub).
2. **Corregir o actualizar:** en la descripción presione **···** → **Edit**. Cambie solo el texto debajo de cada título (`## Fecha`, `## División`, etc.). **No borre los títulos ni la línea oculta del final.** Presione **Save**.
3. **Ampliar:** escriba un comentario abajo y presione **Comment**.
4. **Historial:** presione la palabra **edited** junto a la descripción.
5. **Tema resuelto:** presione **Close issue**; aparecerá como *Cerrado* en el Radar.

---

## Seguridad: lo que debe saber

**Resumen honesto:** esta versión está pensada para información **no confidencial** o para pruebas.

1. **GitHub Pages es público.** Cualquiera que tenga la dirección puede abrir la página. Solo GitHub Enterprise Cloud permite restringir el acceso a una página de Pages.
2. **El código es visible.** Cualquiera puede ver `app.js`, **incluida la lista de nombres y correos del equipo**.
3. **Los Issues de un repositorio público son públicos**: cualquiera puede leerlos y los buscadores pueden indexarlos. **No registre información confidencial.**
4. **No hay tokens ni contraseñas en el código.** Crear Issues directamente desde la página exigiría un token visible para todos; por eso la aplicación abre GitHub con el reporte prellenado y la persona confirma con su propia cuenta.
5. **Repositorio privado:** la página **no puede leer** Issues privados sin un token, así que la consulta, el Radar y el Excel no funcionarían. Además, publicar Pages desde un repositorio privado requiere un plan de pago, y la página seguiría siendo pública.
6. **Límite de consultas:** sin autenticación, GitHub permite 60 consultas por hora por red. En una oficina toda la red comparte ese límite. La aplicación guarda los datos 5 minutos para ahorrar consultas (`cacheMinutes` en `app.js`).
7. **Registros ajenos:** en un repositorio público, cualquier cuenta de GitHub podría crear un Issue con `[RADAR]`. Si ocurre, puede borrarlo (el dueño ve **Delete issue** al final de la columna derecha del Issue) o cambiar en `app.js` `onlyCollaborators: true` para contar solo los reportes de colaboradores.
8. **Protección contra código malicioso:** la aplicación muestra el texto de los reportes siempre como texto (nunca lo ejecuta) y `index.html` incluye una política que solo permite cargar las librerías de gráficos y Excel.

### Para producción con información confidencial

Se necesita un componente que guarde la credencial **fuera del navegador**. Opciones:

- **Un servicio intermedio pequeño** (por ejemplo una función *serverless* en Azure Functions o Cloudflare Workers) que use una **GitHub App** para crear y leer Issues de un repositorio privado, y que exija el inicio de sesión corporativo.
- **GitHub Enterprise Cloud** con Pages de acceso restringido, más el servicio intermedio para la API.
- **Herramientas corporativas ya aprobadas por ICT** que cumplan la misma función.

El código ya está preparado: en `app.js`, sección **6. FUENTES DE DATOS**, se agrega una fuente `proxy` que llame al servicio intermedio y se cambia `dataSource: "proxy"`. El formulario, la tabla, los gráficos y el Excel no cambian.

---

## Modo demostración (datos ficticios)

Para probar todo **sin tocar GitHub**:

1. Edite `app.js` y cambie `const DEMO_MODE = false;` por `const DEMO_MODE = true;`
2. Guarde (Commit) y abra la aplicación: aparece la etiqueta **Modo demostración** y 12 temas ficticios.
3. Puede probar filtros, gráficos, informe y Excel. Lo que registre en este modo **no se envía a GitHub** y desaparece al recargar.
4. Al terminar, vuelva a poner `false`. Los datos ficticios nunca se mezclan con los reales.

---

## Cambiar las listas (divisiones, personas, activos, instancias)

Todo está al inicio de `app.js`, sección **2. LISTAS DE OPCIONES**:

```js
const DIVISIONES = [ "Solares + BEQUIM", "Territorios Compartidos", ... ];
const PERSONAS = [ { nombre: "Apellido, Nombre", email: "correo@enel.com" }, ... ];
const ACTIVOS = [ "GUAVIO", "CRB", ... ];
const INSTANCIAS = [ "Comité Gerentes", ... ];
```

- Para agregar una opción, copie una línea existente, cámbiela y conserve comillas y comas.
- Si renombra una opción, los reportes antiguos conservan el nombre anterior (siguen apareciendo en los filtros).
- **Nota:** *Iguaran Solano, Andres* no tenía correo en la lista original; agréguelo en su línea.

---

## Problemas frecuentes

| Problema | Solución |
|---|---|
| Al presionar *Registrar tema* GitHub muestra **404** | Verifique `owner` y `repo` (PASO 3) y que Issues esté activo (PASO 5). Si cambió `labelInUrl` a `true`, vuelva a `false`. |
| El formulario de GitHub aparece vacío después de iniciar sesión | Vuelva a la aplicación y presione **Abrir GitHub nuevamente** en la confirmación. Iniciar sesión en GitHub antes evita esto. |
| El navegador bloqueó la pestaña de GitHub | Use el enlace **Abrir GitHub nuevamente** o permita ventanas emergentes para la página. |
| El reporte es muy largo | La aplicación le pedirá **copiar y pegar** el contenido en GitHub (3 pasos guiados). |
| No aparece un tema recién creado | Presione **↻ Actualizar datos**. |
| *No fue posible cargar los reportes* | Revise la conexión. Si dice "límite de consultas", espere los minutos indicados. |
| Cambié `app.js` y no veo el cambio | GitHub Pages tarda 1–3 minutos. Recargue con **Ctrl + F5**. |
| No aparecen los gráficos o no descarga el Excel | La red puede estar bloqueando `cdn.jsdelivr.net` o `cdn.sheetjs.com`. Pruebe desde otra red o consulte con soporte. |

---

## Qué guarda cada reporte

Título: `[RADAR] ACTIVO / BL - resumen del tema`

Cuerpo (estructura fija que la aplicación interpreta):

```
## Fecha
29/09/2026

## División
Territorios Compartidos

## Quién reporta
Sanchez Hernandez, Nubia Alexandra

## Email
nubia.sanchez@enel.com

## Activo / BL
GUAVIO

## Instancia
- Comité Gerentes

## Tema y descripción
Texto completo del reporte.

<!-- radar-sostenibilidad v1 id:RAD-20260929-1A2B3C4D · No borre esta línea: identifica el reporte en el Radar. -->
```

La última línea no se ve en GitHub (es un comentario oculto); sirve para reconocer el reporte y para el botón **Abrir el registro creado**.
