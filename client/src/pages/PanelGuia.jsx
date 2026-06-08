import { useState, useEffect } from "react";
import fondoDino from '../assets/fondo-dino.png';

const API = "http://localhost:3000/api/experiencias";
const API_MENU = "http://localhost:3000/api/menu";
const API_RESERVAS = "http://localhost:3000/api/reservas";

function getToken() { return localStorage.getItem("token"); }
function getUser() { return JSON.parse(localStorage.getItem("user") || "null"); }

export default function PanelGuia() {
  const [productos, setProductos] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [tabActiva, setTabActiva] = useState("tours");
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [menuModal, setMenuModal] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [nuevoItem, setNuevoItem] = useState({ nombre: "", categoria: "plato_principal", precio: "", descripcion: "" });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [rechazandoId, setRechazandoId] = useState(null);
  const user = getUser();
  const esGastronomico = user?.rol === "guia_gastronomico";

  const [form, setForm] = useState({
    titulo: "", descripcion: "",
    categoria: esGastronomico ? "gastronomia" : "tour_turistico",
    precio: "", duracion: "", capacidad: "", imagen_url: "",
    tipo_especifico: "", horario: "", direccion: "", incluye: "", punto_encuentro: "",
  });

  useEffect(() => { cargar(); cargarSolicitudes(); }, []);

  async function cargar() {
    try {
      const res = await fetch(`${API}/mis-experiencias`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      setProductos(Array.isArray(data) ? data : []);
    } catch { setProductos([]); }
  }

  async function cargarSolicitudes() {
    try {
      const res = await fetch(`${API_RESERVAS}/mis-solicitudes`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      setSolicitudes(Array.isArray(data) ? data : []);
    } catch { setSolicitudes([]); }
  }

  async function responderReserva(id, estado, motivo = "") {
    try {
      const res = await fetch(`${API_RESERVAS}/${id}/responder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ estado, motivo_rechazo: motivo })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Reserva ${estado} correctamente ✓`);
        setRechazandoId(null); setMotivoRechazo("");
        cargarSolicitudes();
        setTimeout(() => setSuccess(""), 3000);
      } else { setError(data.message); }
    } catch { setError("Error de conexión"); }
  }

  function resetForm() {
    setForm({ titulo: "", descripcion: "", categoria: esGastronomico ? "gastronomia" : "tour_turistico", precio: "", duracion: "", capacidad: "", imagen_url: "", tipo_especifico: "", horario: "", direccion: "", incluye: "", punto_encuentro: "" });
  }

  function abrirCrear() { setEditando(null); resetForm(); setError(""); setModal(true); }

  function abrirEditar(p) {
    setEditando(p);
    setForm({ titulo: p.titulo, descripcion: p.descripcion, categoria: p.categoria, precio: p.precio, duracion: p.duracion, capacidad: p.capacidad, imagen_url: p.imagen_url || "", tipo_especifico: p.tipo_especifico || "", horario: p.horario || "", direccion: p.direccion || "", incluye: p.incluye || "", punto_encuentro: p.punto_encuentro || "" });
    setError(""); setModal(true);
  }

  async function abrirMenu(p) {
    setMenuModal(p);
    try {
      const res = await fetch(`${API_MENU}/${p.id}`);
      const data = await res.json();
      setMenuItems(Array.isArray(data) ? data : []);
    } catch { setMenuItems([]); }
  }

  async function guardar() {
    if (!form.titulo || !form.descripcion) { setError("El título y descripción son obligatorios"); return; }
    if (!esGastronomico && (!form.precio || !form.duracion || !form.capacidad)) { setError("Completa precio, duración y capacidad"); return; }
    setLoading(true);
    try {
      const body = { ...form, precio: parseFloat(form.precio || 0), duracion: parseFloat(form.duracion || 0), capacidad: parseInt(form.capacidad || 0) };
      const url = editando ? `${API}/${editando.id}` : API;
      const method = editando ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Error al guardar"); return; }
      setSuccess(editando ? "Producto actualizado ✓" : "Producto creado ✓");
      setModal(false); cargar();
      setTimeout(() => setSuccess(""), 4000);
    } catch { setError("Error de conexión"); }
    finally { setLoading(false); }
  }

  async function agregarItem() {
    if (!nuevoItem.nombre || !nuevoItem.precio) { setError("Nombre y precio son obligatorios"); return; }
    try {
      await fetch(API_MENU, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ ...nuevoItem, producto_id: menuModal.id, precio: parseFloat(nuevoItem.precio) }) });
      setNuevoItem({ nombre: "", categoria: "plato_principal", precio: "", descripcion: "" });
      const res = await fetch(`${API_MENU}/${menuModal.id}`);
      setMenuItems(Array.isArray(await res.json()) ? await res.json() : []);
    } catch { setError("Error al agregar ítem"); }
  }

  async function eliminarItem(id) {
    await fetch(`${API_MENU}/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    const res = await fetch(`${API_MENU}/${menuModal.id}`);
    const data = await res.json();
    setMenuItems(Array.isArray(data) ? data : []);
  }

  const estadoStyle = {
    pendiente: { bg: "#fffbeb", color: "#d97706", label: "⏳ Pendiente de aprobación" },
    aprobada: { bg: "#f0fdf4", color: "#059669", label: "✅ Aprobado y publicado" },
    rechazada: { bg: "#fef2f2", color: "#dc2626", label: "❌ Rechazado" },
  };
  const estadoReserva = {
    pendiente: { bg: "#fffbeb", color: "#d97706", label: "⏳ Pendiente" },
    aceptada: { bg: "#f0fdf4", color: "#059669", label: "✅ Aceptada" },
    rechazada: { bg: "#fef2f2", color: "#dc2626", label: "❌ Rechazada" },
  };
  const catItems = { entrada: "🥗 Entrada", plato_principal: "🍽️ Plato principal", bebida: "🥤 Bebida", postre: "🍮 Postre", otro: "🍴 Otro" };
  const tiposTurismo = ["Cultural", "Histórico", "Naturaleza", "Aventura", "Arquitectónico", "Religioso"];
  const tiposGastronomia = ["Boliviana", "Internacional", "Fusión", "Vegetariana", "Panadería/Café", "Mariscos"];
  const solicitudesPendientes = solicitudes.filter(s => s.estado === "pendiente").length;

  return (
    <div style={styles.page}>
      <div style={{ ...styles.header, background: esGastronomico ? "linear-gradient(135deg,#92400e,#d97706)" : "linear-gradient(135deg,#1a0000,#7f1d1d,#1a0000)" }}>
        <div style={styles.headerLeft}>
          <span style={{ fontSize: 24 }}>{esGastronomico ? "🍽️" : "🗺️"}</span>
          <div>
            <h1 style={styles.headerTitle}>{esGastronomico ? "Panel Guía Gastronómico" : "Panel Guía Turístico"}</h1>
            <p style={styles.headerSub}>Gestiona tus {esGastronomico ? "restaurantes y menús" : "tours y excursiones"}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/experiencias" style={styles.navBtn}>🌐 Ver productos</a>
          <button onClick={() => { localStorage.clear(); window.location.href = "/login"; }} style={styles.logoutBtn}>🚪 Salir</button>
        </div>
      </div>

      <div style={styles.container}>
        {success && <div style={styles.successMsg}>✅ {success}</div>}
        {error && !modal && !menuModal && <div style={styles.errorMsg}>⚠️ {error}</div>}

        {/* Stats */}
        <div style={styles.statsRow}>
          {[
            { label: "Total", value: productos.length, color: "#7c3aed", icon: "📋" },
            { label: "Aprobados", value: productos.filter(p => p.estado === "aprobada").length, color: "#059669", icon: "✅" },
            { label: "Pendientes", value: productos.filter(p => p.estado === "pendiente").length, color: "#d97706", icon: "⏳" },
            { label: "Rechazados", value: productos.filter(p => p.estado === "rechazada").length, color: "#dc2626", icon: "❌" },
            { label: "Solicitudes", value: solicitudesPendientes, color: "#0ea5e9", icon: "🎫" },
          ].map(s => (
            <div key={s.label} style={{ ...styles.statCard, borderLeft: `4px solid ${s.color}` }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button onClick={() => setTabActiva("tours")} style={{ ...styles.tab, ...(tabActiva === "tours" ? styles.tabActiva : {}) }}>
            {esGastronomico ? "🍽️ Mis Locales" : "🗺️ Mis Tours"}
          </button>
          <button onClick={() => setTabActiva("solicitudes")} style={{ ...styles.tab, ...(tabActiva === "solicitudes" ? styles.tabActiva : {}) }}>
            🎫 Solicitudes de Reserva
            {solicitudesPendientes > 0 && <span style={styles.badge}>{solicitudesPendientes}</span>}
          </button>
        </div>

        {/* Tab Tours */}
        {tabActiva === "tours" && (
          <>
            <div style={styles.infoBox}><span>💡</span><span>Los productos que crees serán revisados por el administrador antes de publicarse.</span></div>
            <div style={styles.toolbar}>
              <h2 style={styles.sectionTitle}>Mis {esGastronomico ? "Restaurantes/Locales" : "Tours"}</h2>
              <button onClick={abrirCrear} style={{ ...styles.btnPrimary, background: esGastronomico ? "linear-gradient(135deg,#d97706,#92400e)" : "linear-gradient(135deg,#2563eb,#0ea5e9)" }}>
                ➕ {esGastronomico ? "Nuevo local/menú" : "Nuevo tour"}
              </button>
            </div>
            {productos.length === 0 ? (
              <div style={styles.empty}>
                <p style={{ fontSize: "3rem", margin: 0 }}>{esGastronomico ? "🍽️" : "🗺️"}</p>
                <p style={{ color: "#64748b", margin: "0.5rem 0 0" }}>No has creado productos aún</p>
              </div>
            ) : (
              <div style={styles.grid}>
                {productos.map(p => {
                  const est = estadoStyle[p.estado] || estadoStyle.pendiente;
                  return (
                    <div key={p.id} style={styles.card}>
                      <div style={styles.cardImg}>
                        {p.imagen_url ? <img src={p.imagen_url} alt={p.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} /> : <div style={styles.imgPlaceholder}>{esGastronomico ? "🍽️" : "🗺️"}</div>}
                        <span style={{ ...styles.estadoBadge, background: est.bg, color: est.color }}>{est.label}</span>
                      </div>
                      <div style={styles.cardBody}>
                        <h3 style={styles.cardTitle}>{p.titulo}</h3>
                        <p style={styles.cardDesc}>{p.descripcion}</p>
                        <div style={styles.cardMeta}>
                          <span>💰 Bs. {p.precio}/persona</span>
                          <span>⏱️ {p.duracion}h</span>
                          <span>👥 Máx. {p.capacidad}</span>
                        </div>
                        {p.motivo_rechazo && <div style={styles.rechazadoBox}><strong>Motivo:</strong> {p.motivo_rechazo}</div>}
                        <div style={styles.cardActions}>
                          <button onClick={() => abrirEditar(p)} style={styles.btnEdit}>✏️ Editar</button>
                          {esGastronomico && <button onClick={() => abrirMenu(p)} style={styles.btnMenu}>🍴 Gestionar carta</button>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Tab Solicitudes */}
        {tabActiva === "solicitudes" && (
          <>
            <div style={styles.toolbar}>
              <h2 style={styles.sectionTitle}>🎫 Solicitudes de Reserva</h2>
              <button onClick={cargarSolicitudes} style={styles.btnRefresh}>🔄 Actualizar</button>
            </div>
            {solicitudes.length === 0 ? (
              <div style={styles.empty}>
                <p style={{ fontSize: "3rem", margin: 0 }}>🎫</p>
                <p style={{ color: "#64748b", margin: "0.5rem 0 0" }}>No tienes solicitudes de reserva aún</p>
              </div>
            ) : (
              <div style={styles.solicitudesGrid}>
                {solicitudes.map(s => {
                  const est = estadoReserva[s.estado] || estadoReserva.pendiente;
                  return (
                    <div key={s.id} style={styles.solicitudCard}>
                      <div style={styles.solicitudHeader}>
                        <div>
                          <h3 style={styles.solicitudTitulo}>{s.experiencia_titulo}</h3>
                          <p style={styles.solicitudFecha}>Solicitado el {new Date(s.created_at).toLocaleDateString("es-BO")}</p>
                        </div>
                        <span style={{ ...styles.estadoTag, background: est.bg, color: est.color }}>{est.label}</span>
                      </div>
                      <div style={styles.solicitudInfo}>
                        <div style={styles.infoItem}><span style={styles.infoLabel}>👤 Turista</span><span>{s.turista_nombre}</span></div>
                        <div style={styles.infoItem}><span style={styles.infoLabel}>✉️ Email</span><span>{s.turista_email}</span></div>
                        <div style={styles.infoItem}><span style={styles.infoLabel}>📅 Fecha deseada</span><span>{new Date(s.fecha + "T00:00:00").toLocaleDateString("es-BO")}</span></div>
                        <div style={styles.infoItem}><span style={styles.infoLabel}>👥 Personas</span><span>{s.num_personas}</span></div>
                        <div style={styles.infoItem}><span style={styles.infoLabel}>💰 Total estimado</span><span style={{ fontWeight: 700, color: "#2563eb" }}>Bs. {(s.precio * s.num_personas).toFixed(2)}</span></div>
                        {s.comentario && <div style={{ ...styles.infoItem, gridColumn: "1/-1" }}><span style={styles.infoLabel}>💬 Comentario</span><span>{s.comentario}</span></div>}
                      </div>
                      {s.estado === "pendiente" && (
                        <div style={styles.solicitudAcciones}>
                          {rechazandoId === s.id ? (
                            <div style={styles.motivoBox}>
                              <input placeholder="Motivo del rechazo (opcional)" value={motivoRechazo} onChange={e => setMotivoRechazo(e.target.value)} style={styles.motivoInput} />
                              <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => responderReserva(s.id, "rechazada", motivoRechazo)} style={styles.btnRechazar}>Confirmar rechazo</button>
                                <button onClick={() => setRechazandoId(null)} style={styles.btnCancelar}>Cancelar</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <button onClick={() => responderReserva(s.id, "aceptada")} style={styles.btnAceptar}>✅ Aceptar</button>
                              <button onClick={() => { setRechazandoId(s.id); setMotivoRechazo(""); }} style={styles.btnRechazar}>❌ Rechazar</button>
                            </>
                          )}
                        </div>
                      )}
                      {s.estado === "rechazada" && s.motivo_rechazo && <div style={styles.rechazadoBox}><strong>Motivo:</strong> {s.motivo_rechazo}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal crear/editar */}
      {modal && (
        <div style={styles.overlay} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{editando ? "✏️ Editar producto" : `➕ ${esGastronomico ? "Nuevo local/menú" : "Nuevo tour"}`}</h3>
              <button onClick={() => setModal(false)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.fg}><label style={styles.label}>Nombre *</label><input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} style={styles.input} /></div>
              <div style={styles.fg}><label style={styles.label}>Descripción *</label><textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} style={{ ...styles.input, height: 80, resize: "vertical" }} /></div>
              <div style={styles.fg}><label style={styles.label}>{esGastronomico ? "Tipo de cocina" : "Tipo de tour"}</label><select value={form.tipo_especifico} onChange={e => setForm({ ...form, tipo_especifico: e.target.value })} style={styles.input}><option value="">Selecciona...</option>{(esGastronomico ? tiposGastronomia : tiposTurismo).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              {!esGastronomico && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={styles.fg}><label style={styles.label}>Precio (Bs.) *</label><input type="number" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} style={styles.input} /></div>
                    <div style={styles.fg}><label style={styles.label}>Duración (h) *</label><input type="number" value={form.duracion} onChange={e => setForm({ ...form, duracion: e.target.value })} step="0.5" style={styles.input} /></div>
                  </div>
                  <div style={styles.fg}><label style={styles.label}>Capacidad máxima *</label><input type="number" value={form.capacidad} onChange={e => setForm({ ...form, capacidad: e.target.value })} style={styles.input} /></div>
                  <div style={styles.fg}><label style={styles.label}>Punto de encuentro</label><input value={form.punto_encuentro} onChange={e => setForm({ ...form, punto_encuentro: e.target.value })} style={styles.input} /></div>
                </>
              )}
              {esGastronomico && (
                <>
                  <div style={styles.fg}><label style={styles.label}>Horario</label><input value={form.horario} onChange={e => setForm({ ...form, horario: e.target.value })} style={styles.input} /></div>
                  <div style={styles.fg}><label style={styles.label}>Dirección</label><input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} style={styles.input} /></div>
                  <div style={styles.fg}><label style={styles.label}>Capacidad *</label><input type="number" value={form.capacidad} onChange={e => setForm({ ...form, capacidad: e.target.value })} style={styles.input} /></div>
                </>
              )}
              <div style={styles.fg}>
                <label style={styles.label}>URL de imagen</label>
                <input value={form.imagen_url} onChange={e => setForm({ ...form, imagen_url: e.target.value })} placeholder="https://ejemplo.com/foto.jpg" style={styles.input} />
                {form.imagen_url && <img src={form.imagen_url} alt="preview" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8, marginTop: 6 }} onError={e => e.target.style.display = "none"} />}
              </div>
              {error && <div style={styles.errorMsg}>⚠️ {error}</div>}
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setModal(false)} style={styles.btnCancel}>Cancelar</button>
              <button onClick={guardar} disabled={loading} style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1, background: esGastronomico ? "linear-gradient(135deg,#d97706,#92400e)" : "linear-gradient(135deg,#2563eb,#0ea5e9)" }}>
                {loading ? "Guardando..." : editando ? "Guardar cambios" : "Crear producto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal carta */}
      {menuModal && (
        <div style={styles.overlay} onClick={e => e.target === e.currentTarget && setMenuModal(null)}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>🍴 Carta — {menuModal.titulo}</h3>
              <button onClick={() => setMenuModal(null)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={{ background: "#fffbeb", borderRadius: 12, padding: "1rem", border: "1.5px solid #fde68a" }}>
                <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.88rem", fontWeight: 700, color: "#92400e" }}>➕ Agregar a la carta</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <div style={styles.fg}><label style={styles.label}>Nombre *</label><input value={nuevoItem.nombre} onChange={e => setNuevoItem({ ...nuevoItem, nombre: e.target.value })} style={styles.input} /></div>
                  <div style={styles.fg}><label style={styles.label}>Precio (Bs.) *</label><input type="number" value={nuevoItem.precio} onChange={e => setNuevoItem({ ...nuevoItem, precio: e.target.value })} style={styles.input} /></div>
                </div>
                <button onClick={agregarItem} style={{ ...styles.btnPrimary, background: "linear-gradient(135deg,#d97706,#92400e)", width: "100%" }}>➕ Agregar</button>
              </div>
              <div>
                {menuItems.length === 0 ? <div style={{ textAlign: "center", padding: "1.5rem", color: "#94a3b8" }}>No hay ítems aún</div> :
                  menuItems.map(item => (
                    <div key={item.id} style={styles.menuItem}>
                      <div style={{ flex: 1 }}><span style={{ fontWeight: 600 }}>{item.nombre}</span></div>
                      <span style={{ fontWeight: 700, color: "#d97706" }}>Bs. {item.precio}</span>
                      <button onClick={() => eliminarItem(item.id)} style={{ ...styles.btnDelete, padding: "0.2rem 0.5rem" }}>🗑️</button>
                    </div>
                  ))
                }
              </div>
            </div>
            <div style={styles.modalFooter}><button onClick={() => setMenuModal(null)} style={styles.btnCancel}>Cerrar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {minHeight: "100vh",backgroundImage: `url(${fondoDino})`,backgroundSize: "cover",backgroundPosition: "center",backgroundRepeat: "no-repeat",backgroundAttachment: "fixed",fontFamily: "'Segoe UI',system-ui,sans-serif"},
  header: { padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 12px rgba(0,0,0,0.2)" },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  headerTitle: { fontSize: "1rem", fontWeight: 700, color: "#fff", margin: 0 },
  headerSub: { fontSize: "0.75rem", color: "rgba(255,255,255,0.75)", margin: 0 },
  navBtn: { background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 8, padding: "0.4rem 0.85rem", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" },
  logoutBtn: { background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 8, padding: "0.4rem 0.85rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" },
  container: { maxWidth: 1000, margin: "0 auto", padding: "2rem 1.5rem" },
  successMsg: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: 8, padding: "0.7rem 1rem", marginBottom: "1rem", fontSize: "0.88rem" },
  errorMsg: { background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 8, padding: "0.7rem 1rem", marginBottom: "1rem", fontSize: "0.84rem" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "1rem", marginBottom: "1rem" },
  statCard: { background: "rgba(255,255,255,0.92)", borderRadius: 12, padding: "1rem 1.25rem", boxShadow: "0 2px 10px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: 12 },
  infoBox: { background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "0.75rem 1rem", marginBottom: "1.25rem", display: "flex", gap: 8, fontSize: "0.85rem", color: "#1d4ed8" },
  tabs: { display: "flex", gap: 4, marginBottom: "1.5rem", background: "#f1f5f9", borderRadius: 12, padding: 4 },
  tab: { flex: 1, padding: "0.65rem 1rem", border: "none", borderRadius: 10, fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", background: "transparent", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  tabActiva: { background: "#fff", color: "#1e293b", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
  badge: { background: "#ef4444", color: "#fff", borderRadius: 20, padding: "0.1rem 0.5rem", fontSize: "0.75rem", fontWeight: 700 },
  toolbar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" },
  sectionTitle: { fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", margin: 0 },
  btnPrimary: { color: "#fff", border: "none", borderRadius: 10, padding: "0.65rem 1.3rem", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" },
  btnRefresh: { background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 10, padding: "0.65rem 1.2rem", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" },
  btnEdit: { background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 7, padding: "0.35rem 0.85rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" },
  btnMenu: { background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a", borderRadius: 7, padding: "0.35rem 0.85rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" },
  btnDelete: { background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 7, padding: "0.35rem 0.75rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" },
  btnCancel: { background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 9, padding: "0.65rem 1.2rem", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" },
  btnAceptar: { background: "linear-gradient(135deg,#059669,#10b981)", color: "#fff", border: "none", borderRadius: 8, padding: "0.55rem 1.2rem", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" },
  btnRechazar: { background: "linear-gradient(135deg,#dc2626,#ef4444)", color: "#fff", border: "none", borderRadius: 8, padding: "0.55rem 1.2rem", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" },
  btnCancelar: { background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, padding: "0.55rem 1rem", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" },
  empty: { textAlign: "center", padding: "3rem", background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1.25rem" },
  card: { background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.07)", overflow: "hidden" },
  cardImg: { height: 160, position: "relative", background: "#f1f5f9" },
  imgPlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3.5rem", background: "linear-gradient(135deg,#fff7ed,#fde68a)" },
  estadoBadge: { position: "absolute", top: 8, right: 8, padding: "0.2rem 0.65rem", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600 },
  cardBody: { padding: "1.1rem" },
  cardTitle: { fontSize: "0.95rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.4rem" },
  cardDesc: { fontSize: "0.82rem", color: "#64748b", margin: "0 0 0.75rem", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  cardMeta: { display: "flex", flexWrap: "wrap", gap: 6, fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.75rem" },
  rechazadoBox: { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "0.5rem 0.75rem", fontSize: "0.78rem", color: "#b91c1c", marginBottom: "0.75rem" },
  cardActions: { display: "flex", gap: 8 },
  solicitudesGrid: { display: "flex", flexDirection: "column", gap: "1rem" },
  solicitudCard: { background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.07)", padding: "1.25rem", border: "1px solid #f1f5f9" },
  solicitudHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" },
  solicitudTitulo: { fontSize: "1rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.2rem" },
  solicitudFecha: { fontSize: "0.78rem", color: "#94a3b8", margin: 0 },
  estadoTag: { padding: "0.25rem 0.75rem", borderRadius: 20, fontSize: "0.8rem", fontWeight: 600, whiteSpace: "nowrap" },
  solicitudInfo: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1rem", background: "#f8fafc", borderRadius: 10, padding: "0.75rem" },
  infoItem: { display: "flex", flexDirection: "column", gap: 2 },
  infoLabel: { fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600 },
  solicitudAcciones: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  motivoBox: { display: "flex", flexDirection: "column", gap: 8, width: "100%" },
  motivoInput: { padding: "0.6rem 0.85rem", border: "1.5px solid #fecaca", borderRadius: 8, fontSize: "0.88rem", outline: "none", background: "#fef2f2" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" },
  modalBox: { background: "#fff", borderRadius: 18, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto" },
  modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid #f1f5f9", position: "sticky", top: 0, background: "#fff", zIndex: 1 },
  closeBtn: { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#94a3b8" },
  modalBody: { padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" },
  modalFooter: { display: "flex", gap: 10, justifyContent: "flex-end", padding: "1rem 1.5rem", borderTop: "1px solid #f1f5f9", position: "sticky", bottom: 0, background: "#fff" },
  fg: { display: "flex", flexDirection: "column", gap: "0.35rem" },
  label: { fontSize: "0.82rem", fontWeight: 600, color: "#374151" },
  input: { padding: "0.65rem 0.85rem", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: "0.9rem", color: "#1e293b", background: "#f8fafc", outline: "none", boxSizing: "border-box", width: "100%", fontFamily: "inherit" },
  menuItem: { display: "flex", alignItems: "center", gap: 8, padding: "0.6rem 0.75rem", background: "#fafafa", borderRadius: 8, marginBottom: 4 },
};
