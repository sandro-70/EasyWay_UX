import { useState, useEffect } from "react";
import { GetALLCupones } from "./api/CuponesApi";
import { InformacionUser } from "./api/Usuario.Route";
import "./misCupones.css";
import PerfilSidebar from "./components/perfilSidebar";

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
                
                if (resUsuario && resUsuario.data) {
                    setUsuarioInfo(resUsuario.data);
                    const id_usuario = resUsuario.data.id_usuario;
                    const resCupones = await GetALLCupones(id_usuario);

                    const cupones = resCupones.data;
                    const hoy = new Date();
                    hoy.setHours(0,0,0,0);

                    const noUsados = cupones.filter(c => c.fecha_usado === null && c.activo);
                    const usados = cupones.filter(c => c.fecha_usado !== null && new Date(c.fecha_usado) < hoy && c.activo);
                    const caducados = cupones.filter(c => !c.activo || (c.fecha_usado !== null && new Date(c.fecha_usado) < hoy));
            
                    setCuponesNoUtilizados(noUsados);
                    setCuponesUsados(usados);
                    setCuponesCaducados(caducados);
                    setCuponesMostrados(noUsados);
                }
            } catch (err) {
                console.error("Error al obtener datos del usuario o cupones:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserDataAndCoupons();
    }, []);

    const mostrarCupones = (tipo) => {
        if (tipo === "Cupones no utilizados") setCuponesMostrados(cuponesNoUtilizados);
        else if (tipo === "Usados") setCuponesMostrados(cuponesUsados);
        else setCuponesMostrados(cuponesCaducados);
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
                <p onClick={() => mostrarCupones("Cupones no utilizados")}>Cupones No Utilizados</p>
                <p onClick={() => mostrarCupones("Usados")}>Usados</p>
                <p onClick={() => mostrarCupones("Cupones caducados")}>Cupones Caducados</p>
            </div>
            <div className="cupones_reporte">
                <div className="lista_reportes">
                    {cuponesMostrados.length === 0 ? (
                        <p>No hay cupones en esta categoría.</p>
                    ) : (
                        cuponesMostrados.map((cupon) => (
                            <div key={cupon.codigo} className="cupones_categoria">
                                <button className="boton_cupon">
                                    <span className="texto_cupon1">{cupon.codigo}</span>
                                    <br />
                                    {cupon.descripcion}
                                    <br /><br />
                                    <span className="texto_cupon2">
                                        {cupon.fecha_usado ? `Usado el: ${cupon.fecha_usado}` : `Vence el: ${cupon.termina_en || "N/A"}`}
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