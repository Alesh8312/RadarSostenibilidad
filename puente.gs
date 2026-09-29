/* ==========================================================================
   RADAR SEMANAL DE SOSTENIBILIDAD — Puente seguro (Google Apps Script)

   Qué hace:
   Recibe los reportes desde la página del Radar y los guarda como Issues en
   el repositorio de DATOS de GitHub. El token de GitHub vive SOLO aquí, en
   "Propiedades del script": nunca en la página ni en GitHub.
   Así cualquier persona del equipo puede registrar, corregir y dar
   seguimiento sin tener cuenta de GitHub, usando el código del equipo.

   Configuración (ver README, sección "Puente"):
   1. Cambie REPO_OWNER y REPO_NAME (abajo) por los del repositorio de datos.
   2. En ⚙ Configuración del proyecto → Propiedades del script, agregue:
        GITHUB_TOKEN   = token de GitHub (empieza por github_pat_)
        CODIGO_EQUIPO  = código que usará el equipo (mínimo 8 caracteres)
   3. Implementar → Nueva implementación → Aplicación web
        Ejecutar como: Yo    ·    Quién tiene acceso: Cualquier usuario
   4. Copie la URL que termina en /exec y péguela en app.js (puenteUrl).

   Si cambia este código después: Implementar → Gestionar implementaciones →
   ✏️ → Versión: "Nueva versión" → Implementar. (La URL no cambia.)
   ========================================================================== */

/* ---------- 1. CONFIGURACIÓN: cambie estas dos líneas ---------- */
const REPO_OWNER = "CAMBIAR_AQUI";   // Ej.: "Alesh8312"
const REPO_NAME = "CAMBIAR_AQUI";    // Ej.: "RadarSostenibilidad-datos"

/* ---------- Valores internos (normalmente no se cambian) ---------- */
const ETIQUETA = "radar-sostenibilidad";
const PREFIJO = "[RADAR]";
const MARCADOR = "radar-sostenibilidad v1";
const ZONA_HORARIA = "America/Bogota";
const LIMITES = { titulo: 256, cuerpo: 60000, persona: 200, seguimiento: 8000 };
const MAX_ESCRITURAS_POR_10_MIN = 60;   // freno contra registros masivos

/* ==========================================================================
   2. ENTRADAS DE LA APLICACIÓN WEB
   ========================================================================== */

/** Abrir la URL en el navegador sirve para comprobar que el puente responde. */
function doGet() {
  return responder({ ok: true, servicio: "Radar puente", version: 1 });
}

/** Todas las acciones de la página llegan aquí. */
function doPost(e) {
  try {
    let datos;
    try {
      datos = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    } catch (errorFormato) {
      throw errorPuente("formato", "Solicitud con formato inválido.");
    }

    verificarCodigo(datos.codigo);

    switch (String(datos.accion || "")) {
      case "verificar":
        return responder({ ok: true });
      case "listar":
        return responder({ ok: true, issues: listarIssues() });
      case "crear":
        controlarEscrituras();
        return responder(Object.assign({ ok: true }, crearIssue(datos)));
      case "editar":
        controlarEscrituras();
        return responder(Object.assign({ ok: true }, editarIssue(datos)));
      case "comentar":
        controlarEscrituras();
        return responder(Object.assign({ ok: true }, comentarIssue(datos)));
      case "estado":
        controlarEscrituras();
        return responder(Object.assign({ ok: true }, cambiarEstado(datos)));
      case "comentarios":
        return responder({ ok: true, comentarios: listarComentarios(datos.numero) });
      default:
        throw errorPuente("accion", "Acción no reconocida.");
    }
  } catch (err) {
    if (!err.tipo) console.error(err && err.stack ? err.stack : err);
    return responder({
      ok: false,
      error: err.tipo || "interno",
      mensaje: err.tipo ? err.message : "Error interno del puente. Revise «Ejecuciones» en Apps Script."
    });
  }
}

/* ==========================================================================
   3. SEGURIDAD
   ========================================================================== */

function verificarCodigo(codigo) {
  const esperado = propiedad("CODIGO_EQUIPO");
  if (esperado.length < 8) {
    throw errorPuente("config", "CODIGO_EQUIPO debe tener al menos 8 caracteres.");
  }
  if (typeof codigo !== "string" || codigo.trim() !== esperado) {
    Utilities.sleep(1200); // frena a quien intente adivinar el código
    throw errorPuente("codigo", "Código del equipo incorrecto.");
  }
}

/** Limita cuántos cambios se pueden hacer cada 10 minutos. */
function controlarEscrituras() {
  const cache = CacheService.getScriptCache();
  const bloqueo = LockService.getScriptLock();
  bloqueo.waitLock(10000);
  try {
    const n = Number(cache.get("escrituras") || 0);
    if (n >= MAX_ESCRITURAS_POR_10_MIN) {
      throw errorPuente("limite", "Se alcanzó el máximo de cambios por 10 minutos. Intente más tarde.");
    }
    cache.put("escrituras", String(n + 1), 600);
  } finally {
    bloqueo.releaseLock();
  }
}

function propiedad(nombre) {
  const valor = PropertiesService.getScriptProperties().getProperty(nombre);
  if (!valor || !String(valor).trim()) {
    throw errorPuente("config", "Falta la propiedad " + nombre + " en la configuración del puente.");
  }
  return String(valor).trim();
}

/* ==========================================================================
   4. ACCIONES
   ========================================================================== */

/** Devuelve todos los reportes del Radar (abiertos y cerrados), con paginación. */
function listarIssues() {
  let url = rutaRepo("/issues?state=all&per_page=100&sort=created&direction=desc");
  const reportes = [];
  let paginas = 0;
  while (url && paginas < 100) {
    const r = github("get", url);
    (r.datos || []).forEach(function (issue) {
      if (!issue.pull_request && esRadar(issue)) reportes.push(resumirIssue(issue));
    });
    url = siguientePagina(encabezado(r.headers, "Link"));
    paginas += 1;
  }
  return reportes;
}

function crearIssue(d) {
  const titulo = textoValido(d.titulo, LIMITES.titulo, "título");
  const cuerpo = textoValido(d.cuerpo, LIMITES.cuerpo, "reporte");
  if (titulo.indexOf(PREFIJO) !== 0 || cuerpo.indexOf(MARCADOR) === -1) {
    throw errorPuente("datos", "El reporte no tiene el formato del Radar.");
  }
  const r = github("post", rutaRepo("/issues"), { title: titulo, body: cuerpo, labels: [ETIQUETA] });
  return { numero: r.datos.number, url: r.datos.html_url };
}

function editarIssue(d) {
  const issue = obtenerIssueRadar(d.numero);
  const titulo = textoValido(d.titulo, LIMITES.titulo, "título");
  const cuerpo = textoValido(d.cuerpo, LIMITES.cuerpo, "reporte");
  const quien = personaValida(d.quien);
  if (titulo.indexOf(PREFIJO) !== 0 || cuerpo.indexOf(MARCADOR) === -1) {
    throw errorPuente("datos", "El reporte no tiene el formato del Radar.");
  }
  github("patch", rutaRepo("/issues/" + issue.number), { title: titulo, body: cuerpo });
  publicarComentario(issue.number, "Corrección", quien, "Se corrigió el reporte desde el Radar.", "radar-evento v1");
  return { numero: issue.number };
}

function comentarIssue(d) {
  const issue = obtenerIssueRadar(d.numero);
  const quien = personaValida(d.quien);
  const texto = textoValido(d.texto, LIMITES.seguimiento, "seguimiento");
  publicarComentario(issue.number, "Seguimiento", quien, texto, "radar-seguimiento v1");
  return { numero: issue.number };
}

function cambiarEstado(d) {
  const issue = obtenerIssueRadar(d.numero);
  const quien = personaValida(d.quien);
  const cerrar = d.estado === "cerrado";
  if (!cerrar && d.estado !== "abierto") throw errorPuente("datos", "Estado no válido.");
  github("patch", rutaRepo("/issues/" + issue.number), {
    state: cerrar ? "closed" : "open",
    state_reason: cerrar ? "completed" : "reopened"
  });
  publicarComentario(
    issue.number,
    cerrar ? "Tema resuelto" : "Tema reabierto",
    quien,
    cerrar ? "El tema se marcó como resuelto desde el Radar." : "El tema se reabrió desde el Radar.",
    "radar-evento v1"
  );
  return { numero: issue.number, estado: cerrar ? "cerrado" : "abierto" };
}

function listarComentarios(numero) {
  const issue = obtenerIssueRadar(numero);
  let url = rutaRepo("/issues/" + issue.number + "/comments?per_page=100");
  const lista = [];
  let paginas = 0;
  while (url && paginas < 10) {
    const r = github("get", url);
    (r.datos || []).forEach(function (c) {
      lista.push({ body: c.body || "", created_at: c.created_at, user: { login: c.user ? c.user.login : "" } });
    });
    url = siguientePagina(encabezado(r.headers, "Link"));
    paginas += 1;
  }
  return lista;
}

/* ==========================================================================
   5. AUXILIARES
   ========================================================================== */

function publicarComentario(numero, titulo, quien, texto, marca) {
  const cuerpo = "**" + titulo + "** · " + quien + " · " + fechaActual() + "\n\n" + texto + "\n\n<!-- " + marca + " -->";
  github("post", rutaRepo("/issues/" + numero + "/comments"), { body: cuerpo });
}

/** Solo se puede actuar sobre reportes del Radar (no sobre otros Issues). */
function obtenerIssueRadar(numero) {
  const n = Number(numero);
  if (!Number.isInteger(n) || n <= 0) throw errorPuente("datos", "Número de registro no válido.");
  const r = github("get", rutaRepo("/issues/" + n));
  if (!r.datos || r.datos.pull_request || !esRadar(r.datos)) {
    throw errorPuente("noencontrado", "El registro no existe o no pertenece al Radar.");
  }
  return r.datos;
}

function esRadar(issue) {
  const etiquetas = (issue.labels || []).map(function (l) { return String(typeof l === "string" ? l : l.name).toLowerCase(); });
  return etiquetas.indexOf(ETIQUETA) !== -1
    || String(issue.title || "").toUpperCase().indexOf(PREFIJO) === 0
    || String(issue.body || "").indexOf(MARCADOR) !== -1;
}

function resumirIssue(i) {
  return {
    number: i.number,
    title: i.title,
    state: i.state,
    body: i.body || "",
    comments: i.comments || 0,
    created_at: i.created_at,
    updated_at: i.updated_at,
    html_url: i.html_url,
    labels: (i.labels || []).map(function (l) { return typeof l === "string" ? l : l.name; }),
    author_association: i.author_association,
    user: { login: i.user ? i.user.login : "" }
  };
}

function textoValido(valor, maximo, campo) {
  const t = typeof valor === "string" ? valor.trim() : "";
  if (!t) throw errorPuente("datos", "Falta el " + campo + ".");
  if (t.length > maximo) throw errorPuente("datos", "El " + campo + " es demasiado largo.");
  return t;
}

function personaValida(valor) {
  return textoValido(valor, LIMITES.persona, "nombre de quien realiza el cambio").replace(/[*\r\n]/g, " ").trim();
}

function fechaActual() {
  return Utilities.formatDate(new Date(), ZONA_HORARIA, "dd/MM/yyyy HH:mm");
}

function rutaRepo(ruta) {
  if (/CAMBIAR_AQUI/.test(REPO_OWNER + REPO_NAME)) {
    throw errorPuente("config", "Falta configurar REPO_OWNER y REPO_NAME en el puente.");
  }
  return "https://api.github.com/repos/" + encodeURIComponent(REPO_OWNER) + "/" + encodeURIComponent(REPO_NAME) + ruta;
}

function github(metodo, url, cuerpo) {
  if (url.indexOf("https://api.github.com/") !== 0) throw errorPuente("interno", "Dirección no permitida.");
  const opciones = {
    method: metodo,
    muteHttpExceptions: true,
    headers: {
      Authorization: "Bearer " + propiedad("GITHUB_TOKEN"),
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  };
  if (cuerpo) {
    opciones.contentType = "application/json";
    opciones.payload = JSON.stringify(cuerpo);
  }
  const respuesta = UrlFetchApp.fetch(url, opciones);
  const codigo = respuesta.getResponseCode();
  const texto = respuesta.getContentText() || "";
  if (codigo >= 200 && codigo < 300) {
    return { datos: texto ? JSON.parse(texto) : null, headers: respuesta.getHeaders() };
  }
  console.error("GitHub respondió " + codigo + ": " + texto.slice(0, 500));
  if (codigo === 401) throw errorPuente("token", "El token de GitHub no es válido o venció. Renueve GITHUB_TOKEN.");
  if (codigo === 403 || codigo === 404) {
    throw errorPuente("permiso", "El token no tiene acceso al repositorio de datos. Revise REPO_OWNER, REPO_NAME y los permisos del token.");
  }
  if (codigo === 410) throw errorPuente("issues", "Los Issues están desactivados en el repositorio de datos.");
  if (codigo === 422) throw errorPuente("datos", "GitHub rechazó los datos del reporte.");
  throw errorPuente("github", "GitHub respondió con un error (" + codigo + "). Intente nuevamente.");
}

function encabezado(headers, nombre) {
  const buscado = nombre.toLowerCase();
  for (const clave in headers) {
    if (clave.toLowerCase() === buscado) return headers[clave];
  }
  return null;
}

function siguientePagina(link) {
  if (!link) return null;
  const partes = String(link).split(",");
  for (let i = 0; i < partes.length; i += 1) {
    const m = partes[i].match(/<([^>]+)>\s*;\s*rel="next"/);
    if (m && m[1].indexOf("https://api.github.com/") === 0) return m[1];
  }
  return null;
}

function errorPuente(tipo, mensaje) {
  const e = new Error(mensaje);
  e.tipo = tipo;
  return e;
}

function responder(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}
