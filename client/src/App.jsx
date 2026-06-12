import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminPanel from "./pages/AdminPanel";
import MiPerfil from "./pages/MiPerfil";
import Experiencias from "./pages/Experiencias";
import PanelGuia from "./pages/PanelGuia";
import DetalleExperiencia from "./pages/DetalleExperiencia";
import PagoReserva from "./pages/PagoReserva";

function RutaProtegida({ children, rolRequerido, rolesPermitidos }) {
  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user") || "null");
  if (!token || !user) return <Navigate to="/login" />;
  if (rolRequerido  && user.rol !== rolRequerido) return <Navigate to="/experiencias" />;
  if (rolesPermitidos && !rolesPermitidos.includes(user.rol)) return <Navigate to="/experiencias" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"               element={<Navigate to="/login" />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/register"       element={<Register />} />
        <Route path="/experiencias"   element={<RutaProtegida><Experiencias /></RutaProtegida>} />
        <Route path="/experiencias/:id" element={<RutaProtegida><DetalleExperiencia /></RutaProtegida>} />
        <Route path="/pago/:id"       element={<RutaProtegida><PagoReserva /></RutaProtegida>} />
        <Route path="/admin"          element={<RutaProtegida rolRequerido="admin"><AdminPanel /></RutaProtegida>} />
        <Route path="/panel-guia"     element={
          <RutaProtegida rolesPermitidos={["guia_turistico","guia_gastronomico","anfitrion"]}>
            <PanelGuia />
          </RutaProtegida>
        } />
        <Route path="/mi-perfil"      element={<RutaProtegida><MiPerfil /></RutaProtegida>} />
      </Routes>
    </BrowserRouter>
  );
}