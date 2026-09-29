# RADAR SEMANAL DE SOSTENIBILIDAD

**Temas, alertas y gestión de la Subgerencia de Sostenibilidad**

Aplicación web sencilla (HTML + CSS + JavaScript) publicada gratis con **GitHub Pages**. Cualquier persona del equipo puede **registrar, corregir, dar seguimiento y cerrar temas sin tener cuenta de GitHub**, usando un **código del equipo**.

## Cómo funciona

```
 Página del Radar  ──►  Puente (Google Apps Script)  ──►  Repositorio de DATOS en GitHub
 (GitHub Pages,          · revisa el código del equipo      (privado: los reportes se
  pública)               · guarda el token de GitHub         guardan como Issues)
                           SOLO dentro del puente
```

- La **página** no tiene contraseñas ni tokens: cualquiera puede ver su código sin riesgo.
- El **puente** es un pequeño script gratuito en su cuenta de Google. Es el único que tiene el token de GitHub, guardado en sus "propiedades" y nunca en un archivo.
- Los **reportes** quedan en un repositorio **privado**: no se ven en internet ni en buscadores.

---

## Archivos

```
/
├── index.html                          ← estructura de la página
├── styles.css                          ← diseño
├── app.js                              ← lógica (aquí se pega la URL del puente)
├── README.md                           ← estas instrucciones
├── puente/puente.gs                    ← código del puente (se copia en Google Apps Script)
└── .github/workflows/radar-etiqueta.yml← solo para el modo sin puente (opcional)
```

---

# PARTE A — Publicar la página

### PASO 1 — Crear el repositorio de la página
1. Entre a <https://github.com> → **+** → **New repository**.
2. Nombre: `RadarSostenibilidad` (o el que prefiera).
3. Seleccione **Public**. *(GitHub Pages gratuito solo funciona con repositorios públicos. La página no contiene datos.)*
4. Presione **Create repository**.

### PASO 2 — Subir los archivos
1. Presione **uploading an existing file**.
2. Arrastre `index.html`, `styles.css`, `app.js` y `README.md` (**los archivos, no la carpeta**).
3. Presione **Commit changes**.

### PASO 3 — Activar GitHub Pages
1. **Settings** (Ajustes) → **Pages** (Páginas).
2. **Source**: **Deploy from a branch** (Implementar desde una rama).
3. **Branch**: **main** y **/ (root)** → **Save** (Guardar).
4. Espere 2 minutos y recargue. Aparecerá **Your site is live at** `https://SU_USUARIO.github.io/RadarSostenibilidad/`.

---

# PARTE B — Crear el puente

### P1 — Crear el repositorio de DATOS (privado)
1. En GitHub: **+** → **New repository**.
2. Nombre: `RadarSostenibilidad-datos`
3. Seleccione **Private**.
4. Presione **Create repository**.
5. Cree la etiqueta: abra `https://github.com/SU_USUARIO/RadarSostenibilidad-datos/labels` → **New label** → nombre `radar-sostenibilidad` → **Create label**.

### P2 — Crear el token de GitHub (la "llave" del puente)
1. En GitHub, haga clic en su foto (arriba a la derecha) → **Settings**.
2. Al final del menú izquierdo: **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
3. **Token name**: `Radar puente`.
4. **Expiration**: elija la fecha más lejana que permita (normalmente 1 año). **Anote la fecha**: ese día hay que renovarlo.
5. **Repository access**: **Only select repositories** → elija **RadarSostenibilidad-datos**.
6. **Permissions** → **Repository permissions** → **Issues** → **Read and write**. (No active nada más.)
7. Presione **Generate token** y **copie** el texto que empieza por `github_pat_`.
   ⚠ GitHub lo muestra **una sola vez**. Téngalo a mano para el paso P4. **No lo pegue en ningún archivo, correo ni chat.**

### P3 — Crear el puente en Google Apps Script
1. Entre a <https://script.google.com> con su cuenta de Google → **Nuevo proyecto**.
2. Arriba, cambie "Proyecto sin título" por `Radar puente`.
3. Borre todo el texto de `Código.gs` y pegue el contenido completo de `puente/puente.gs`.
4. Cambie las dos líneas del principio:
   ```js
   const REPO_OWNER = "Alesh8312";
   const REPO_NAME = "RadarSostenibilidad-datos";
   ```
5. Guarde con el ícono del **disquete** 💾 (o Ctrl + S).

### P4 — Guardar el token y el código del equipo (propiedades del script)
1. En el menú izquierdo de Apps Script, presione **⚙ Configuración del proyecto**.
2. Baje hasta **Propiedades de la secuencia de comandos** → **Agregar propiedad de la secuencia de comandos**.
3. Agregue dos propiedades (el nombre, exactamente igual):

   | Propiedad | Valor |
   |---|---|
   | `GITHUB_TOKEN` | el token del paso P2 (`github_pat_…`) |
   | `CODIGO_EQUIPO` | el código que usará el equipo, **mínimo 8 caracteres**, por ejemplo `Radar-Sost-2026` |

4. Presione **Guardar propiedades de la secuencia de comandos**.

### P5 — Publicar el puente como aplicación web
1. Arriba a la derecha: **Implementar** → **Nueva implementación**.
2. Junto a "Seleccionar tipo", presione el engranaje ⚙ → **Aplicación web**.
3. Complete:
   - **Descripción**: `Radar puente`
   - **Ejecutar como**: **Yo** (su correo)
   - **Quién tiene acceso**: **Cualquier usuario**
4. Presione **Implementar** → **Autorizar acceso** → elija su cuenta.
5. Si aparece "Google no ha verificado esta aplicación": presione **Configuración avanzada** → **Ir a Radar puente (no seguro)** → **Permitir**. *(Es normal: el script es suyo y no está publicado en la tienda de Google.)*
6. Copie la **URL de la aplicación web** (termina en `/exec`).
7. Compruebe: pegue esa URL en una pestaña nueva. Debe mostrar `{"ok":true,"servicio":"Radar puente","version":1}`.

### P6 — Conectar la página con el puente
1. En el repositorio de la **página**, abra `app.js` → lápiz ✏️.
2. Busque la línea:
   ```js
   puenteUrl: "PEGAR_AQUI_LA_URL_DEL_PUENTE",
   ```
3. Reemplace el texto entre comillas por la URL del paso P5 (conserve comillas y coma):
   ```js
   puenteUrl: "https://script.google.com/macros/s/AKfy…/exec",
   ```
4. **Commit changes** → **Commit changes**. Espere 2 minutos.

### P7 — Probar
1. Abra la página y recárguela con **Ctrl + F5**.
2. Escriba el **código del equipo**.
3. Registre un tema de prueba → debe decir **✓ Tema registrado correctamente** y el número del registro.
4. En **Consultar reportes**, presione **Ver / editar**: pruebe **Agregar seguimiento**, **Corregir el reporte** y **Marcar como resuelto**.

### P8 — Compartir con el equipo
- Envíe la **dirección de la página** y, **por un canal privado** (por ejemplo, un mensaje directo), el **código del equipo**.
- Nadie necesita cuenta de GitHub ni de Google.
- En computadores compartidos, al entrar deben desmarcar **Recordar en este dispositivo** y, al terminar, presionar **Salir**.

---

## Uso diario

| Quiero… | Dónde |
|---|---|
| Registrar un tema | **Registrar tema** |
| Corregir un tema | **Consultar reportes → Ver / editar → Corregir el reporte** |
| Ampliar o dar seguimiento | **Ver / editar → Agregar seguimiento** |
| Marcar un tema como resuelto (o reabrirlo) | **Ver / editar → Marcar como resuelto** |
| Filtrar y buscar | Panel **Filtros** (se combinan) |
| Ver indicadores y gráficos | **Radar de Gestión** |
| Descargar Excel filtrado | **Descargar informe en Excel** (respeta los filtros) |
| Descargar todo | **Descargar todo** / **Descargar todos los reportes** |
| Imprimir o guardar en PDF | **Radar de Gestión → Imprimir / PDF** |

Cada corrección, seguimiento o cierre queda guardado en GitHub con el **nombre de quien lo hizo y la fecha**.

---

## Mantenimiento

- **Cambiar el código del equipo:** Apps Script → ⚙ Configuración del proyecto → edite `CODIGO_EQUIPO` → guardar. Todos deberán escribir el nuevo código.
- **Renovar el token (antes de que venza):** cree uno nuevo (paso P2) y reemplace el valor de `GITHUB_TOKEN` (paso P4). No hay que cambiar nada más.
- **Si modifica `puente.gs`:** **Implementar → Gestionar implementaciones → ✏️ → Versión: Nueva versión → Implementar.** La URL no cambia.
- **Cambiar listas** (divisiones, personas, activos, instancias): al inicio de `app.js`, sección **2. LISTAS DE OPCIONES**. Copie una línea existente y conserve comillas y comas.
- **Nota:** *Iguaran Solano, Andres* no tenía correo en la lista original; agréguelo en su línea.

---

## Seguridad: qué protege y qué no

**Protege:**
- El token de GitHub nunca está en la página ni en GitHub; solo en las propiedades del puente.
- El token solo puede tocar los Issues de **un** repositorio (el de datos) y vence.
- Los reportes están en un repositorio **privado**: no aparecen en internet ni en buscadores.
- Sin el código del equipo, el puente no entrega ni guarda nada. Cada intento con un código incorrecto se frena.
- El puente solo acepta reportes con el formato del Radar y limita a 60 cambios cada 10 minutos.
- La página muestra todo como texto: código malicioso escrito en un reporte no se ejecuta.

**No protege (tenga en cuenta):**
- Quien tenga el código del equipo puede ver y cambiar todos los reportes. **Si el código circula fuera del equipo, cámbielo.**
- La página es pública: su código, **incluida la lista de nombres y correos** de `app.js`, es visible para cualquiera.
- En GitHub, todos los registros aparecen creados por el dueño del token; el nombre de quien reporta va dentro de cada reporte.
- Esta solución usa servicios personales gratuitos (GitHub y Google). **Si Enel tiene reglas sobre información de trabajo en cuentas personales, confírmelo con ICT antes de registrar datos sensibles.**

---

## Problemas frecuentes

| Problema | Solución |
|---|---|
| "La aplicación aún no está conectada" | Falta la URL del puente en `app.js` (P6). Recargue con Ctrl + F5. |
| "No fue posible conectarse con el puente" | Revise la URL (debe terminar en `/exec`) y que en P5 haya elegido **Cualquier usuario**. |
| "Código del equipo incorrecto" | Revise mayúsculas y espacios. El código vive en `CODIGO_EQUIPO` (P4). |
| "Falta la propiedad GITHUB_TOKEN / CODIGO_EQUIPO" | Revise P4 (el nombre debe ser exacto). |
| "El token no tiene acceso al repositorio de datos" | Revise `REPO_OWNER` y `REPO_NAME` en el puente y los permisos del token (P2: Issues → Read and write). |
| "El token de GitHub no es válido o venció" | Renueve el token (ver Mantenimiento). |
| "GitHub rechazó los datos" | Cree la etiqueta `radar-sostenibilidad` en el repositorio de datos (P1, punto 5). |
| La primera carga del día tarda | Es normal: el puente "despierta" en unos segundos. |
| Cambié `app.js` y no veo el cambio | GitHub Pages tarda 1–3 minutos. Recargue con Ctrl + F5. |
| No aparecen gráficos o no descarga Excel | La red puede estar bloqueando `cdn.jsdelivr.net` o `cdn.sheetjs.com`. |

Para ver errores detallados del puente: Apps Script → menú izquierdo **Ejecuciones**.

---

## Modo demostración (datos ficticios)

En `app.js` cambie `const DEMO_MODE = false;` por `const DEMO_MODE = true;`. Verá 12 temas ficticios y podrá probar todo (registrar, corregir, seguimiento, filtros, gráficos, Excel) sin conectarse a nada. Lo que haga en este modo desaparece al recargar. Vuelva a `false` al terminar.

---

## Qué guarda cada reporte

Título: `[RADAR] ACTIVO / BL - resumen del tema` (la primera línea del tema).

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

Los seguimientos y cambios se guardan como comentarios del Issue, con el formato `**Seguimiento** · Nombre · DD/MM/AAAA HH:MM`.

---

## Anexo — Modo sin puente (cada persona con cuenta de GitHub)

Si prefiere no usar el puente: en `app.js` ponga `dataSource: "github"` y complete `owner` y `repo` con el repositorio **público** donde se guardarán los Issues. Al registrar, la aplicación abre GitHub con el reporte prellenado y la persona presiona **Create** (necesita cuenta de GitHub y sesión iniciada). En ese modo, suba también `.github/workflows/radar-etiqueta.yml`, que pone la etiqueta automáticamente. Los reportes quedan **públicos**.
