import { useState, useEffect } from "react";
import { GetALLCupones } from "./api/CuponesApi";
import { InformacionUser } from "./api/Usuario.Route";
import "./misCupones.css";
import PerfilSidebar from "./components/perfilSidebar";
import { toast } from "react-toastify";
import "./toast.css";

const MisCupones = () => {
  const [cuponesNoUtilizados, setCuponesNoUtilizados] = useState([]);
  const [cuponesUsados, setCuponesUsados] = useState([]);
  const [cuponesCaducados, setCuponesCaducados] = useState([]);
  const [cuponesMostrados, setCuponesMostrados] = useState([]);
  const [usuarioInfo, setUsuarioInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDataAndCoupons = async () => {
      try {
        const resUsuario = await InformacionUser();
        if (!resUsuario || !resUsuario.data) {
          toast.error("No se pudo obtener la información del usuario");
          return;
        }

        setUsuarioInfo(resUsuario.data);
        const id_usuario = resUsuario.data.id_usuario;

        // Traemos el historial de cupones con el cupón asociado
        const resCupones = await GetALLCupones(id_usuario);
        if (!resCupones || !resCupones.data) {
          toast.warning("No se encontraron cupones para este usuario");
          return;
        }

        const cupones = resCupones.data;

        // 🔹 función para parsear fechas como locales
        const parseToLocalDate = (val) => {
          if (!val) return null;
          if (val instanceof Date) {
            return new Date(val.getFullYear(), val.getMonth(), val.getDate());
          }
          const dateStr = String(val).split("T")[0]; // "YYYY-MM-DD"
          const parts = dateStr.split("-");
          if (parts.length !== 3) return null;
          const [y, m, d] = parts.map((p) => Number(p));
          if ([y, m, d].some((n) => Number.isNaN(n))) return null;
          return new Date(y, m - 1, d); // fecha en medianoche local
        };

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const noUsados = cupones.filter(
          (c) => parseToLocalDate(c.fecha_usado) === null && c.Cupon?.activo
        );

        const usados = cupones.filter((c) => {
          const fUso = parseToLocalDate(c.fecha_usado);
          return fUso !== null && c.Cupon?.activo;
        });

        const caducados = cupones.filter((c) => {
          if (!c.Cupon?.activo) return true;
          const fUso = parseToLocalDate(c.fecha_usado);
          if (fUso !== null) return false;
          const fechaExp = parseToLocalDate(c.Cupon?.termina_en);
          return fechaExp !== null && fechaExp < hoy;
        });

        setCuponesNoUtilizados(noUsados);
        setCuponesUsados(usados);
        setCuponesCaducados(caducados);
        setCuponesMostrados(noUsados);
      } catch (err) {
        console.error("Error al obtener datos del usuario o cupones:", err);
        toast.error("Error al cargar los cupones");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataAndCoupons();
  }, []);

  const mostrarCupones = (tipo) => {
    if (tipo === "Cupones no utilizados") {
      setCuponesMostrados(cuponesNoUtilizados);
    } else if (tipo === "Usados") {
      setCuponesMostrados(cuponesUsados);
    } else {
      setCuponesMostrados(cuponesCaducados);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return <div className="cargando">Cargando cupones...</div>;
  }

  return (
    <div className="cupones">
      <section className="sidebar">
        <PerfilSidebar />
      </section>

      <div className="titulo">
        <p className="titulo_texto">Mis Cupones</p>
        <hr className="linea"></hr>
      </div>

      <div className="titulos_secundarios">
        <p onClick={() => mostrarCupones("Cupones no utilizados")}>
          Cupones No Utilizados
        </p>
        <p onClick={() => mostrarCupones("Usados")}>Usados</p>
        <p onClick={() => mostrarCupones("Cupones caducados")}>
          Cupones Caducados
        </p>
      </div>

      <div className="cupones_reporte">
        <div className="lista_reportes">
          {cuponesMostrados.length === 0 ? (
            <p>No hay cupones en esta categoría.</p>
          ) : (
            cuponesMostrados.map((cupon) => (
              <div key={cupon.id_historial_cupon} className="cupones_categoria">
                <button className="boton_cupon">
                  <span className="texto_cupon1">{cupon.Cupon?.codigo}</span>
                  <br />
                  {cupon.Cupon?.descripcion}
                  <br />
                  <br />
                  <span className="texto_cupon2">
                    {cupon.fecha_usado
                      ? `Usado el: ${formatDate(cupon.fecha_usado)}`
                      : `Vence el: ${formatDate(cupon.Cupon?.termina_en)}`}
                  </span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MisCupones;
