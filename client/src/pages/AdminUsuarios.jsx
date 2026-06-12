import { useState, useEffect } from "react";

const API_URL = `${import.meta.env.VITE_API_URL}/api/auth/login`;

function getToken() {
  return localStorage.getItem("token");
}

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "crear" | "editar"
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ nombre: "", email: "", password: "", rol: "viajero" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    cargarUsuarios();
  }, []);

  async function cargarUsuarios() {
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setUsuarios(data);
    } catch {
      setError("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }

  function abrirCrear() {
    setForm({ nombre: "", email: "", password: "", rol: "viajero" });
    setError("");
    setModal("crear");
  }

  function abrirEditar(u) {
    setSelected(u);
    setForm({ nombre: u.nombre, email: u.email, password: "", rol: u.rol });
    setError("");
    setModal("editar");
  }

  function cerrarModal() {
    setModal(null);
    setSelected(null);
    setError("");
  }

  async function guardar() {
    setError("");
    try {
      let res;
      if (modal === "crear") {
        res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify(form),
        });
      } else {
        const body = { nombre: form.nombre, email: form.email, rol: form.rol };
        if (form.password) body.password = form.password;
        res = await fetch(`${API_URL}/${selected.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify(body),
        });
      }
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Error al guardar"); return; }
      setSuccess(modal === "crear" ? "Usuario creado ✓" : "Usuario actualizado ✓");
      cerrarModal();
      cargarUsuarios();
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Error de conexión");
    }
  }

  async function eliminar(id, nombre) {
    if (!confirm(`¿Eliminar a "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setSuccess("Usuario eliminado ✓");
      cargarUsuarios();
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Error al eliminar");
    }
  }

  function cerrarSesion() {
    localStorage.clear();
    window.location.href = "/login";
  }

  const rolColor = { admin: "#7c3aed", guia: "#0891b2", viajero: "#2563eb" };
  const rolBg   = { admin: "#f5f3ff", guia: "#ecfeff", viajero: "#eff6ff" };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={{ fontSize: 22 }}>🛡️</span>
          <div>
            <h1 style={styles.headerTitle}>Panel de Administrador</h1>
            <p style={styles.headerSub}>Plataforma de Turismo Local</p>
          </div>
        </div>
        <button onClick={cerrarSesion} style={styles.logoutBtn}>
          🚪 Cerrar sesión
        </button>
      </div>

      <div style={styles.container}>
        {/* Toolbar */}
        <div style={styles.toolbar}>
          <div>
            <h2 style={styles.sectionTitle}>Gestión de usuarios</h2>
            <p style={styles.sectionSub}>{usuarios.length} usuarios registrados</p>
          </div>
          <button onClick={abrirCrear} style={styles.btnPrimary}>
            ＋ Nuevo usuario
          </button>
        </div>

        {/* Mensajes */}
        {success && <div style={styles.successBox}>✅ {success}</div>}
        {error && !modal && <div style={styles.errorBox}>⚠️ {error}</div>}

        {/* Tabla */}
        {loading ? (
          <div style={styles.emptyState}>Cargando usuarios...</div>
        ) : usuarios.length === 0 ? (
          <div style={styles.emptyState}>No hay usuarios registrados aún.</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["#", "Nombre", "Correo", "Rol", "Registrado", "Acciones"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u, i) => (
                  <tr key={u.id} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                    <td style={styles.td}>{i + 1}</td>
                    <td style={{ ...styles.td, fontWeight: 600 }}>{u.nombre}</td>
                    <td style={styles.td}>{u.email}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.rolBadge,
                        color: rolColor[u.rol] || "#374151",
                        background: rolBg[u.rol] || "#f1f5f9",
                      }}>
                        {u.rol}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {new Date(u.created_at).toLocaleDateString("es-BO")}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button onClick={() => abrirEditar(u)} style={styles.btnEdit}>
                          ✏️ Editar
                        </button>
                        <button onClick={() => eliminar(u.id, u.nombre)} style={styles.btnDelete}>
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {modal && (
        <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && cerrarModal()}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {modal === "crear" ? "➕ Crear nuevo usuario" : "✏️ Editar usuario"}
              </h3>
              <button onClick={cerrarModal} style={styles.closeBtn}>✕</button>
            </div>

            <div style={styles.modalBody}>
              {[
                { label: "Nombre completo", name: "nombre", type: "text", placeholder: "Ej. Juan Pérez" },
                { label: "Correo electrónico", name: "email", type: "email", placeholder: "juan@correo.com" },
                { label: modal === "editar" ? "Nueva contraseña (opcional)" : "Contraseña", name: "password", type: "password", placeholder: "••••••••" },
              ].map((f) => (
                <div key={f.name} style={styles.fieldGroup}>
                  <label style={styles.label}>{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.name]}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    required={f.name !== "password" || modal === "crear"}
                    style={styles.input}
                    onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                </div>
              ))}

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Rol</label>
                <select
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value })}
                  style={styles.select}
                >
                  <option value="viajero">🧳 Viajero (cliente)</option>
                  <option value="guia">🗺️ Guía local</option>
                  <option value="admin">🛡️ Administrador</option>
                </select>
              </div>

              {error && <div style={styles.errorBox}>⚠️ {error}</div>}
            </div>

            <div style={styles.modalFooter}>
              <button onClick={cerrarModal} style={styles.btnCancel}>Cancelar</button>
              <button onClick={guardar} style={styles.btnSave}>
                {modal === "crear" ? "Crear usuario" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  header: {
    background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
    padding: "1rem 2rem",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    boxShadow: "0 2px 12px rgba(124,58,237,0.3)",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  headerTitle: { fontSize: "1.15rem", fontWeight: 700, color: "#fff", margin: 0 },
  headerSub: { fontSize: "0.8rem", color: "rgba(255,255,255,0.75)", margin: 0 },
  logoutBtn: {
    background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
    color: "#fff", borderRadius: 8, padding: "0.45rem 1rem",
    cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
  },
  container: { maxWidth: 1000, margin: "0 auto", padding: "2rem 1.5rem" },
  toolbar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" },
  sectionTitle: { fontSize: "1.2rem", fontWeight: 700, color: "#1e293b", margin: 0 },
  sectionSub: { fontSize: "0.82rem", color: "#64748b", margin: "2px 0 0" },
  btnPrimary: {
    background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff",
    border: "none", borderRadius: 10, padding: "0.65rem 1.3rem",
    fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
    boxShadow: "0 3px 12px rgba(124,58,237,0.3)",
  },
  successBox: {
    background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d",
    borderRadius: 8, padding: "0.7rem 1rem", marginBottom: "1rem", fontSize: "0.88rem",
  },
  errorBox: {
    background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c",
    borderRadius: 8, padding: "0.65rem 0.9rem", marginBottom: "1rem", fontSize: "0.84rem",
  },
  emptyState: { textAlign: "center", color: "#94a3b8", padding: "3rem", fontSize: "0.95rem" },
  tableWrap: { background: "#fff", borderRadius: 14, boxShadow: "0 2px 16px rgba(0,0,0,0.07)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    background: "#f8fafc", padding: "0.85rem 1rem",
    fontSize: "0.78rem", fontWeight: 700, color: "#475569",
    textTransform: "uppercase", letterSpacing: "0.05em",
    textAlign: "left", borderBottom: "1px solid #e2e8f0",
  },
  td: { padding: "0.85rem 1rem", fontSize: "0.875rem", color: "#374151", verticalAlign: "middle" },
  trEven: { background: "#fff" },
  trOdd: { background: "#fafafa" },
  rolBadge: {
    display: "inline-block", padding: "0.25rem 0.7rem",
    borderRadius: 20, fontSize: "0.78rem", fontWeight: 600,
  },
  actions: { display: "flex", gap: 8 },
  btnEdit: {
    background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe",
    borderRadius: 7, padding: "0.35rem 0.75rem", fontSize: "0.8rem",
    fontWeight: 600, cursor: "pointer",
  },
  btnDelete: {
    background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca",
    borderRadius: 7, padding: "0.35rem 0.75rem", fontSize: "0.8rem",
    fontWeight: 600, cursor: "pointer",
  },
  // Modal
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 100, padding: "1rem",
  },
  modal: {
    background: "#fff", borderRadius: 18,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    width: "100%", maxWidth: 440,
  },
  modalHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "1.25rem 1.5rem", borderBottom: "1px solid #f1f5f9",
  },
  modalTitle: { fontSize: "1rem", fontWeight: 700, color: "#1e293b", margin: 0 },
  closeBtn: { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#94a3b8", padding: 4 },
  modalBody: { padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "0.35rem" },
  label: { fontSize: "0.82rem", fontWeight: 600, color: "#374151" },
  input: {
    padding: "0.68rem 0.85rem", border: "1.5px solid #e2e8f0", borderRadius: 10,
    fontSize: "0.9rem", color: "#1e293b", background: "#f8fafc",
    outline: "none", transition: "border-color 0.2s",
  },
  select: {
    padding: "0.68rem 0.85rem", border: "1.5px solid #e2e8f0", borderRadius: 10,
    fontSize: "0.9rem", color: "#1e293b", background: "#f8fafc", outline: "none",
  },
  modalFooter: {
    display: "flex", gap: 10, justifyContent: "flex-end",
    padding: "1rem 1.5rem", borderTop: "1px solid #f1f5f9",
  },
  btnCancel: {
    background: "#f1f5f9", color: "#475569", border: "none",
    borderRadius: 9, padding: "0.65rem 1.2rem", fontSize: "0.9rem",
    fontWeight: 600, cursor: "pointer",
  },
  btnSave: {
    background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff",
    border: "none", borderRadius: 9, padding: "0.65rem 1.3rem",
    fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
    boxShadow: "0 3px 10px rgba(124,58,237,0.3)",
  },
};
