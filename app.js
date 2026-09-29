/* ==========================================================================
   RADAR SEMANAL DE SOSTENIBILIDAD — app.js
   Aplicación estática (HTML + CSS + JavaScript) para GitHub Pages.

   Cómo funciona, en pocas palabras:
   • REGISTRAR: la persona diligencia el formulario; la aplicación arma el
     reporte y abre GitHub con el título y el cuerpo ya escritos. La persona
     solo presiona "Create". (No hay tokens ni contraseñas en este archivo.)
   • CONSULTAR y RADAR: la aplicación lee los Issues del repositorio con la
     API pública de GitHub, interpreta sus secciones y construye la tabla,
     los indicadores, los gráficos, el informe y el Excel.

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
   1. CONFIGURACIÓN — cambie aquí owner y repo (README, paso 3)
   ========================================================================== */

/**
 * DEMO_MODE = true  → carga 12 registros ficticios para probar todo
 *                     (no consulta ni escribe nada en GitHub).
 * DEMO_MODE = false → trabaja con el repositorio real definido abajo.
 */
const DEMO_MODE = false;

const CONFIG = {
  owner: "Alesh8312",          // Usuario u organización dueña del repositorio. Ej.: "JBOGLOP"
  repo: "RadarSostenibilidad",           // Nombre del repositorio. Ej.: "radar-sostenibilidad"
  label: "radar-sostenibilidad",  // Etiqueta de los reportes del Radar
  titlePrefix: "[RADAR]",         // Inicio del título de cada reporte

  // ¿Enviar la etiqueta dentro del enlace de GitHub?
  // GitHub muestra un error "404" a quien NO sea colaborador del repositorio
  // cuando el enlace incluye etiquetas. Déjelo en false para que CUALQUIER
  // persona pueda registrar temas. La etiqueta se agrega automáticamente con
  // el archivo .github/workflows/radar-etiqueta.yml (README, paso 4).
  labelInUrl: false,

  // true = solo se cuentan reportes creados por el dueño o por colaboradores
  // del repositorio (protege el Radar si personas ajenas crean registros en
  // un repositorio público). false = se aceptan reportes de cualquier cuenta.
  onlyCollaborators: false,

  cacheMinutes: 5,            // Minutos que se reutilizan los datos antes de volver a consultar GitHub
  maxUrlLength: 7000,         // Si el reporte es más largo, se usa "copiar y pegar" en GitHub
  titleSummaryMaxLength: 80,  // Longitud máxima del resumen del tema en el título
  topPeopleInChart: 10,       // Personas que muestra el gráfico "Reportes por persona"
  requestTimeoutMs: 20000,    // Tiempo máximo de espera de cada consulta a GitHub

  // Fuente de datos. "github" = repositorio público vía API de GitHub.
  // Para producción con información confidencial vea la sección 6 y el README.
  dataSource: "github"
};

/* ==========================================================================
   2. LISTAS DE OPCIONES — edítelas libremente
   ========================================================================== */

const DIVISIONES = [
  "Solares + BEQUIM",
  "Territorios Compartidos",
  "Planning",
  "Subgerencia",
  "Otros"
];

/** Cada persona tiene nombre y correo por separado (se usan así en el Excel). */
const PERSONAS = [
  { nombre: "Amaya Galliano, Juliana", email: "juliana.amaya@enel.com" },
  { nombre: "Arcila Cuadrado, Natalia (ONB)", email: "natalia.arcilacuadrado@enel.com" },
  { nombre: "Ariza Arias, Diego Felipe", email: "diego.ariza@enel.com" },
  { nombre: "Bolivar Vega, Monica Johana", email: "monica.bolivar@enel.com" },
  { nombre: "Bonilla Tiaffi, Carolina", email: "carolina.bonillat@enel.com" },
  { nombre: "Castillo Orjuela, Monica Cristina", email: "monica.castillo@enel.com" },
  { nombre: "Castro Ortiz, Cindy (EGP&TGX CAM)", email: "cindy.castro@enel.com" },
  { nombre: "Chaves Saenz, Andres Esteban", email: "andres.chaves@enel.com" },
  { nombre: "Cristian Cardona Ospina (Internship)", email: "cristian.cardona4@enel.com" },
  { nombre: "Diana Plazas Gutierrez (Internship)", email: "diana.plazas@enel.com" },
  { nombre: "Diaz Garcia, Estuardo (EGP&TGX CAM)", email: "estuardo.diaz@enel.com" },
  { nombre: "Granados Castillo, Monica", email: "monica.granados@enel.com" },
  { nombre: "Iguaran Solano, Andres", email: "" }, // La lista original no trae correo ("Enel Colombia"). Agréguelo aquí.
  { nombre: "Jacobo Trujillo Molina (Internship)", email: "jacobo.trujillomolina@enel.com" },
  { nombre: "Marin Guerrero, Michael Andres", email: "michael.marin@enel.com" },
  { nombre: "Martinez Caballero, Tanaida (EGP&TGX CAM)", email: "tanaida.martinez@enel.com" },
  { nombre: "Moreno Nieto, Yudy Lorena", email: "yudy.moreno@enel.com" },
  { nombre: "Parra Arenas, Fabian (ONB)", email: "fabian.parra@enel.com" },
  { nombre: "Pedraza Galeano, Adriana", email: "adriana.pedraza@enel.com" },
  { nombre: "Ramirez Velez, Juan Cristobal", email: "juan.ramirezv@enel.com" },
  { nombre: "Rincon Vega, Carlos David", email: "carlos.rincon@enel.com" },
  { nombre: "Rodriguez Lenis, Suly Hasleidy", email: "suly.rodriguez@enel.com" },
  { nombre: "Rojas Arias, Liliam", email: "liliam.rojas@enel.com" },
  { nombre: "Rubiano Mora, John Wilson", email: "john.rubiano@enel.com" },
  { nombre: "Sanchez Hernandez, Nubia Alexandra", email: "nubia.sanchez@enel.com" },
  { nombre: "Sanchez Nieto, Julian David", email: "julian.sanchez@enel.com" },
  { nombre: "Uribe Mariño, Monica", email: "monica.uribe@enel.com" },
  { nombre: "Velez Barrera, Maria Amelia", email: "maria.velez@enel.com" },
  { nombre: "Zuñiga Hernandez, Maria", email: "maria.zuniga@enel.com" }
];

const ACTIVOS = [
  "GUAVIO",
  "CRB",
  "TERMOZIPA",
  "SOLARES",
  "BEQUIM",
  "GRIDS",
  "TRANSVERSAL"
];

const INSTANCIAS = [
  "Comité Gerentes",
  "Temas Semanales de División para Subgerencia",
  "Temas EGP – Reunión Antonio"
];

/* ==========================================================================
   3. DATOS DE DEMOSTRACIÓN (solo se usan si DEMO_MODE = true)
   Las personas y los temas son ficticios. "dias" = hace cuántos días se reportó,
   para que siempre haya datos del mes actual al probar.
   ========================================================================== */
const DEMO_REPORTES = [
  { dias: 1, division: "Territorios Compartidos", persona: "Pérez Gómez, Laura (DEMO)", email: "laura.demo@ejemplo.com", activo: "GUAVIO", instancias: ["Comité Gerentes"], estado: "abierto", comentarios: 2,
    tema: "Seguimiento compromisos con el municipio\nSe revisaron los compromisos del acta con la administración municipal. Quedan pendientes dos obras de infraestructura comunitaria.\nAlerta: la comunidad solicita una reunión antes de fin de mes." },
  { dias: 4, division: "Solares + BEQUIM", persona: "Rojas Díaz, Andrés (DEMO)", email: "andres.demo@ejemplo.com", activo: "SOLARES", instancias: ["Temas Semanales de División para Subgerencia"], estado: "abierto", comentarios: 0,
    tema: "Avance de consulta con comunidad vecina al parque solar\nSe realizó la segunda mesa informativa con buena asistencia. Se acordó entregar el cronograma de contratación de mano de obra local." },
  { dias: 6, division: "Territorios Compartidos", persona: "Castro León, Marta (DEMO)", email: "marta.demo@ejemplo.com", activo: "CRB", instancias: ["Comité Gerentes", "Temas EGP – Reunión Antonio"], estado: "abierto", comentarios: 1,
    tema: "Bloqueo de vía de acceso por parte de transportadores\nAlerta operativa: bloqueo parcial durante dos días. Se instaló mesa de diálogo con la alcaldía y la Personería. Requiere seguimiento de compromisos." },
  { dias: 9, division: "Planning", persona: "Suárez Pinto, Felipe (DEMO)", email: "felipe.demo@ejemplo.com", activo: "TRANSVERSAL", instancias: ["Temas Semanales de División para Subgerencia"], estado: "cerrado", comentarios: 0,
    tema: "Actualización de indicadores de valor compartido\nSe consolidaron los indicadores del trimestre. Decisión: unificar la línea base de empleo local para todos los activos." },
  { dias: 13, division: "Subgerencia", persona: "Vargas Ruiz, Camila (DEMO)", email: "camila.demo@ejemplo.com", activo: "TRANSVERSAL", instancias: ["Comité Gerentes"], estado: "abierto", comentarios: 3,
    tema: "Preparación del informe de sostenibilidad anual\nDefinición de responsables por capítulo y fechas de entrega. Riesgo: retraso en la información de proveedores." },
  { dias: 20, division: "Territorios Compartidos", persona: "Pérez Gómez, Laura (DEMO)", email: "laura.demo@ejemplo.com", activo: "GUAVIO", instancias: ["Temas EGP – Reunión Antonio"], estado: "cerrado", comentarios: 0,
    tema: "Entrega de dotación a escuelas rurales\nSe completó la entrega en cinco sedes educativas. Tema cerrado con acta de recibo." },
  { dias: 27, division: "Solares + BEQUIM", persona: "Rojas Díaz, Andrés (DEMO)", email: "andres.demo@ejemplo.com", activo: "BEQUIM", instancias: ["Comité Gerentes"], estado: "abierto", comentarios: 0,
    tema: "Solicitud de información por parte de veeduría ciudadana\nSe recibió derecho de petición sobre empleo local. Plazo de respuesta: 15 días hábiles." },
  { dias: 35, division: "Territorios Compartidos", persona: "Castro León, Marta (DEMO)", email: "marta.demo@ejemplo.com", activo: "TERMOZIPA", instancias: ["Temas Semanales de División para Subgerencia"], estado: "abierto", comentarios: 1,
    tema: "Percepción de la comunidad sobre ruido nocturno\nSe recibieron tres quejas. Se programó medición con autoridad ambiental y visita a la junta de acción comunal." },
  { dias: 48, division: "Planning", persona: "Suárez Pinto, Felipe (DEMO)", email: "felipe.demo@ejemplo.com", activo: "GRIDS", instancias: ["Temas EGP – Reunión Antonio"], estado: "cerrado", comentarios: 0,
    tema: "Priorización de proyectos de electrificación rural\nSe presentaron los criterios de priorización. Decisión: incluir tres veredas adicionales en la siguiente fase." },
  { dias: 62, division: "Territorios Compartidos", persona: "Pérez Gómez, Laura (DEMO)", email: "laura.demo@ejemplo.com", activo: "GUAVIO", instancias: ["Comité Gerentes", "Temas Semanales de División para Subgerencia"], estado: "cerrado", comentarios: 4,
    tema: "Acuerdo de inversión social con el municipio\nSe firmó el acuerdo marco. Seguimiento trimestral en Comité Gerentes." },
  { dias: 80, division: "Otros", persona: "Vargas Ruiz, Camila (DEMO)", email: "camila.demo@ejemplo.com", activo: "CRB", instancias: ["Temas EGP – Reunión Antonio"], estado: "abierto", comentarios: 0,
    tema: "Alianza con universidad regional para monitoreo de biodiversidad\nSe revisó el borrador del convenio. Pendiente concepto jurídico." },
  { dias: 105, division: "Solares + BEQUIM", persona: "Rojas Díaz, Andrés (DEMO)", email: "andres.demo@ejemplo.com", activo: "SOLARES", instancias: ["Comité Gerentes"], estado: "cerrado", comentarios: 0,
    tema: "Cierre de compromisos del proceso de licenciamiento\nTodos los compromisos sociales de la fase de construcción quedaron cumplidos y documentados." }
];

/* ==========================================================================
   4. CONSTANTES Y ESTADO INTERNO (normalmente no se modifican)
   ========================================================================== */

/** Marca oculta que se agrega al final de cada reporte para reconocerlo. */
const MARCADOR = "radar-sostenibilidad v1";

/** Títulos de las secciones del cuerpo del Issue (estructura fija). */
const ENCABEZADOS = {
  fecha: "Fecha",
  division: "División",
  persona: "Quién reporta",
  email: "Email",
  activo: "Activo / BL",
  instancias: "Instancia",
  tema: "Tema y descripción"
};

/** Variantes aceptadas al leer (por si alguien edita un título en GitHub). */
const ALIAS_ENCABEZADOS = {
  fecha: "fecha",
  division: "division",
  quienreporta: "persona",
  reporta: "persona",
  email: "email",
  correo: "email",
  correoelectronico: "email",
  activobl: "activo",
  activo: "activo",
  bl: "activo",
  instancia: "instancias",
  instancias: "instancias",
  temaydescripcion: "tema",
  tema: "tema",
  descripcion: "tema"
};

const VISTAS = ["inicio", "registrar", "consultar", "radar"];
const NOMBRES_VISTAS = { inicio: "Inicio", registrar: "Registrar tema", consultar: "Consultar reportes", radar: "Radar de Gestión" };
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const COLOR_PRINCIPAL = "#0b3d5c";
const COLOR_ACENTO = "#0f8a7e";
const PALETA = ["#0b3d5c", "#0f8a7e", "#4f7cac", "#8fb3c9", "#c9a227", "#7a869a", "#2e6e58", "#a3b8c8"];
const LIMITE_TRUNCADO = 220;          // caracteres visibles antes de "Ver más"
const LIMITE_CELDA_EXCEL = 32000;     // Excel admite ~32.767 caracteres por celda
const ASOCIACIONES_PERMITIDAS = ["OWNER", "MEMBER", "COLLABORATOR"];

const state = {
  vista: "inicio",
  reportes: [],          // todos los reportes interpretados
  filtrados: [],         // reportes que cumplen los filtros
  filtros: null,
  orden: { clave: "fechaISO", dir: "desc" },
  expandidos: new Set(), // descripciones abiertas con "Ver más"
  cargando: false,
  cargado: false,
  promesaCarga: null,
  error: null,
  cargadoEn: null,
  usandoCacheVieja: false,
  sinConfigurar: false,
  necesitaRecarga: false,
  pendiente: null,       // último reporte preparado en esta sesión
  demoLocal: [],         // temas registrados en modo demo (solo en memoria)
  graficos: {},
  chartConfigurado: false,
  copia: { cuerpo: "", url: "", titulo: "" },
  ultimoRegistro: null   // división y persona del último registro (para "Registrar otro tema")
};

/* ==========================================================================
   5. UTILIDADES
   ========================================================================== */

const $ = (selector, raiz = document) => raiz.querySelector(selector);
const $$ = (selector, raiz = document) => Array.from(raiz.querySelectorAll(selector));

/**
 * Crea un elemento HTML de forma segura (el texto nunca se interpreta como HTML).
 * Esto protege contra código malicioso escrito dentro de un reporte.
 */
function crear(etiqueta, opciones = {}, hijos = []) {
  const nodo = document.createElement(etiqueta);
  const { className, text, attrs, dataset } = opciones;
  if (className) nodo.className = className;
  if (text !== undefined && text !== null) nodo.textContent = String(text);
  if (attrs) {
    for (const [clave, valor] of Object.entries(attrs)) {
      if (valor === undefined || valor === null || valor === false) continue;
      nodo.setAttribute(clave, valor === true ? "" : String(valor));
    }
  }
  if (dataset) Object.assign(nodo.dataset, dataset);
  for (const hijo of [].concat(hijos)) {
    if (hijo === undefined || hijo === null || hijo === false) continue;
    nodo.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
  }
  return nodo;
}

/** Minúsculas y sin tildes, para comparar y buscar. */
function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function normalizarClave(texto) {
  return normalizar(texto).replace(/[^a-z0-9]/g, "");
}

/** Devuelve la opción oficial que coincide (sin importar mayúsculas/tildes). */
function canonico(valor, opciones) {
  const limpio = String(valor ?? "").trim();
  if (!limpio) return "";
  const n = normalizar(limpio);
  return opciones.find((o) => normalizar(o) === n) || limpio;
}

function recortar(texto, maximo) {
  if (texto.length <= maximo) return texto;
  const corte = texto.slice(0, maximo);
  const espacio = corte.lastIndexOf(" ");
  return (espacio > maximo * 0.6 ? corte.slice(0, espacio) : corte).trimEnd() + "…";
}

/** Divide una etiqueta larga en varias líneas (para los gráficos). */
function etiquetaMultilinea(texto, maximo) {
  const palabras = String(texto).split(/\s+/);
  const lineas = [];
  let actual = "";
  for (const palabra of palabras) {
    if ((actual + " " + palabra).trim().length > maximo && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = (actual + " " + palabra).trim();
    }
  }
  if (actual) lineas.push(actual);
  return lineas.length > 1 ? lineas : texto;
}

function debounce(funcion, espera) {
  let temporizador;
  return (...args) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => funcion(...args), espera);
  };
}

function pausa(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

function plural(n, singular, pluralTexto) {
  return `${n.toLocaleString("es-CO")} ${n === 1 ? singular : pluralTexto}`;
}

/* ---------- Fechas (siempre en hora local del dispositivo) ---------- */

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** Fecha local en formato AAAA-MM-DD. */
function fechaLocalISO(fecha = new Date()) {
  return `${fecha.getFullYear()}-${pad2(fecha.getMonth() + 1)}-${pad2(fecha.getDate())}`;
}

function esISOValida(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return false;
  const [a, m, d] = iso.split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1, d));
  return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
}

/** AAAA-MM-DD → DD/MM/AAAA */
function isoATexto(iso) {
  if (!esISOValida(iso)) return "";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

/** Acepta DD/MM/AAAA, D/M/AAAA, DD-MM-AAAA o AAAA-MM-DD. Devuelve AAAA-MM-DD o null. */
function textoAISO(texto) {
  const t = String(texto || "").trim();
  let m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (m) {
    const iso = `${m[3]}-${pad2(m[2])}-${pad2(m[1])}`;
    return esISOValida(iso) ? iso : null;
  }
  m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    const iso = `${m[1]}-${pad2(m[2])}-${pad2(m[3])}`;
    return esISOValida(iso) ? iso : null;
  }
  return null;
}

function fechaHoraTexto(fecha) {
  if (!(fecha instanceof Date) || isNaN(fecha)) return "";
  return `${isoATexto(fechaLocalISO(fecha))} ${pad2(fecha.getHours())}:${pad2(fecha.getMinutes())}`;
}

function horaTexto(fecha) {
  if (!(fecha instanceof Date) || isNaN(fecha)) return "";
  return `${pad2(fecha.getHours())}:${pad2(fecha.getMinutes())}`;
}

/** "2026-09" → "septiembre de 2026" */
function nombreMes(anioMes) {
  const [a, m] = anioMes.split("-").map(Number);
  return `${MESES[m - 1]} de ${a}`;
}

/** "2026-09" → "sep 2026" */
function mesCorto(anioMes) {
  const [a, m] = anioMes.split("-").map(Number);
  return `${MESES_CORTOS[m - 1]} ${a}`;
}

function restarDias(dias) {
  const f = new Date();
  f.setDate(f.getDate() - dias);
  return f;
}

/** Lista de meses "AAAA-MM" entre dos meses (incluidos). */
function rangoMeses(desde, hasta) {
  const meses = [];
  let [a, m] = desde.split("-").map(Number);
  const [aFin, mFin] = hasta.split("-").map(Number);
  let guardia = 0;
  while ((a < aFin || (a === aFin && m <= mFin)) && guardia < 240) {
    meses.push(`${a}-${pad2(m)}`);
    m += 1;
    if (m > 12) { m = 1; a += 1; }
    guardia += 1;
  }
  return meses;
}

/** Número de fecha de Excel (días desde 30/12/1899), sin desfases de zona horaria. */
function serialExcel(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return (Date.UTC(a, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000;
}

/* ---------- Almacenamiento local (opcional; la app funciona sin él) ---------- */

const almacen = {
  leer(clave) {
    try {
      const valor = window.localStorage.getItem(clave);
      return valor ? JSON.parse(valor) : null;
    } catch (e) {
      return null;
    }
  },
  guardar(clave, valor) {
    try {
      window.localStorage.setItem(clave, JSON.stringify(valor));
    } catch (e) {
      /* Sin almacenamiento disponible (modo privado): se ignora. */
    }
  }
};

function claveCache() {
  return `radar-cache-v1:${CONFIG.owner}/${CONFIG.repo}:${CONFIG.onlyCollaborators ? "colab" : "todos"}`;
}

/* ---------- Mensajes emergentes ---------- */

/**
 * Muestra un mensaje breve en la esquina inferior.
 * tipo: "success" | "warning" | "error" | "info"
 */
function mostrarMensaje(texto, tipo = "info", duracion = 5000) {
  const contenedor = $("#toast-container");
  if (!contenedor) return;
  const cerrar = crear("button", { className: "toast-close", text: "×", attrs: { type: "button", "aria-label": "Cerrar mensaje" } });
  const toast = crear("div", {
    className: `toast toast-${tipo}`,
    attrs: { role: tipo === "error" || tipo === "warning" ? "alert" : "status" }
  }, [crear("span", { text: texto }), cerrar]);
  cerrar.addEventListener("click", () => toast.remove());
  contenedor.append(toast);
  while (contenedor.children.length > 4) contenedor.firstElementChild.remove();
  if (duracion) setTimeout(() => toast.remove(), duracion);
}

/** Pone texto con partes en negrita: ["Presione ", {b: "Create"}, "."] */
function textoConNegrita(elemento, partes) {
  elemento.replaceChildren(...partes.map((p) => (typeof p === "string" ? p : crear("strong", { text: p.b }))));
}

/* ---------- Configuración ---------- */

function configuracionCompleta() {
  const invalido = (valor) => !valor || /CAMBIAR_AQUI/i.test(valor);
  return !invalido(CONFIG.owner) && !invalido(CONFIG.repo);
}

function urlRepositorio() {
  return `https://github.com/${encodeURIComponent(CONFIG.owner)}/${encodeURIComponent(CONFIG.repo)}`;
}

function esUrlGithubSegura(url) {
  return typeof url === "string" && url.startsWith("https://github.com/");
}

/* ==========================================================================
   6. FUENTES DE DATOS
   Todas las fuentes tienen la misma forma:
     nombre             → texto que se muestra como "Fuente"
     cargar(opciones)   → devuelve la lista de reportes
     prepararNuevo(reg) → registra (o prepara el registro de) un nuevo reporte

   PRODUCCIÓN CON INFORMACIÓN CONFIDENCIAL: una página estática no puede leer
   un repositorio privado sin exponer un token. Para ese caso agregue aquí una
   fuente "proxy" con esta misma forma, que llame a un servicio intermedio
   seguro (el que guarda la credencial del lado del servidor), y cambie
   CONFIG.dataSource = "proxy". El resto de la aplicación no cambia.
   ========================================================================== */

const FUENTES = {
  github: {
    get nombre() {
      return configuracionCompleta() ? `GitHub · ${CONFIG.owner}/${CONFIG.repo}` : "GitHub (sin configurar)";
    },
    cargar: cargarDesdeGitHub,
    prepararNuevo: prepararEnGitHub
  },

  demo: {
    nombre: "Datos de demostración (ficticios)",
    async cargar() {
      await pausa(250);
      return DEMO_REPORTES.map(demoAReporte).concat(state.demoLocal);
    },
    prepararNuevo: registrarEnDemo
  }
};

function fuenteDeDatos() {
  if (DEMO_MODE) return FUENTES.demo;
  return FUENTES[CONFIG.dataSource] || FUENTES.github;
}

function demoAReporte(d, indice) {
  const fecha = restarDias(d.dias);
  const fechaISO = fechaLocalISO(fecha);
  const creado = new Date(fecha);
  creado.setHours(9 + (indice % 7), 15, 0, 0);
  return {
    id: `DEMO-${indice + 1}`,
    idRadar: `DEMO-${indice + 1}`,
    numero: null,
    url: "",
    titulo: construirTitulo(d.activo, d.tema),
    estado: d.estado,
    fechaISO,
    fechaTexto: isoATexto(fechaISO),
    division: d.division,
    persona: d.persona,
    email: d.email,
    activo: d.activo,
    instancias: d.instancias.slice(),
    tema: d.tema,
    comentarios: d.comentarios || 0,
    creadoEn: creado.toISOString(),
    actualizadoEn: creado.toISOString(),
    demo: true
  };
}

/* ==========================================================================
   7. LECTURA DE GITHUB (API pública, sin token)
   ========================================================================== */

async function cargarDesdeGitHub({ forzar = false } = {}) {
  const base = `https://api.github.com/repos/${encodeURIComponent(CONFIG.owner)}/${encodeURIComponent(CONFIG.repo)}/issues`;
  let url = `${base}?state=all&per_page=100&sort=created&direction=desc`;
  const issues = [];
  let paginas = 0;

  // Paginación: GitHub entrega máximo 100 Issues por página; se sigue el enlace "next".
  while (url && paginas < 100) {
    const respuesta = await consultarGitHub(url, forzar);
    const lote = await respuesta.json();
    if (!Array.isArray(lote)) throw crearError("Respuesta inesperada de GitHub.");
    issues.push(...lote);
    url = siguientePagina(respuesta.headers.get("Link"));
    paginas += 1;
  }

  return issues.filter(esIssueDelRadar).map(issueAReporte);
}

async function consultarGitHub(url, forzar) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), CONFIG.requestTimeoutMs);
  let respuesta;
  try {
    respuesta = await fetch(url, {
      headers: { Accept: "application/vnd.github+json" },
      cache: forzar ? "no-cache" : "default",
      signal: controlador.signal
    });
  } catch (error) {
    const e = crearError(error.name === "AbortError"
      ? "GitHub tardó demasiado en responder. Intente nuevamente."
      : "No fue posible conectarse con GitHub. Revise su conexión a internet.");
    e.tipo = "red";
    throw e;
  } finally {
    clearTimeout(temporizador);
  }
  if (!respuesta.ok) throw errorDeGitHub(respuesta);
  return respuesta;
}

function crearError(mensajeUsuario) {
  const e = new Error(mensajeUsuario);
  e.mensajeUsuario = mensajeUsuario;
  return e;
}

function errorDeGitHub(respuesta) {
  const restantes = respuesta.headers.get("x-ratelimit-remaining");
  const reinicio = Number(respuesta.headers.get("x-ratelimit-reset"));
  let mensaje;
  if ((respuesta.status === 403 || respuesta.status === 429) && restantes === "0") {
    const minutos = reinicio ? Math.max(1, Math.ceil((reinicio * 1000 - Date.now()) / 60000)) : null;
    mensaje = `GitHub alcanzó el límite de consultas desde esta red${minutos && minutos <= 90 ? `; intente de nuevo en ${minutos} min` : "; intente de nuevo más tarde"}.`;
  } else if (respuesta.status === 404) {
    mensaje = "No se encontró el repositorio. Verifique owner y repo en app.js y que el repositorio sea público.";
  } else if (respuesta.status === 410) {
    mensaje = "Los Issues están desactivados en el repositorio (README, paso 5).";
  } else if (respuesta.status === 403 || respuesta.status === 429) {
    mensaje = "GitHub limitó temporalmente las consultas. Intente nuevamente en unos minutos.";
  } else {
    mensaje = `No fue posible conectarse con GitHub (código ${respuesta.status}).`;
  }
  const e = crearError(mensaje);
  e.status = respuesta.status;
  return e;
}

/** Lee el encabezado "Link" de GitHub y devuelve la URL de la página siguiente. */
function siguientePagina(encabezadoLink) {
  if (!encabezadoLink) return null;
  for (const parte of encabezadoLink.split(",")) {
    const m = parte.match(/<([^>]+)>\s*;\s*rel="next"/);
    if (m && m[1].startsWith("https://api.github.com/")) return m[1];
  }
  return null;
}

/* ==========================================================================
   8. INTERPRETACIÓN DE ISSUES
   ========================================================================== */

/** ¿Este Issue pertenece al Radar? (no trae pull requests ni Issues ajenos) */
function esIssueDelRadar(issue) {
  if (!issue || issue.pull_request) return false;
  const etiquetas = (issue.labels || []).map((l) => normalizar(typeof l === "string" ? l : l.name));
  const tieneEtiqueta = etiquetas.includes(normalizar(CONFIG.label));
  const titulo = String(issue.title || "");
  const tienePrefijo = titulo.toUpperCase().startsWith(CONFIG.titlePrefix.toUpperCase());
  const tieneMarcador = String(issue.body || "").includes(MARCADOR);
  if (!(tieneEtiqueta || tienePrefijo || tieneMarcador)) return false;
  if (CONFIG.onlyCollaborators && !ASOCIACIONES_PERMITIDAS.includes(issue.author_association)) return false;
  return true;
}

/**
 * Lee el cuerpo del Issue y separa las secciones "## Fecha", "## División", etc.
 * La sección "Tema y descripción" es la última: todo lo que sigue se considera
 * parte de la descripción (así un "##" escrito dentro del texto no la corta).
 */
function interpretarCuerpo(cuerpo) {
  const texto = String(cuerpo || "").replace(/\r\n?/g, "\n");
  const marca = texto.match(/<!--\s*radar-sostenibilidad[^>]*?id:([A-Za-z0-9-]+)/);
  const limpio = texto.replace(/<!--\s*radar-sostenibilidad[\s\S]*?-->/g, "");

  const secciones = {};
  let actual = null;
  for (const linea of limpio.split("\n")) {
    const encabezado = linea.match(/^\s{0,3}#{2,3}\s+(.+?)\s*#*\s*$/);
    if (encabezado && actual !== "tema") {
      const clave = ALIAS_ENCABEZADOS[normalizarClave(encabezado[1])];
      if (clave) {
        actual = clave;
        if (!secciones[clave]) secciones[clave] = [];
        continue;
      }
    }
    if (actual) secciones[actual].push(linea);
  }

  const valor = (clave) => {
    const v = (secciones[clave] || []).join("\n").trim();
    return v === "_No response_" ? "" : v;
  };

  const instancias = valor("instancias")
    .split(/\n|;/)
    .map((s) => s.replace(/^\s*[-*+]\s+(\[[ xX]\]\s*)?/, "").trim())
    .filter(Boolean);

  return {
    idRadar: marca ? marca[1] : "",
    fecha: valor("fecha").split("\n")[0].trim(),
    division: valor("division").split("\n")[0].trim(),
    persona: valor("persona").split("\n")[0].trim(),
    email: valor("email").split("\n")[0].trim(),
    activo: valor("activo").split("\n")[0].trim(),
    instancias,
    tema: valor("tema")
  };
}

/** Convierte un Issue de GitHub en un reporte del Radar. */
function issueAReporte(issue) {
  const c = interpretarCuerpo(issue.body);

  // Persona y correo: si vienen juntos ("Nombre – correo"), se separan.
  let persona = c.persona;
  let email = c.email;
  const juntos = persona.match(/^(.*?)\s*[–-]\s*([^\s@]+@[^\s@]+)$/);
  if (juntos) {
    persona = juntos[1];
    if (!email) email = juntos[2];
  }
  persona = canonico(persona, PERSONAS.map((p) => p.nombre));
  if (!email || /^no registrado$/i.test(email)) {
    const conocida = PERSONAS.find((p) => normalizar(p.nombre) === normalizar(persona));
    email = conocida ? conocida.email : "";
  }

  // Activo: si falta en el cuerpo, se toma del título "[RADAR] ACTIVO - ...".
  let activo = c.activo;
  if (!activo) {
    const delTitulo = String(issue.title || "").match(/^\s*\[RADAR\]\s*(.+?)\s+-\s+/i);
    if (delTitulo) activo = delTitulo[1];
  }

  // Fecha: la del reporte; si no se puede leer, la de creación del Issue.
  const creado = new Date(issue.created_at);
  const fechaISO = textoAISO(c.fecha) || fechaLocalISO(creado);

  return {
    id: c.idRadar || `gh-${issue.number}`,
    idRadar: c.idRadar,
    numero: issue.number,
    url: esUrlGithubSegura(issue.html_url) ? issue.html_url : "",
    titulo: String(issue.title || ""),
    estado: issue.state === "closed" ? "cerrado" : "abierto",
    fechaISO,
    fechaTexto: isoATexto(fechaISO),
    division: canonico(c.division, DIVISIONES),
    persona,
    email: email.toLowerCase(),
    activo: canonico(activo, ACTIVOS),
    instancias: c.instancias.map((i) => canonico(i, INSTANCIAS)),
    tema: c.tema || String(issue.body || "").trim(),
    comentarios: Number(issue.comments) || 0,
    creadoEn: issue.created_at,
    actualizadoEn: issue.updated_at || issue.created_at,
    autor: issue.user && issue.user.login ? issue.user.login : ""
  };
}

/** Agrega campos auxiliares para filtrar y buscar rápido. */
function prepararReporte(r) {
  const instancias = Array.isArray(r.instancias) ? r.instancias : [];
  return {
    ...r,
    instancias,
    _n: {
      division: normalizar(r.division),
      persona: normalizar(r.persona),
      activo: normalizar(r.activo),
      instancias: instancias.map(normalizar)
    },
    _texto: normalizar(r.tema)
  };
}

/* ==========================================================================
   9. CARGA DE REPORTES
   ========================================================================== */

function establecerReportes(lista) {
  state.reportes = lista.map(prepararReporte);
}

function leerCache() {
  const c = almacen.leer(claveCache());
  return c && Array.isArray(c.reportes) && c.guardadoEn ? c : null;
}

function guardarCache(reportes) {
  almacen.guardar(claveCache(), { guardadoEn: Date.now(), reportes });
}

/**
 * Carga los reportes desde la fuente activa.
 * forzar = true ignora los datos guardados y consulta de nuevo.
 */
function cargarReportes({ forzar = false, silencioso = false } = {}) {
  if (state.cargando && state.promesaCarga) return state.promesaCarga;

  if (!DEMO_MODE && !configuracionCompleta()) {
    state.sinConfigurar = true;
    state.cargado = true;
    refrescarTodo();
    return Promise.resolve();
  }

  state.cargando = true;
  state.error = null;
  if (!silencioso) refrescarEstados();

  state.promesaCarga = (async () => {
    try {
      const fuente = fuenteDeDatos();
      let reportes = null;
      if (!forzar && !DEMO_MODE) {
        const cache = leerCache();
        if (cache && Date.now() - cache.guardadoEn < CONFIG.cacheMinutes * 60000) {
          reportes = cache.reportes;
          state.cargadoEn = new Date(cache.guardadoEn);
        }
      }
      if (!reportes) {
        reportes = await fuente.cargar({ forzar });
        state.cargadoEn = new Date();
        if (!DEMO_MODE) guardarCache(reportes);
      }
      establecerReportes(reportes);
      state.usandoCacheVieja = false;
      state.cargado = true;
    } catch (error) {
      state.error = error;
      if (!state.cargado && !DEMO_MODE) {
        const cache = leerCache();
        if (cache) {
          establecerReportes(cache.reportes);
          state.cargadoEn = new Date(cache.guardadoEn);
          state.usandoCacheVieja = true;
          state.cargado = true;
        }
      }
      if (!silencioso) {
        mostrarMensaje(`⚠ ${error.mensajeUsuario || "No fue posible conectarse con GitHub."}`, "error", 8000);
      }
    } finally {
      state.cargando = false;
      state.promesaCarga = null;
      refrescarTodo();
    }
  })();

  return state.promesaCarga;
}

/** Recalcula filtros y vuelve a dibujar todo lo que depende de los datos. */
function refrescarTodo() {
  actualizarOpcionesFiltros();
  state.filtros = leerFiltros();
  state.filtrados = ordenarReportes(aplicarFiltros(state.reportes, state.filtros));
  refrescarEstados();
  renderTabla();
  renderIndicadores();
  renderInforme();
  actualizarContadorFiltros();
  if (state.vista === "radar") renderGraficos();
}

/** Estados de carga / error / vacío y textos de resumen. */
function refrescarEstados() {
  const resumen = $("#results-summary");
  const resumenRadar = $("#radar-summary");
  const inicio = $("#home-status");
  const fuente = fuenteDeDatos();

  let textoResumen = "";
  if (state.sinConfigurar) {
    textoResumen = "La aplicación no está conectada a un repositorio.";
    inicio.textContent = "⚠ Pendiente: configurar el repositorio en app.js (README, paso 3).";
  } else if (state.cargando && !state.cargado) {
    textoResumen = "Cargando reportes…";
    inicio.textContent = "Cargando reportes…";
  } else if (!state.cargado && state.error) {
    textoResumen = "No fue posible cargar los reportes.";
    inicio.textContent = "⚠ No fue posible cargar los reportes. Intente nuevamente.";
  } else {
    const total = state.reportes.length;
    const ultimo = state.reportes.reduce((max, r) => (r.fechaISO > max ? r.fechaISO : max), "");
    textoResumen = `Mostrando ${plural(state.filtrados.length, "reporte", "reportes")} de ${total.toLocaleString("es-CO")}`;
    if (state.cargadoEn) textoResumen += ` · Datos de las ${horaTexto(state.cargadoEn)}`;
    if (state.usandoCacheVieja) textoResumen += " (guardados; sin conexión con GitHub)";
    if (state.cargando) textoResumen += " · Actualizando…";
    inicio.textContent = total
      ? `${plural(total, "tema registrado", "temas registrados")} · último reporte: ${isoATexto(ultimo)}`
      : "Aún no hay temas registrados.";
  }
  resumen.textContent = textoResumen;
  resumenRadar.textContent = textoResumen ? `${textoResumen} · Fuente: ${fuente.nombre}` : "";
  $("#footer-source").textContent = `Fuente: ${fuente.nombre}`;

  // Mensaje en la tabla y en el Radar
  for (const contenedor of $$("[data-state-for]")) {
    pintarEstado(contenedor);
  }
}

function pintarEstado(contenedor) {
  const esTabla = contenedor.dataset.stateFor === "table";
  contenedor.className = "state";
  contenedor.replaceChildren();

  if (state.sinConfigurar) {
    contenedor.append(
      crear("p", { className: "state-title", text: "⚠ La aplicación aún no está conectada a un repositorio." }),
      crear("p", { className: "state-detail", text: "Cambie owner y repo al inicio de app.js (README, paso 3) o active DEMO_MODE = true." })
    );
    contenedor.hidden = false;
    return;
  }
  if (state.cargando && !state.cargado) {
    contenedor.append(crear("p", {}, [crear("span", { className: "spinner", attrs: { "aria-hidden": "true" } }), "Cargando reportes…"]));
    contenedor.hidden = false;
    return;
  }
  if (!state.cargado && state.error) {
    contenedor.classList.add("state-error");
    const reintentar = crear("button", { className: "btn btn-secondary btn-sm", text: "Intentar nuevamente", attrs: { type: "button", "data-action": "retry" } });
    contenedor.append(
      crear("p", { className: "state-title", text: "No fue posible cargar los reportes. Intente nuevamente." }),
      crear("p", { className: "state-detail", text: state.error.mensajeUsuario || "" }),
      reintentar
    );
    contenedor.hidden = false;
    return;
  }
  if (esTabla && state.cargado && !state.filtrados.length) {
    const sinDatos = !state.reportes.length;
    contenedor.append(crear("p", {
      className: "state-title",
      text: sinDatos ? "Aún no hay temas registrados." : "⚠ No se encontraron reportes para los filtros seleccionados."
    }));
    if (sinDatos) {
      contenedor.append(crear("a", { className: "btn btn-primary btn-sm", text: "+ Registrar nuevo tema", attrs: { href: "#registrar" } }));
    }
    contenedor.hidden = false;
    return;
  }
  contenedor.hidden = true;
}

/* ==========================================================================
   10. NAVEGACIÓN ENTRE SECCIONES
   ========================================================================== */

function vistaDesdeHash() {
  const hash = (window.location.hash || "").replace("#", "").toLowerCase();
  return VISTAS.includes(hash) ? hash : "inicio";
}

function mostrarVista(nombre) {
  state.vista = nombre;

  for (const seccion of $$("[data-view-section]")) {
    seccion.hidden = seccion.dataset.viewSection !== nombre;
  }
  for (const enlace of $$(".nav-link")) {
    const activo = enlace.dataset.view === nombre;
    enlace.classList.toggle("is-active", activo);
    if (activo) enlace.setAttribute("aria-current", "page");
    else enlace.removeAttribute("aria-current");
  }
  $("#filters-section").hidden = !(nombre === "consultar" || nombre === "radar");
  document.title = `${NOMBRES_VISTAS[nombre]} · Radar Semanal de Sostenibilidad`;
  window.scrollTo(0, 0);

  if (nombre === "consultar" || nombre === "radar") {
    if (state.necesitaRecarga && !DEMO_MODE) {
      state.necesitaRecarga = false;
      cargarReportes({ forzar: true, silencioso: true });
    } else if (!state.cargado && !state.cargando) {
      cargarReportes();
    }
  }
  if (nombre === "radar") renderGraficos();
}

/* ==========================================================================
   11. FORMULARIO: INICIALIZACIÓN Y LISTA CON BUSCADOR
   ========================================================================== */

function llenarSelect(select, opciones, textoVacio) {
  const actual = select.value;
  select.replaceChildren(crear("option", { text: textoVacio, attrs: { value: "" } }));
  for (const opcion of opciones) {
    select.append(crear("option", { text: opcion, attrs: { value: opcion } }));
  }
  select.value = opciones.includes(actual) ? actual : "";
}

function iniciarFormulario() {
  const form = $("#report-form");
  llenarSelect($("#f-division"), DIVISIONES, "Seleccione una división");
  llenarSelect($("#f-activo"), ACTIVOS, "Seleccione un activo / BL");

  const listaInstancias = $("#f-instancias");
  INSTANCIAS.forEach((instancia, i) => {
    const id = `f-inst-${i}`;
    const casilla = crear("input", { attrs: { type: "checkbox", id, name: "instancias", value: instancia } });
    listaInstancias.append(crear("label", { className: "choice", attrs: { for: id } }, [casilla, crear("span", { text: instancia })]));
  });

  // Fecha automática: la del dispositivo (la persona puede cambiarla)
  $("#f-fecha").value = fechaLocalISO();
  actualizarFechaVisible();

  $("#f-fecha").addEventListener("input", () => { actualizarFechaVisible(); limpiarError("fecha"); });
  $("#f-fecha").addEventListener("change", () => { actualizarFechaVisible(); limpiarError("fecha"); });
  $("#f-division").addEventListener("change", () => limpiarError("division"));
  $("#f-activo").addEventListener("change", () => { limpiarError("activo"); actualizarVistaPrevia(); });
  listaInstancias.addEventListener("change", () => limpiarError("instancias"));
  const previaDiferida = debounce(actualizarVistaPrevia, 150);
  $("#f-tema").addEventListener("input", () => { limpiarError("tema"); previaDiferida(); });

  iniciarCombobox();
  form.addEventListener("submit", alEnviarFormulario);
  actualizarVistaPrevia();
}

function actualizarFechaVisible() {
  const iso = $("#f-fecha").value;
  $("#f-fecha-visible").textContent = esISOValida(iso) ? `Fecha seleccionada: ${isoATexto(iso)}` : "Formato: DD/MM/AAAA";
}

/* ---------- Lista "Quién reporta" con buscador ---------- */

const combo = { abierto: false, indice: -1, visibles: [], seleccion: null };

function iniciarCombobox() {
  const input = $("#f-persona");
  const lista = $("#persona-listbox");
  const boton = $("#persona-toggle");

  input.addEventListener("input", () => {
    combo.seleccion = null;
    mostrarCorreoPersona();
    abrirCombobox(input.value);
  });
  input.addEventListener("focus", () => abrirCombobox(input.value));
  input.addEventListener("blur", () => {
    setTimeout(() => {
      cerrarCombobox();
      resolverTextoPersona();
    }, 120);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!combo.abierto) abrirCombobox(input.value);
      else moverActivo(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moverActivo(-1);
    } else if (e.key === "Enter") {
      if (combo.abierto && combo.indice >= 0 && combo.visibles[combo.indice]) {
        e.preventDefault();
        elegirPersona(combo.visibles[combo.indice]);
      }
    } else if (e.key === "Escape") {
      cerrarCombobox();
    }
  });

  // mousedown evita que el campo pierda el foco al tocar la lista o el botón
  lista.addEventListener("mousedown", (e) => e.preventDefault());
  lista.addEventListener("click", (e) => {
    const opcion = e.target.closest("[data-index]");
    if (opcion) elegirPersona(combo.visibles[Number(opcion.dataset.index)]);
  });
  boton.addEventListener("mousedown", (e) => e.preventDefault());
  boton.addEventListener("click", () => {
    if (combo.abierto) {
      cerrarCombobox();
    } else {
      input.focus();
      abrirCombobox("");
    }
  });
}

function filtrarPersonas(consulta) {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (!palabras.length) return PERSONAS.slice();
  return PERSONAS.filter((p) => {
    const texto = normalizar(`${p.nombre} ${p.email}`);
    return palabras.every((palabra) => texto.includes(palabra));
  });
}

function abrirCombobox(texto) {
  const consulta = combo.seleccion && texto === combo.seleccion.nombre ? "" : texto;
  combo.visibles = filtrarPersonas(consulta);
  const indiceSeleccion = combo.seleccion ? combo.visibles.findIndex((p) => p.nombre === combo.seleccion.nombre) : -1;
  combo.indice = indiceSeleccion >= 0 ? indiceSeleccion : (consulta && combo.visibles.length ? 0 : -1);
  combo.abierto = true;
  pintarListaPersonas();
  $("#persona-listbox").hidden = false;
  $("#f-persona").setAttribute("aria-expanded", "true");
}

function cerrarCombobox() {
  combo.abierto = false;
  $("#persona-listbox").hidden = true;
  $("#f-persona").setAttribute("aria-expanded", "false");
  $("#f-persona").removeAttribute("aria-activedescendant");
}

function moverActivo(paso) {
  if (!combo.visibles.length) return;
  combo.indice = (combo.indice + paso + combo.visibles.length) % combo.visibles.length;
  pintarListaPersonas();
}

function pintarListaPersonas() {
  const lista = $("#persona-listbox");
  const input = $("#f-persona");
  lista.replaceChildren();
  if (!combo.visibles.length) {
    lista.append(crear("li", { className: "combobox-empty", text: "No hay coincidencias. Revise la escritura." }));
    input.removeAttribute("aria-activedescendant");
    return;
  }
  combo.visibles.forEach((persona, i) => {
    const seleccionada = combo.seleccion && combo.seleccion.nombre === persona.nombre;
    lista.append(crear("li", {
      className: `combobox-option${i === combo.indice ? " is-active" : ""}`,
      attrs: { id: `persona-opt-${i}`, role: "option", "aria-selected": seleccionada ? "true" : "false" },
      dataset: { index: String(i) }
    }, [
      crear("span", { className: "opt-name", text: persona.nombre }),
      crear("span", { className: "opt-email", text: persona.email || "Sin correo registrado" })
    ]));
  });
  if (combo.indice >= 0) {
    input.setAttribute("aria-activedescendant", `persona-opt-${combo.indice}`);
    const activa = $(`#persona-opt-${combo.indice}`);
    if (activa) activa.scrollIntoView({ block: "nearest" });
  } else {
    input.removeAttribute("aria-activedescendant");
  }
}

function elegirPersona(persona) {
  if (!persona) return;
  combo.seleccion = persona;
  $("#f-persona").value = persona.nombre;
  cerrarCombobox();
  mostrarCorreoPersona();
  limpiarError("persona");
}

/** Si la persona escribió el nombre o correo completo sin elegir de la lista, se acepta. */
function resolverTextoPersona() {
  if (combo.seleccion) return;
  const texto = normalizar($("#f-persona").value);
  if (!texto) return;
  const exacta = PERSONAS.find((p) => normalizar(p.nombre) === texto || (p.email && normalizar(p.email) === texto));
  if (exacta) elegirPersona(exacta);
}

function mostrarCorreoPersona() {
  const p = combo.seleccion;
  $("#persona-email").textContent = p ? `Correo: ${p.email || "sin correo registrado"}` : "";
}

/* ==========================================================================
   12. FORMULARIO: VALIDACIÓN, ARMADO DEL ISSUE Y ENVÍO
   ========================================================================== */

function leerFormulario() {
  return {
    fechaISO: $("#f-fecha").value,
    division: $("#f-division").value,
    persona: combo.seleccion,
    activo: $("#f-activo").value,
    instancias: $$("#f-instancias input:checked").map((c) => c.value),
    tema: $("#f-tema").value.replace(/\r\n?/g, "\n").trim()
  };
}

function validarFormulario(datos) {
  const errores = {};
  if (!esISOValida(datos.fechaISO)) errores.fecha = "Seleccione una fecha válida.";
  if (!datos.division) errores.division = "Seleccione la división.";
  if (!datos.persona) {
    errores.persona = $("#f-persona").value.trim() ? "Seleccione un nombre de la lista." : "Seleccione quién reporta.";
  }
  if (!datos.activo) errores.activo = "Seleccione el Activo / BL.";
  if (!datos.instancias.length) errores.instancias = "Seleccione al menos una instancia.";
  if (!datos.tema) errores.tema = "Describa el tema.";
  else if (datos.tema.length < 10) errores.tema = "La descripción es muy corta (mínimo 10 caracteres).";
  return errores;
}

const CAMPOS_FORMULARIO = ["fecha", "division", "persona", "activo", "instancias", "tema"];

function mostrarErroresFormulario(errores) {
  for (const campo of CAMPOS_FORMULARIO) {
    const envoltura = $(`.field[data-field="${campo}"]`);
    const mensaje = errores[campo] || "";
    envoltura.classList.toggle("has-error", Boolean(mensaje));
    $(`#err-${campo}`).textContent = mensaje ? `⚠ ${mensaje}` : "";
    if (campo !== "instancias") {
      const control = envoltura.querySelector("input, select, textarea");
      if (control) control.setAttribute("aria-invalid", mensaje ? "true" : "false");
    }
  }
  const alerta = $("#form-alert");
  if (Object.keys(errores).length) {
    alerta.textContent = "⚠ Debe completar todos los campos.";
    alerta.hidden = false;
  } else {
    alerta.hidden = true;
  }
}

function limpiarError(campo) {
  const envoltura = $(`.field[data-field="${campo}"]`);
  if (!envoltura || !envoltura.classList.contains("has-error")) return;
  envoltura.classList.remove("has-error");
  $(`#err-${campo}`).textContent = "";
  const control = envoltura.querySelector("input, select, textarea");
  if (control && campo !== "instancias") control.setAttribute("aria-invalid", "false");
  if (!$(".field.has-error")) $("#form-alert").hidden = true;
}

/** Resumen corto para el título: primera línea del tema. */
function construirResumen(tema) {
  const primera = (String(tema || "").split("\n").find((l) => l.trim()) || "")
    .replace(/^[#>*\-\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!primera) return "Tema reportado";
  const max = CONFIG.titleSummaryMaxLength;
  if (primera.length <= max) return primera.replace(/[.:;,\s]+$/, "") || "Tema reportado";
  return recortar(primera, max);
}

/** Título: [RADAR] ACTIVO / BL - resumen del tema */
function construirTitulo(activo, tema) {
  return `${CONFIG.titlePrefix} ${activo || "ACTIVO"} - ${construirResumen(tema)}`;
}

/** Cuerpo del Issue con estructura fija (la misma que se interpreta al leer). */
function construirCuerpo(r) {
  return [
    `## ${ENCABEZADOS.fecha}`, isoATexto(r.fechaISO), "",
    `## ${ENCABEZADOS.division}`, r.division, "",
    `## ${ENCABEZADOS.persona}`, r.persona, "",
    `## ${ENCABEZADOS.email}`, r.email || "No registrado", "",
    `## ${ENCABEZADOS.activo}`, r.activo, "",
    `## ${ENCABEZADOS.instancias}`, ...r.instancias.map((i) => `- ${i}`), "",
    `## ${ENCABEZADOS.tema}`, r.tema, "",
    `<!-- ${MARCADOR} id:${r.idRadar} · No borre esta línea: identifica el reporte en el Radar. -->`
  ].join("\n");
}

/** Enlace de GitHub para crear el Issue con título y cuerpo ya escritos. */
function construirUrlNuevoIssue(titulo, cuerpo) {
  const parametros = new URLSearchParams();
  parametros.set("title", titulo);
  if (cuerpo) parametros.set("body", cuerpo);
  if (CONFIG.labelInUrl) parametros.set("labels", CONFIG.label);
  return `${urlRepositorio()}/issues/new?${parametros.toString()}`;
}

function generarIdRadar() {
  const bytes = new Uint8Array(4);
  window.crypto.getRandomValues(bytes);
  const aleatorio = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `RAD-${fechaLocalISO().replace(/-/g, "")}-${aleatorio}`;
}

/** Vista previa del título y contador de caracteres bajo la descripción. */
function actualizarVistaPrevia() {
  const tema = $("#f-tema").value.trim();
  const activo = $("#f-activo").value;
  const previa = $("#title-preview");
  const contador = $("#char-count");

  if (tema) {
    textoConNegrita(previa, [{ b: "Título del registro: " }, construirTitulo(activo, tema)]);
  } else {
    previa.textContent = "La primera línea se usará como título del registro.";
  }

  let texto = plural(tema.length, "carácter", "caracteres");
  let extenso = false;
  if (!DEMO_MODE && configuracionCompleta() && tema) {
    const cuerpo = construirCuerpo({
      fechaISO: $("#f-fecha").value || fechaLocalISO(),
      division: $("#f-division").value || "Territorios Compartidos",
      persona: combo.seleccion ? combo.seleccion.nombre : "Nombre de ejemplo de longitud media",
      email: combo.seleccion ? combo.seleccion.email : "correo.ejemplo@enel.com",
      activo: activo || "TRANSVERSAL",
      instancias: INSTANCIAS,
      tema,
      idRadar: "RAD-00000000-00000000"
    });
    extenso = construirUrlNuevoIssue(construirTitulo(activo, tema), cuerpo).length > CONFIG.maxUrlLength;
  }
  if (extenso) texto += " · texto extenso: se le pedirá copiar y pegar en GitHub";
  contador.textContent = texto;
  contador.classList.toggle("is-long", extenso);
}

function alEnviarFormulario(evento) {
  evento.preventDefault();
  resolverTextoPersona();

  const datos = leerFormulario();
  const errores = validarFormulario(datos);
  mostrarErroresFormulario(errores);
  if (Object.keys(errores).length) {
    mostrarMensaje("⚠ Debe completar todos los campos.", "warning");
    const primero = $(".field.has-error");
    if (primero) {
      primero.scrollIntoView({ block: "center" });
      const control = primero.querySelector("input, select, textarea");
      if (control) control.focus({ preventScroll: true });
    }
    return;
  }

  const registro = {
    idRadar: generarIdRadar(),
    fechaISO: datos.fechaISO,
    division: datos.division,
    persona: datos.persona.nombre,
    email: datos.persona.email,
    activo: datos.activo,
    instancias: datos.instancias,
    tema: datos.tema
  };
  state.ultimoRegistro = { division: datos.division, persona: datos.persona };

  fuenteDeDatos().prepararNuevo(registro);
}

/** GitHub: abre la página de "nuevo Issue" con todo prellenado. */
function prepararEnGitHub(registro) {
  if (!configuracionCompleta()) {
    $("#config-alert").hidden = false;
    mostrarMensaje("⚠ Falta configurar owner y repo en app.js (README, paso 3).", "error", 9000);
    return;
  }

  const titulo = construirTitulo(registro.activo, registro.tema);
  const cuerpo = construirCuerpo(registro);
  const url = construirUrlNuevoIssue(titulo, cuerpo);

  state.pendiente = { idRadar: registro.idRadar, titulo, preparadoEn: Date.now(), url };
  state.necesitaRecarga = true;

  if (url.length > CONFIG.maxUrlLength) {
    // Texto demasiado largo para un enlace: se abre GitHub con el título y
    // la persona pega el cuerpo copiado.
    const urlCorta = construirUrlNuevoIssue(titulo, "Borre este texto, pegue aquí (Ctrl+V) el contenido copiado desde el Radar y presione Create.");
    state.pendiente.url = urlCorta;
    abrirDialogoCopiar(cuerpo, urlCorta, titulo);
    return;
  }

  const ventana = abrirEnPestana(url);
  mostrarPanelExito({ modo: "github", titulo, url, bloqueado: !ventana, largo: false });
}

/** Modo demo: el tema se agrega solo en memoria (no se envía a ninguna parte). */
function registrarEnDemo(registro) {
  const ahora = new Date();
  const reporte = {
    id: registro.idRadar,
    idRadar: registro.idRadar,
    numero: null,
    url: "",
    titulo: construirTitulo(registro.activo, registro.tema),
    estado: "abierto",
    fechaISO: registro.fechaISO,
    fechaTexto: isoATexto(registro.fechaISO),
    division: registro.division,
    persona: registro.persona,
    email: registro.email,
    activo: registro.activo,
    instancias: registro.instancias.slice(),
    tema: registro.tema,
    comentarios: 0,
    creadoEn: ahora.toISOString(),
    actualizadoEn: ahora.toISOString(),
    demo: true
  };
  state.demoLocal.push(reporte);
  state.reportes.push(prepararReporte(reporte));
  state.pendiente = { idRadar: reporte.idRadar, titulo: reporte.titulo, preparadoEn: Date.now(), url: "" };
  refrescarTodo();
  mostrarPanelExito({ modo: "demo", titulo: reporte.titulo });
}

/** Abre una pestaña nueva de forma segura. Devuelve null si el navegador la bloqueó. */
function abrirEnPestana(url) {
  const ventana = window.open(url, "_blank");
  if (ventana) {
    try { ventana.opener = null; } catch (e) { /* sin efecto */ }
  }
  return ventana;
}

/* ==========================================================================
   13. CONFIRMACIÓN Y "ABRIR EL REGISTRO CREADO"
   ========================================================================== */

function mostrarPanelExito({ modo, titulo, url, bloqueado, largo }) {
  $("#report-form").hidden = true;
  const panel = $("#success-panel");
  panel.hidden = false;
  $("#success-summary").textContent = titulo;
  $("#open-created-msg").textContent = "";

  if (modo === "demo") {
    $("#success-title").textContent = "✓ Tema registrado correctamente";
    $("#success-text").textContent = "Modo demostración: el tema se agregó solo en esta sesión del navegador (no se envió a GitHub y desaparece al recargar la página).";
    $("#success-fallback").hidden = true;
    mostrarMensaje("✓ Tema registrado correctamente.", "success");
  } else {
    $("#success-title").textContent = "✓ Reporte preparado correctamente";
    textoConNegrita($("#success-text"), largo
      ? ["Último paso: en la pestaña de GitHub pegue el contenido copiado en la descripción y presione ", { b: "Create" }, ". Si no ha iniciado sesión, GitHub se lo pedirá primero."]
      : ["Último paso: en la pestaña de GitHub revise el reporte y presione ", { b: "Create" }, ". Si no ha iniciado sesión, GitHub se lo pedirá primero."]);
    $("#success-github-link").href = url;
    $("#success-fallback").hidden = false;
    mostrarMensaje("✓ Reporte preparado correctamente.", "success");
    if (bloqueado) {
      mostrarMensaje("⚠ El navegador bloqueó la pestaña de GitHub. Use el enlace «Abrir GitHub nuevamente».", "warning", 9000);
    }
  }
  window.scrollTo(0, 0);
  panel.focus({ preventScroll: true });
}

function buscarPendiente(p) {
  if (!p) return null;
  return state.reportes.find((r) => p.idRadar && r.idRadar === p.idRadar)
    || state.reportes.find((r) => r.titulo === p.titulo && Date.parse(r.creadoEn) >= p.preparadoEn - 120000)
    || null;
}

async function abrirRegistroCreado() {
  const p = state.pendiente;
  const mensaje = $("#open-created-msg");
  if (!p) {
    mensaje.textContent = "No hay un registro reciente en esta sesión.";
    return;
  }

  if (DEMO_MODE) {
    const r = buscarPendiente(p);
    if (r) abrirDetalle(r);
    return;
  }

  // La pestaña se abre durante el clic para que el navegador no la bloquee.
  const ventana = window.open("", "_blank");
  if (ventana) {
    try {
      ventana.opener = null;
      ventana.document.title = "Buscando registro…";
      ventana.document.body.textContent = "Buscando su registro en GitHub…";
    } catch (e) { /* sin efecto */ }
  }
  mensaje.textContent = "Buscando su registro en GitHub…";

  await cargarReportes({ forzar: true, silencioso: true });
  const encontrado = buscarPendiente(p);

  if (encontrado && encontrado.url) {
    if (ventana && !ventana.closed) ventana.location.href = encontrado.url;
    $("#success-title").textContent = "✓ Tema registrado correctamente";
    mensaje.replaceChildren(
      `✓ Registro #${encontrado.numero} creado. `,
      crear("a", { text: "Abrir en GitHub", attrs: { href: encontrado.url, target: "_blank", rel: "noopener noreferrer" } })
    );
    mostrarMensaje("✓ Tema registrado correctamente.", "success");
  } else {
    if (ventana && !ventana.closed) ventana.close();
    if (state.error) {
      mensaje.textContent = `⚠ ${state.error.mensajeUsuario || "No fue posible conectarse con GitHub."}`;
    } else {
      mensaje.replaceChildren(
        "Aún no aparece. Confirme que presionó Create en GitHub y vuelva a intentarlo en unos segundos. ",
        crear("a", { text: "Ver registros en GitHub", attrs: { href: `${urlRepositorio()}/issues`, target: "_blank", rel: "noopener noreferrer" } })
      );
    }
  }
}

/** "Registrar otro tema": limpia el formulario y conserva división y persona. */
function nuevoReporte() {
  const form = $("#report-form");
  form.reset();
  $("#f-fecha").value = fechaLocalISO();
  actualizarFechaVisible();
  combo.seleccion = null;
  $("#f-persona").value = "";
  if (state.ultimoRegistro) {
    $("#f-division").value = state.ultimoRegistro.division;
    elegirPersona(state.ultimoRegistro.persona);
  }
  mostrarCorreoPersona();
  mostrarErroresFormulario({});
  actualizarVistaPrevia();
  $("#success-panel").hidden = true;
  form.hidden = false;
  window.scrollTo(0, 0);
  $("#f-activo").focus({ preventScroll: true });
}

/* ==========================================================================
   14. FILTROS Y BÚSQUEDA
   ========================================================================== */

/** Une las opciones oficiales con valores encontrados en los datos (sin duplicar). */
function unirOpciones(base, valores) {
  const vistos = new Set(base.map(normalizar));
  const extras = [];
  for (const v of valores) {
    if (!v) continue;
    const n = normalizar(v);
    if (!vistos.has(n)) {
      vistos.add(n);
      extras.push(v);
    }
  }
  return base.concat(extras.sort((a, b) => a.localeCompare(b, "es")));
}

function actualizarOpcionesFiltros() {
  const r = state.reportes;
  const personasOrdenadas = PERSONAS.map((p) => p.nombre).sort((a, b) => a.localeCompare(b, "es"));
  llenarSelect($("#flt-division"), unirOpciones(DIVISIONES, r.map((x) => x.division)), "Todas");
  llenarSelect($("#flt-persona"), unirOpciones(personasOrdenadas, r.map((x) => x.persona)), "Todas");
  llenarSelect($("#flt-activo"), unirOpciones(ACTIVOS, r.map((x) => x.activo)), "Todos");
  llenarSelect($("#flt-instancia"), unirOpciones(INSTANCIAS, r.flatMap((x) => x.instancias)), "Todas");
}

function leerFiltros() {
  let desde = $("#flt-desde").value;
  let hasta = $("#flt-hasta").value;
  if (desde && hasta && desde > hasta) {
    [desde, hasta] = [hasta, desde];
    $("#flt-desde").value = desde;
    $("#flt-hasta").value = hasta;
    mostrarMensaje("⚠ La fecha inicial era posterior a la final; se intercambiaron.", "warning");
  }
  return {
    desde: esISOValida(desde) ? desde : "",
    hasta: esISOValida(hasta) ? hasta : "",
    division: $("#flt-division").value,
    persona: $("#flt-persona").value,
    activo: $("#flt-activo").value,
    instancia: $("#flt-instancia").value,
    estado: $("#flt-estado").value || "todos",
    texto: $("#flt-texto").value.trim()
  };
}

/** Aplica todos los filtros combinados. La búsqueda exige que aparezcan todas las palabras. */
function aplicarFiltros(reportes, f) {
  const palabras = normalizar(f.texto).split(/\s+/).filter(Boolean);
  const division = normalizar(f.division);
  const persona = normalizar(f.persona);
  const activo = normalizar(f.activo);
  const instancia = normalizar(f.instancia);

  return reportes.filter((r) => {
    if (f.desde && r.fechaISO < f.desde) return false;
    if (f.hasta && r.fechaISO > f.hasta) return false;
    if (division && r._n.division !== division) return false;
    if (persona && r._n.persona !== persona) return false;
    if (activo && r._n.activo !== activo) return false;
    if (instancia && !r._n.instancias.includes(instancia)) return false;
    if (f.estado !== "todos" && r.estado !== f.estado) return false;
    if (palabras.length && !palabras.every((p) => r._texto.includes(p))) return false;
    return true;
  });
}

function contarFiltrosActivos(f) {
  let n = 0;
  if (f.desde || f.hasta) n += 1;
  for (const clave of ["division", "persona", "activo", "instancia", "texto"]) if (f[clave]) n += 1;
  if (f.estado !== "todos") n += 1;
  return n;
}

function actualizarContadorFiltros() {
  const n = state.filtros ? contarFiltrosActivos(state.filtros) : 0;
  const insignia = $("#filters-count");
  insignia.hidden = n === 0;
  insignia.textContent = n === 1 ? "1 filtro activo" : `${n} filtros activos`;
}

function aplicarPeriodoRapido(valor) {
  const hoy = new Date();
  const a = hoy.getFullYear();
  const m = hoy.getMonth();
  let desde = "";
  let hasta = "";
  switch (valor) {
    case "todo": break;
    case "mes-actual": desde = fechaLocalISO(new Date(a, m, 1)); hasta = fechaLocalISO(new Date(a, m + 1, 0)); break;
    case "mes-anterior": desde = fechaLocalISO(new Date(a, m - 1, 1)); hasta = fechaLocalISO(new Date(a, m, 0)); break;
    case "ultimos-30": desde = fechaLocalISO(restarDias(29)); hasta = fechaLocalISO(hoy); break;
    case "anio-actual": desde = `${a}-01-01`; hasta = `${a}-12-31`; break;
    default: return;
  }
  $("#flt-desde").value = desde;
  $("#flt-hasta").value = hasta;
  refrescarTodo();
}

function limpiarFiltros() {
  for (const id of ["#flt-desde", "#flt-hasta", "#flt-division", "#flt-persona", "#flt-activo", "#flt-instancia", "#flt-texto"]) {
    $(id).value = "";
  }
  $("#flt-estado").value = "todos";
  $("#flt-periodo").value = "todo";
  refrescarTodo();
  mostrarMensaje("Filtros limpiados: se muestra todo lo reportado.", "info", 3000);
}

function iniciarFiltros() {
  $("#flt-periodo").value = "todo";
  $("#flt-periodo").addEventListener("change", (e) => aplicarPeriodoRapido(e.target.value));

  for (const id of ["#flt-desde", "#flt-hasta"]) {
    $(id).addEventListener("change", () => {
      $("#flt-periodo").value = "personalizado";
      refrescarTodo();
    });
  }
  for (const id of ["#flt-division", "#flt-persona", "#flt-activo", "#flt-instancia", "#flt-estado"]) {
    $(id).addEventListener("change", refrescarTodo);
  }
  $("#flt-texto").addEventListener("input", debounce(refrescarTodo, 250));
  $("#flt-texto").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); refrescarTodo(); }
  });

  $("#filters-toggle").addEventListener("click", () => mostrarPanelFiltros($("#filters-body").hidden));

  // En celular los filtros inician plegados para que la tabla quede a la vista.
  if (window.matchMedia && window.matchMedia("(max-width: 760px)").matches) mostrarPanelFiltros(false);
}

function mostrarPanelFiltros(visible) {
  $("#filters-body").hidden = !visible;
  $("#filters-section").classList.toggle("is-collapsed", !visible);
  $("#filters-toggle").textContent = visible ? "Ocultar" : "Mostrar filtros";
  $("#filters-toggle").setAttribute("aria-expanded", String(visible));
}

/* ==========================================================================
   15. TABLA DE REPORTES
   ========================================================================== */

function ordenarReportes(lista) {
  const { clave, dir } = state.orden;
  const factor = dir === "asc" ? 1 : -1;
  const valor = (r) => (clave === "instancias" ? r.instancias.join(", ") : String(r[clave] || ""));
  return [...lista].sort((a, b) => {
    let c = clave === "fechaISO"
      ? valor(a).localeCompare(valor(b))
      : valor(a).localeCompare(valor(b), "es", { sensitivity: "base" });
    if (c === 0) c = String(a.creadoEn || "").localeCompare(String(b.creadoEn || ""));
    return c * factor;
  });
}

function iniciarOrdenTabla() {
  for (const boton of $$(".th-sort")) {
    boton.addEventListener("click", () => {
      const clave = boton.dataset.sort;
      if (state.orden.clave === clave) {
        state.orden.dir = state.orden.dir === "asc" ? "desc" : "asc";
      } else {
        state.orden = { clave, dir: clave === "fechaISO" ? "desc" : "asc" };
      }
      refrescarTodo();
    });
  }
}

function actualizarIndicadoresOrden() {
  for (const boton of $$(".th-sort")) {
    const th = boton.closest("th");
    if (boton.dataset.sort === state.orden.clave) {
      th.setAttribute("aria-sort", state.orden.dir === "asc" ? "ascending" : "descending");
    } else {
      th.removeAttribute("aria-sort");
    }
  }
}

function renderTabla() {
  const cuerpo = $("#reports-tbody");
  cuerpo.replaceChildren();
  actualizarIndicadoresOrden();
  if (!state.cargado || !state.filtrados.length) return;

  const fragmento = document.createDocumentFragment();
  for (const r of state.filtrados) fragmento.append(filaReporte(r));
  cuerpo.append(fragmento);
}

/** Celda con etiqueta para la vista de tarjetas en celular. */
function celda(etiqueta, contenido, clase = "") {
  return crear("td", { className: clase, attrs: { "data-label": etiqueta } }, [crear("div", {}, contenido)]);
}

function filaReporte(r) {
  return crear("tr", {}, [
    celda("Fecha", [r.fechaTexto || isoATexto(r.fechaISO) || "—"], "cell-date"),
    celda("División", [r.division || "—"]),
    celda("Quién reporta", [r.persona || "—", r.email ? crear("span", { className: "cell-sub", text: r.email }) : null], "cell-person"),
    celda("Activo / BL", [r.activo ? crear("span", { className: "chip chip-accent", text: r.activo }) : "—"]),
    celda("Instancia", r.instancias.length ? r.instancias.map((i) => crear("span", { className: "chip", text: i })) : ["—"]),
    celdaTema(r),
    celdaAcciones(r)
  ]);
}

function celdaTema(r) {
  const completo = r.tema || "";
  const largo = completo.length > LIMITE_TRUNCADO;
  const texto = crear("div", { className: "tema-text" });
  const pintar = () => {
    const abierto = state.expandidos.has(r.id);
    texto.textContent = largo && !abierto ? recortar(completo, LIMITE_TRUNCADO) : completo;
    return abierto;
  };
  const abierto = pintar();
  const contenido = [texto];
  if (largo) {
    const boton = crear("button", {
      className: "btn-link tema-toggle",
      text: abierto ? "Ver menos" : "Ver más",
      attrs: { type: "button", "aria-expanded": String(abierto) }
    });
    boton.addEventListener("click", () => {
      if (state.expandidos.has(r.id)) state.expandidos.delete(r.id);
      else state.expandidos.add(r.id);
      const ahora = pintar();
      boton.textContent = ahora ? "Ver menos" : "Ver más";
      boton.setAttribute("aria-expanded", String(ahora));
    });
    contenido.push(boton);
  }
  return celda("Tema y descripción", contenido, "col-tema");
}

function celdaAcciones(r) {
  const contenedor = crear("div", { className: "cell-actions" });
  if (r.url) {
    contenedor.append(crear("a", {
      className: "btn btn-secondary btn-sm",
      text: "Ver / editar",
      attrs: { href: r.url, target: "_blank", rel: "noopener noreferrer", title: `Abrir el registro #${r.numero} en GitHub` }
    }));
  } else {
    const boton = crear("button", { className: "btn btn-secondary btn-sm", text: "Ver / editar", attrs: { type: "button" } });
    boton.addEventListener("click", () => abrirDetalle(r));
    contenedor.append(boton);
  }
  contenedor.append(crear("span", {
    className: `badge ${r.estado === "cerrado" ? "badge-closed" : "badge-open"}`,
    text: r.estado === "cerrado" ? "Cerrado" : "Abierto"
  }));
  const meta = [];
  if (r.numero) meta.push(`#${r.numero}`);
  if (r.comentarios) meta.push(plural(r.comentarios, "comentario", "comentarios"));
  if (meta.length) contenedor.append(crear("span", { className: "meta", text: meta.join(" · ") }));
  return crear("td", { className: "col-accion", attrs: { "data-label": "Acción" } }, [contenedor]);
}

/* ==========================================================================
   16. INDICADORES (RADAR DE GESTIÓN)
   ========================================================================== */

function contar(lista, extraer) {
  const mapa = new Map();
  for (const r of lista) {
    for (const valor of [].concat(extraer(r))) {
      if (!valor) continue;
      mapa.set(valor, (mapa.get(valor) || 0) + 1);
    }
  }
  return mapa;
}

/** Valor con más ocurrencias y si hay empate. */
function mayor(mapa) {
  let top = null;
  for (const [clave, n] of mapa) {
    if (!top || n > top.n || (n === top.n && clave.localeCompare(top.clave, "es") < 0)) top = { clave, n };
  }
  if (!top) return null;
  const empates = [...mapa.values()].filter((n) => n === top.n).length;
  return { ...top, empate: empates > 1 };
}

function renderIndicadores() {
  const lista = state.filtrados;
  const mesActual = fechaLocalISO().slice(0, 7);

  $("#kpi-total").textContent = lista.length.toLocaleString("es-CO");
  $("#kpi-total-sub").textContent = state.filtros && contarFiltrosActivos(state.filtros) ? "según filtros aplicados" : "todo lo reportado";

  $("#kpi-mes").textContent = lista.filter((r) => r.fechaISO.startsWith(mesActual)).length.toLocaleString("es-CO");
  $("#kpi-mes-sub").textContent = nombreMes(mesActual);

  const topActivo = mayor(contar(lista, (r) => r.activo));
  $("#kpi-activo").textContent = topActivo ? topActivo.clave : "—";
  $("#kpi-activo-sub").textContent = topActivo ? `${plural(topActivo.n, "tema", "temas")}${topActivo.empate ? " · empate" : ""}` : "sin datos";

  const topDivision = mayor(contar(lista, (r) => r.division));
  $("#kpi-division").textContent = topDivision ? topDivision.clave : "—";
  $("#kpi-division-sub").textContent = topDivision ? `${plural(topDivision.n, "reporte", "reportes")}${topDivision.empate ? " · empate" : ""}` : "sin datos";

  const ultima = lista.reduce((max, r) => {
    const t = Date.parse(r.actualizadoEn || r.creadoEn || "");
    return isNaN(t) ? max : Math.max(max, t);
  }, 0);
  $("#kpi-actualizacion").textContent = ultima ? isoATexto(fechaLocalISO(new Date(ultima))) : "—";
  $("#kpi-actualizacion-sub").textContent = state.cargadoEn ? `datos consultados a las ${horaTexto(state.cargadoEn)}` : "";
}

/* ==========================================================================
   17. GRÁFICOS (Chart.js)
   ========================================================================== */

function configurarChartJs() {
  if (state.chartConfigurado) return;
  const d = window.Chart.defaults;
  d.font.family = window.getComputedStyle(document.body).fontFamily;
  d.font.size = 12;
  d.color = "#5a6978";
  d.borderColor = "#e8ecf1";
  d.animation = false;
  d.responsive = true;
  d.maintainAspectRatio = false;
  d.plugins.legend.labels.boxWidth = 12;
  d.plugins.tooltip.backgroundColor = "#1b2632";
  state.chartConfigurado = true;
}

function dibujarGrafico(id, configuracion, vacio) {
  const lienzo = document.getElementById(id);
  if (!lienzo) return;
  if (state.graficos[id]) {
    state.graficos[id].destroy();
    delete state.graficos[id];
  }
  const caja = lienzo.parentElement;
  let aviso = caja.querySelector(".chart-empty");
  if (vacio) {
    if (!aviso) {
      aviso = crear("div", { className: "chart-empty", text: "Sin datos para los filtros seleccionados" });
      caja.append(aviso);
    }
    aviso.hidden = false;
    lienzo.hidden = true;
    return;
  }
  if (aviso) aviso.hidden = true;
  lienzo.hidden = false;
  state.graficos[id] = new window.Chart(lienzo, configuracion);
}

function configBarras(etiquetas, valores, { horizontal = false, color = COLOR_PRINCIPAL } = {}) {
  const ejeValor = horizontal ? "x" : "y";
  const ejeCategoria = horizontal ? "y" : "x";
  return {
    type: "bar",
    data: {
      labels: etiquetas,
      datasets: [{ label: "Reportes", data: valores, backgroundColor: color, borderRadius: 4, maxBarThickness: horizontal ? 26 : 46 }]
    },
    options: {
      indexAxis: horizontal ? "y" : "x",
      plugins: { legend: { display: false } },
      scales: {
        [ejeValor]: { beginAtZero: true, ticks: { precision: 0 } },
        [ejeCategoria]: { grid: { display: false }, ticks: { autoSkip: false } }
      }
    }
  };
}

function renderGraficos() {
  if (typeof window.Chart === "undefined") {
    $("#charts-unavailable").hidden = false;
    return;
  }
  $("#charts-unavailable").hidden = true;
  configurarChartJs();

  const lista = state.filtrados;
  const vacio = lista.length === 0;

  // Reportes por Activo / BL (barras)
  const porActivo = contar(lista, (r) => r.activo);
  const activos = unirOpciones(ACTIVOS, [...porActivo.keys()]);
  dibujarGrafico("chart-activo", configBarras(activos, activos.map((a) => porActivo.get(a) || 0)), vacio);

  // Reportes por División (dona)
  const porDivision = contar(lista, (r) => r.division);
  const divisiones = unirOpciones(DIVISIONES, [...porDivision.keys()]).filter((d) => porDivision.get(d));
  dibujarGrafico("chart-division", {
    type: "doughnut",
    data: {
      labels: divisiones,
      datasets: [{
        data: divisiones.map((d) => porDivision.get(d)),
        backgroundColor: divisiones.map((_, i) => PALETA[i % PALETA.length]),
        borderColor: "#ffffff",
        borderWidth: 2
      }]
    },
    options: { cutout: "62%", plugins: { legend: { position: "bottom" } } }
  }, vacio);

  // Reportes por Instancia (barras horizontales; un tema puede contar en varias)
  const porInstancia = contar(lista, (r) => r.instancias);
  const instancias = unirOpciones(INSTANCIAS, [...porInstancia.keys()]);
  dibujarGrafico("chart-instancia", configBarras(
    instancias.map((i) => etiquetaMultilinea(i, 24)),
    instancias.map((i) => porInstancia.get(i) || 0),
    { horizontal: true, color: COLOR_ACENTO }
  ), vacio);

  // Evolución mensual (línea)
  let meses = [];
  if (!vacio) {
    const fechas = lista.map((r) => r.fechaISO).sort();
    let inicio = fechas[0].slice(0, 7);
    let fin = fechas[fechas.length - 1].slice(0, 7);
    const f = state.filtros || {};
    if (f.desde && f.hasta && rangoMeses(f.desde.slice(0, 7), f.hasta.slice(0, 7)).length <= 36) {
      inicio = f.desde.slice(0, 7);
      fin = f.hasta.slice(0, 7);
    }
    meses = rangoMeses(inicio, fin);
  }
  const porMes = contar(lista, (r) => r.fechaISO.slice(0, 7));
  dibujarGrafico("chart-mensual", {
    type: "line",
    data: {
      labels: meses.map(mesCorto),
      datasets: [{
        label: "Reportes",
        data: meses.map((m) => porMes.get(m) || 0),
        borderColor: COLOR_PRINCIPAL,
        backgroundColor: "rgba(15, 138, 126, 0.12)",
        fill: true,
        cubicInterpolationMode: "monotone",
        pointRadius: 3,
        pointBackgroundColor: COLOR_PRINCIPAL
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } }
    }
  }, vacio);

  // Reportes por persona (barras horizontales, principales resultados)
  const porPersona = [...contar(lista, (r) => r.persona).entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));
  const principales = porPersona.slice(0, CONFIG.topPeopleInChart);
  $("#chart-persona-note").textContent = porPersona.length > principales.length
    ? `(${principales.length} principales de ${porPersona.length})`
    : "";
  $("#chart-persona-box").style.height = `${Math.max(200, principales.length * 34 + 50)}px`;
  dibujarGrafico("chart-persona", configBarras(
    principales.map(([nombre]) => etiquetaMultilinea(nombre, 28)),
    principales.map(([, n]) => n),
    { horizontal: true, color: "#4f7cac" }
  ), vacio);
}

/* ==========================================================================
   18. INFORME DE TEMAS REPORTADOS
   ========================================================================== */

/** Describe los filtros en texto (se usa en pantalla y en el Excel). */
function describirFiltros(f, lista) {
  let periodo;
  if (f.desde && f.hasta) periodo = `${isoATexto(f.desde)} – ${isoATexto(f.hasta)}`;
  else if (f.desde) periodo = `Desde ${isoATexto(f.desde)}`;
  else if (f.hasta) periodo = `Hasta ${isoATexto(f.hasta)}`;
  else if (lista.length) {
    const fechas = lista.map((r) => r.fechaISO).sort();
    periodo = `Todo lo reportado (${isoATexto(fechas[0])} – ${isoATexto(fechas[fechas.length - 1])})`;
  } else periodo = "Todo lo reportado";

  const filas = [
    ["Periodo analizado", periodo],
    ["División", f.division || "Todas"],
    ["Activo / BL", f.activo || "Todos"],
    ["Instancia", f.instancia || "Todas"],
    ["Quién reporta", f.persona || "Todas las personas"],
    ["Estado", { todos: "Todos", abierto: "Abiertos", cerrado: "Cerrados" }[f.estado] || "Todos"]
  ];
  if (f.texto) filas.push(["Búsqueda", `“${f.texto}”`]);
  return filas;
}

function renderInforme() {
  const f = state.filtros || leerFiltros();
  const lista = state.filtrados;

  const meta = $("#report-meta");
  meta.replaceChildren();
  for (const [etiqueta, valor] of describirFiltros(f, lista)) {
    meta.append(crear("dt", { text: `${etiqueta}:` }), crear("dd", { text: valor }));
  }
  $("#report-total").textContent = lista.length.toLocaleString("es-CO");
  $("#report-empty").hidden = !(state.cargado && !lista.length && !state.sinConfigurar);

  const cuerpo = $("#report-tbody");
  cuerpo.replaceChildren();
  const fragmento = document.createDocumentFragment();
  for (const r of lista) {
    fragmento.append(crear("tr", {}, [
      celda("Fecha", [r.fechaTexto || "—"], "cell-date"),
      celda("División", [r.division || "—"]),
      celda("Quién reporta", [r.persona || "—"]),
      celda("Activo / BL", [r.activo || "—"]),
      celda("Instancia", [r.instancias.join("; ") || "—"]),
      celda("Tema y descripción", [crear("div", { className: "tema-text", text: r.tema })], "col-tema"),
      celda("N.º", [r.numero ? `#${r.numero}` : "—"])
    ]));
  }
  cuerpo.append(fragmento);

  $("#report-footer").textContent = `Informe generado el ${fechaHoraTexto(new Date())} · Fuente: ${fuenteDeDatos().nombre}`;
}

/* ==========================================================================
   19. EXPORTAR A EXCEL (SheetJS)
   ========================================================================== */

function exportarExcel(reportes, { todos = false } = {}) {
  if (typeof window.XLSX === "undefined") {
    mostrarMensaje("⚠ No fue posible cargar la librería de Excel. Revise su conexión y recargue la página.", "error", 8000);
    return;
  }
  if (state.cargando && !state.cargado) {
    mostrarMensaje("Espere a que terminen de cargar los reportes.", "info");
    return;
  }
  if (!reportes.length) {
    mostrarMensaje("⚠ No se encontraron reportes para los filtros seleccionados.", "warning");
    return;
  }

  const XLSX = window.XLSX;
  const encabezados = ["Fecha", "División", "Quién reporta", "Email", "Activo / BL", "Instancia", "Tema y descripción", "Número del Issue", "URL del Issue"];
  const filas = reportes.map((r) => [
    esISOValida(r.fechaISO) ? serialExcel(r.fechaISO) : (r.fechaTexto || ""),
    r.division || "",
    r.persona || "",
    r.email || "",
    r.activo || "",
    r.instancias.join("; "),
    r.tema.length > LIMITE_CELDA_EXCEL ? `${r.tema.slice(0, LIMITE_CELDA_EXCEL)}… [texto recortado; ver el Issue]` : r.tema,
    r.numero || (r.demo ? "Demo" : ""),
    r.url || (r.demo ? "(registro de demostración)" : "")
  ]);

  const hoja = XLSX.utils.aoa_to_sheet([encabezados, ...filas]);

  // Formato de fecha DD/MM/AAAA y enlaces clicables en la URL
  filas.forEach((_, i) => {
    const celdaFecha = hoja[XLSX.utils.encode_cell({ r: i + 1, c: 0 })];
    if (celdaFecha && typeof celdaFecha.v === "number") celdaFecha.z = "dd/mm/yyyy";
    const url = reportes[i].url;
    const celdaUrl = hoja[XLSX.utils.encode_cell({ r: i + 1, c: 8 })];
    if (celdaUrl && url) celdaUrl.l = { Target: url, Tooltip: "Abrir en GitHub" };
  });

  hoja["!cols"] = [
    { wch: 12 }, { wch: 24 }, { wch: 36 }, { wch: 32 }, { wch: 14 },
    { wch: 42 }, { wch: 100 }, { wch: 16 }, { wch: 55 }
  ];
  hoja["!autofilter"] = { ref: `A1:I${filas.length + 1}` };

  // Hoja de criterios: deja constancia de los filtros usados
  const f = todos ? { desde: "", hasta: "", division: "", persona: "", activo: "", instancia: "", estado: "todos", texto: "" } : state.filtros;
  const criterios = [
    ["Radar Semanal de Sostenibilidad"],
    [todos ? "Descarga: todos los reportes" : "Descarga: informe según filtros"],
    [],
    ...describirFiltros(f, reportes),
    ["Total de temas identificados", reportes.length],
    [],
    ["Generado el", fechaHoraTexto(new Date())],
    ["Fuente", fuenteDeDatos().nombre]
  ];
  const hojaCriterios = XLSX.utils.aoa_to_sheet(criterios);
  hojaCriterios["!cols"] = [{ wch: 30 }, { wch: 70 }];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Reportes");
  XLSX.utils.book_append_sheet(libro, hojaCriterios, "Criterios");

  const nombre = todos
    ? `Radar_Sostenibilidad_Todos_${fechaLocalISO()}.xlsx`
    : `Radar_Sostenibilidad_${fechaLocalISO()}.xlsx`;

  try {
    XLSX.writeFile(libro, nombre, { compression: true });
    mostrarMensaje(`✓ Archivo Excel generado (${plural(reportes.length, "reporte", "reportes")}).`, "success");
  } catch (error) {
    mostrarMensaje("⚠ No fue posible generar el archivo Excel.", "error", 8000);
  }
}

/* ==========================================================================
   20. DIÁLOGOS
   ========================================================================== */

function abrirDialogo(selector) {
  const dialogo = $(selector);
  if (!dialogo) return;
  if (typeof dialogo.showModal === "function") {
    if (!dialogo.open) dialogo.showModal();
  } else {
    dialogo.setAttribute("open", "");
  }
}

function cerrarDialogo(dialogo) {
  if (!dialogo) return;
  if (typeof dialogo.close === "function") dialogo.close();
  else dialogo.removeAttribute("open");
}

/** Detalle de un reporte (se usa en modo demo, donde no hay Issue en GitHub). */
function abrirDetalle(r) {
  const cuerpo = $("#detail-body");
  const lista = crear("dl", { className: "detail-list" });
  const filas = [
    ["Fecha", r.fechaTexto],
    ["División", r.division],
    ["Quién reporta", r.persona],
    ["Email", r.email || "No registrado"],
    ["Activo / BL", r.activo],
    ["Instancia", r.instancias.join("; ")],
    ["Estado", r.estado === "cerrado" ? "Cerrado" : "Abierto"]
  ];
  for (const [etiqueta, valor] of filas) {
    lista.append(crear("dt", { text: etiqueta }), crear("dd", { text: valor || "—" }));
  }
  cuerpo.replaceChildren(
    crear("p", { className: "alert alert-info", text: "Modo demostración: este registro no existe en GitHub. Con el repositorio real, «Ver / editar» abre el registro original en GitHub para corregirlo, ampliarlo, comentarlo o consultar su historial." }),
    lista,
    crear("p", { className: "field-label", text: "Tema y descripción" }),
    crear("div", { className: "tema-text", text: r.tema })
  );
  abrirDialogo("#detail-dialog");
}

function abrirDialogoCopiar(cuerpo, url, titulo) {
  state.copia = { cuerpo, url, titulo };
  $("#copy-text").value = cuerpo;
  $("#copy-msg").textContent = "";
  abrirDialogo("#copy-dialog");
}

async function copiarCuerpo() {
  const texto = state.copia.cuerpo || "";
  const area = $("#copy-text");
  let copiado = false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      copiado = true;
    }
  } catch (e) {
    copiado = false;
  }
  if (!copiado) {
    area.focus();
    area.select();
    try { copiado = document.execCommand("copy"); } catch (e) { copiado = false; }
  }
  $("#copy-msg").textContent = copiado
    ? "✓ Contenido copiado. Ahora presione «Abrir GitHub»."
    : "Seleccione todo el texto del recuadro y cópielo (Ctrl+C); luego presione «Abrir GitHub».";
}

function abrirLargoEnGitHub() {
  const { url, titulo } = state.copia;
  const ventana = abrirEnPestana(url);
  cerrarDialogo($("#copy-dialog"));
  mostrarPanelExito({ modo: "github", titulo, url, bloqueado: !ventana, largo: true });
}

/* ==========================================================================
   21. ARRANQUE DE LA APLICACIÓN
   ========================================================================== */

/** Todos los botones con data-action se atienden aquí. */
function atenderAcciones(evento) {
  const boton = evento.target.closest("[data-action]");
  if (!boton) return;
  switch (boton.dataset.action) {
    case "apply-filters":
      refrescarTodo();
      if (state.cargado && !state.sinConfigurar) {
        if (state.filtrados.length) {
          mostrarMensaje(`✓ Filtros aplicados: ${plural(state.filtrados.length, "reporte", "reportes")}.`, "success", 3000);
        } else {
          mostrarMensaje("⚠ No se encontraron reportes para los filtros seleccionados.", "warning");
        }
      }
      break;
    case "clear-filters":
      limpiarFiltros();
      break;
    case "refresh":
    case "retry":
      cargarReportes({ forzar: true }).then(() => {
        if (!state.error && !state.sinConfigurar) mostrarMensaje("✓ Datos actualizados.", "success", 3000);
      });
      break;
    case "excel-filtered":
      exportarExcel(state.filtrados, { todos: false });
      break;
    case "excel-all":
      exportarExcel(ordenarReportes(state.reportes), { todos: true });
      break;
    case "print":
      window.print();
      break;
    case "new-report":
      nuevoReporte();
      break;
    case "open-created":
      abrirRegistroCreado();
      break;
    case "help-edit":
      abrirDialogo("#help-dialog");
      break;
    case "close-dialog":
      cerrarDialogo(boton.closest("dialog"));
      break;
    case "copy-body":
      copiarCuerpo();
      break;
    case "open-long":
      abrirLargoEnGitHub();
      break;
    default:
      break;
  }
}

function iniciar() {
  const configurado = configuracionCompleta();

  $("#demo-badge").hidden = !DEMO_MODE;
  $("#config-alert").hidden = DEMO_MODE || configurado;
  if (!DEMO_MODE && configurado) {
    const enlace = $("#github-link");
    enlace.href = `${urlRepositorio()}/issues`;
    enlace.hidden = false;
  }
  $("#form-note").textContent = DEMO_MODE
    ? "Modo demostración: el tema se guarda solo en esta sesión y no se envía a GitHub."
    : "Al presionar Registrar tema se abrirá GitHub con el reporte listo: solo debe presionar Create (requiere una cuenta gratuita de GitHub con sesión iniciada).";

  iniciarFormulario();
  iniciarFiltros();
  iniciarOrdenTabla();
  document.addEventListener("click", atenderAcciones);
  window.addEventListener("hashchange", () => mostrarVista(vistaDesdeHash()));

  mostrarVista(vistaDesdeHash());
  if (!state.cargado && !state.cargando) cargarReportes();
}

document.addEventListener("DOMContentLoaded", iniciar);
