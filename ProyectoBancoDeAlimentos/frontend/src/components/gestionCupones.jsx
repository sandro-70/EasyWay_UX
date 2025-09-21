import { useMemo, useState, useEffect } from "react";
import { GetCupones, crearCupon, editarCupon, desactivarCupon } from "../api/CuponesApi";
import { toast } from "react-toastify";
import { Icon } from "@iconify/react";
import "../toast.css";
import "./gestionCupones.css";

const GestionCupones = () => {
    const [cupones, setCupones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 6;

    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [cuponEditar, setCuponEditar] = useState(null);

    const [nuevoCupon, setNuevoCupon] = useState({
        codigo: "",
        descripcion: "",
        tipo: "porcentaje",
        valor: 0,
        uso_maximo_por_usuario: 1,
        termina_en: "",
        activo: true
    });

    useEffect(() => {
        fetchCupones();
    }, []);

    const fetchCupones = async () => {
        try {
            const resCupones = await GetCupones();
            if (!resCupones || !resCupones.data) {
                toast.warning("No se encontraron cupones");
                return;
            }
            setCupones(resCupones.data);
        } catch (err) {
            console.error("Error al obtener cupones:", err);
            toast.error("Error al cargar los cupones");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        const { codigo, descripcion, tipo, valor, uso_maximo_por_usuario, termina_en, activo } = nuevoCupon;
        
        if (!codigo.trim()) {
            toast.error("El código del cupón es obligatorio.");
            return;
        }
        if (!descripcion.trim()) {
            toast.error("La descripción del cupón es obligatoria.");
            return;
        }
        if (!valor || valor <= 0) {
            toast.error("El valor del cupón debe ser mayor a 0.");
            return;
        }
        if (!termina_en) {
            toast.error("La fecha de expiración es obligatoria.");
            return;
        }

        try {
            await crearCupon(
                1,
                nuevoCupon.codigo.trim(),
                nuevoCupon.descripcion.trim(),
                nuevoCupon.tipo,
                nuevoCupon.valor,
                nuevoCupon.uso_maximo_por_usuario, 
                nuevoCupon.termina_en
            );

            const r = await GetCupones();
            const cuponesData = r?.data || [];
            
            const formattedCupones = cuponesData.map((c, idx) => {
            const ahora = new Date();
            const hoyStr = `${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,"0")}-${String(ahora.getDate()).padStart(2,"0")}`;

            const fechaExpiracionStr = (c.termina_en || c.fecha_expiracion || "").split("T")[0];

            const fechaExpiracion = new Date(fechaExpiracionStr + "T23:59:59");
            const usoPorUsuario = parseInt(c.uso_maximo_por_usuario) || 1;

            let estado = "activo";
            if (!c.activo) {
              estado = "inactivo";
            } else if (fechaExpiracionStr && fechaExpiracionStr <= hoyStr) {
                estado = "expirado";
            } else if (usoPorUsuario === 0) {
                estado = "usado";
            }

            return {
                id_cupon: c.id_cupon || idx + 1,
                codigo: c.codigo || "",
                descripcion: c.descripcion || "",
                tipo: c.tipo || "porcentaje",
                valor: c.valor || 0,
                uso_maximo_por_usuario: usoPorUsuario,
                fecha_expiracion: fechaExpiracionStr,
                activo: c.activo !== undefined ? c.activo : true,
                estado: estado
            };
        });
            
            setCupones(formattedCupones);
            setCreateOpen(false);
            setNuevoCupon({
                codigo: "",
                descripcion: "",
                tipo: "porcentaje",
                valor: 0,
                uso_maximo_por_usuario: 1,
                termina_en: "",
                activo: true
            });
            
            toast.success("Cupón creado exitosamente");
            
        } catch (err) {
            console.error("CrearCupon error:", err);
            toast.error("No se pudo crear el cupón.");
        }
    };

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return cupones;
        return cupones.filter((c) =>
            [c.id_cupon, c.codigo, c.descripcion, c.tipo, c.estado]
                .join(" ")
                .toLowerCase()
                .includes(q)
        );
    }, [cupones, query]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageSafe = Math.min(page, totalPages);
    const visible = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

    const openEdit = (cupon) => {
        setCuponEditar({
            ...cupon,
            // asegura que solo tengas YYYY-MM-DD, sin conversión a Date
            termina_en: (cupon.termina_en || cupon.fecha_expiracion)?.split("T")[0] || "",
        });
        setEditOpen(true);
    };

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCuponEditar((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleUpdate = async () => {
        try {
            if (!cuponEditar) return;

            // Aquí asumo que tienes un endpoint updateCupon(id, data)
            await editarCupon(
                cuponEditar.id_cupon,
                cuponEditar.codigo,
                cuponEditar.descripcion,
                cuponEditar.tipo,
                cuponEditar.valor,
                cuponEditar.uso_maximo_por_usuario,
                cuponEditar.termina_en,
                cuponEditar.activo
            );


            // Refrescar lista
            await fetchCupones();

            setEditOpen(false);
            setCuponEditar(null);
            toast.success("Cupón actualizado correctamente");
        } catch (err) {
            console.error("Error al actualizar cupón:", err);
            toast.error("No se pudo actualizar el cupón");
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNuevoCupon(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    // Función para formatear fecha
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const [year, month, day] = dateString.split("-");
        return `${day}/${month}/${year}`;
    };

    const formatInputDate = (dateString) => {
    if (!dateString) return "";
    return dateString.split("T")[0]; // toma solo YYYY-MM-DD
    };


    // Función para determinar clase CSS según estado
    const getEstadoClass = (estado) => {
        switch (estado) {
            case 'activo': return 'estado-activo';
            case 'inactivo': return 'estado-inactivo';
            case 'expirado': return 'estado-expirado';
            case 'usado': return 'estado-usado';
            default: return '';
        }
    };

    const Iconoptions = {
    Search: (props) => (
        <svg
        viewBox="0 0 24 24"
        fill="none"
        className={"w-4 h-4 " + (props.className || "")}
        >
        <path
            d="M11 19a8 8 0 1 1 5.29-14.03A8 8 0 0 1 11 19Zm10 2-5.4-5.4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
        </svg>
    ),
    Sort: ({ active, dir }) => (
        <svg
        viewBox="0 0 24 24"
        className={"w-4 h-4 " + (active ? "text-white" : "text-white/70")}
        >
        <path
            d="M12 6l3 3H9l3-3z"
            fill="currentColor"
            opacity={dir === "asc" ? 1 : 0.35}
        />
        <path
            d="M12 18l-3-3h6l-3 3z"
            fill="currentColor"
            opacity={dir === "desc" ? 1 : 0.35}
        />
        </svg>
    ),
    Plus: (props) => (
        <svg viewBox="0 0 24 24" className={"w-5 h-5 " + (props.className || "")}>
        <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
        </svg>
    ),
    Edit: (props) => (
        <svg viewBox="0 0 24 24" className={"w-5 h-5 " + (props.className || "")}>
        <path
            d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
        />
        </svg>
    ),
    Trash: (props) => (
        <svg viewBox="0 0 24 24" className={"w-5 h-5 " + (props.className || "")}>
        <path
            d="M6 7h12M9 7V5h6v2m-8 0 1 12h8l1-12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
        />
        </svg>
    ),
    };

    const StatusBadge = ({ value }) => {
        let clase = "";
        switch (value) {
            case "activo":
                clase = "estado-activo";
                break;
            case "inactivo":
                clase = "estado-inactivo";
                break;
            case "expirado":
                clase = "estado-expirado";
                break;
            case "usado":
                clase = "estado-usado";
                break;
            default:
                clase = "";
        }

        const texto = value.charAt(0).toUpperCase() + value.slice(1);

        return <span className={`estado-badge ${clase}`}>{texto}</span>;
    };

    async function inactivarCuponRow(id_cupon) {
        if (!window.confirm("¿Marcar este cupón como INACTIVO?")) return;

        const cuponId = Number(String(id_cupon).trim());
        if (!Number.isFinite(cuponId) || cuponId <= 0) {
            toast.error("ID de cupón inválido.", { className: "toast-error" });
            return;
        }

        try {
            setDeletingId(cuponId); // Necesitas tener un estado deletingId
            await desactivarCupon(cuponId); // Función API para desactivar cupón

            // Actualiza la tabla manteniendo el registro
            setCupones((prev) =>
                prev.map((c) =>
                    Number(c.id_cupon) === cuponId ? { ...c, activo: false, estado: "inactivo" } : c
                )
            );
        } catch (err) {
            const s = err?.response?.status;
            const d = err?.response?.data;
            toast.error(
                "No se pudo desactivar. " +
                (s ? `HTTP ${s}. ` : "") +
                (typeof d === "string" ? d : d?.message || d?.detail || "Error"),
                { className: "toast-error" }
            );
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="gestion-cupon-container">
            <div className="cupones-header">
                <h1>Gestión de Cupones</h1>
                
                <button className="btn-primary" onClick={() => setCreateOpen(true)}>
                    <Icon icon="mdi:plus" />
                    <span>Crear Cupón</span>
                </button>
            </div>
            <div className="cupon-divider"></div>
            
            <div className="cupones-table-wrap">
                {loading ? (
                    <div className="loading">Cargando cupones...</div>
                ) : cupones.length === 0 ? (
                    <p className="no-cupones">No se encontraron cupones.</p>
                ) : (
                    <table className="cupones-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Código</th>
                                <th>Descripción</th>
                                <th>Tipo</th>
                                <th>Valor</th>
                                <th>Límite de usos</th>
                                <th>Fecha de expiración</th>
                                <th>Estado</th>
                                <th>Opciónes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((cupon) => (
                                <tr key={cupon.id_cupon}>
                                    <td className="text-center">{cupon.id_cupon}</td>
                                    <td className="codigo-cupon text-center">{cupon.codigo}</td>
                                    <td className="text-center">{cupon.descripcion}</td>
                                    <td className="text-center">{cupon.tipo}</td>
                                    <td className="text-center">{cupon.valor}</td>
                                    <td className="text-center">{cupon.uso_maximo_por_usuario}</td>
                                    <td className="text-center">{formatDate(cupon.fecha_expiracion)}</td>
                                    <td className="cell-center"><StatusBadge value={cupon.estado} /></td>
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEdit(cupon)}
                                            className="p-2 rounded-xl border border-[#d8dadc] hover:bg-[#2ca9e3]/20"
                                            title="Editar"
                                        >
                                            <Iconoptions.Edit className="text-[#2ca9e3]" />
                                        </button>
                                        <button
                                            onClick={() => inactivarCuponRow(cupon.id_cupon)}
                                            disabled={deletingId === Number(cupon.id_cupon) || cupon.estado === "inactivo"}
                                            className="p-2 rounded-xl border border-[#d8dadc] hover:bg-red-50 disabled:opacity-60"
                                            title={
                                                deletingId === Number(cupon.id_cupon)
                                                ? "Desactivando..."
                                                : cupon.estado === "inactivo"
                                                ? "Cupón ya inactivo"
                                                : "Marcar inactivo"
                                            }
                                        >
                                            <Iconoptions.Trash className="text-red-500" />
                                        </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {/* Paginación */}
                <div className="pagination">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe === 1} aria-label="Página anterior">
                    <Icon icon="mdi:chevron-left" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button key={n} onClick={() => setPage(n)} className={n === pageSafe ? "active" : ""} aria-label={`Ir a página ${n}`}>
                        {n}
                    </button>
                    ))}
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={pageSafe === totalPages} aria-label="Página siguiente">
                    <Icon icon="mdi:chevron-right" />
                    </button>
                </div>
            </div>
            
            {/* CREAR */}
            {createOpen && (
            <div className="modal-overlay">
                <div className="modal-container">
                <div className="modal-header">
                    <h2 className="modal-title">Crear Nuevo Cupón</h2>
                    <button
                    className="modal-close"
                    onClick={() => setCreateOpen(false)}
                    aria-label="Cerrar"
                    >
                    ✕
                    </button>
                </div>
                <div className="modal-body modal-grid-2">
                    <label>
                    <span>Código:</span>
                    <input
                        type="text"
                        name="codigo"
                        value={nuevoCupon.codigo}
                        onChange={handleInputChange}
                        placeholder="Código del cupón"
                    />
                    </label>

                    <label>
                    <span>Descripción:</span>
                    <textarea
                        name="descripcion"
                        value={nuevoCupon.descripcion}
                        onChange={handleInputChange}
                        placeholder="Descripción del cupón"
                        style={{ resize: "vertical", minHeight: "80px" }}
                    />
                    </label>

                    <label>
                    <span>Tipo:</span>
                    <select
                        name="tipo"
                        value={nuevoCupon.tipo}
                        onChange={handleInputChange}
                    >
                        <option value="porcentaje">Porcentaje</option>
                        <option value="fijo">Monto Fijo</option>
                    </select>
                    </label>

                    <label>
                    <span>Valor:</span>
                    <input
                        type="number"
                        name="valor"
                        value={nuevoCupon.valor}
                        onChange={handleInputChange}
                        min="0"
                        step={nuevoCupon.tipo === "porcentaje" ? "0.1" : "1"}
                    />
                    </label>

                    <label>
                    <span>Límite de usos:</span>
                    <input
                        type="number"
                        name="uso_maximo_por_usuario"
                        value={nuevoCupon.uso_maximo_por_usuario}
                        onChange={handleInputChange}
                        min="1"
                    />
                    </label>

                    <label>
                    <span>Fecha de expiración:</span>
                    <input
                        type="date"
                        name="termina_en"
                        value={nuevoCupon.termina_en}
                        onChange={handleInputChange}
                    />
                    </label>

                    <label>
                    <span>Estado:</span>
                    <input
                        type="text"
                        name="activo"
                        checked={nuevoCupon.activo}
                        onChange={handleInputChange}
                        placeholder="ACTIVO"
                        readOnly
                    />
                    </label>
                </div>

                {/* ACTIONS */}
                <div className="modal-actions">
                    <button className="btn-secondary" onClick={() => setCreateOpen(false)}>
                    Cancelar
                    </button>
                    <button className="btn-primary" onClick={handleCreate}>
                    <Icon icon="mdi:plus" /> Crear
                    </button>
                </div>
                </div>
            </div>
            )}

            {/* EDITAR */}
            {editOpen && cuponEditar && (
            <div className="modal-overlay">
                <div className="modal-container">
                <div className="modal-header">
                    <h2 className="modal-title">Editar Cupón</h2>
                    <button
                    className="modal-close"
                    onClick={() => setEditOpen(false)}
                    aria-label="Cerrar"
                    >
                    ✕
                    </button>
                </div>
                <div className="modal-body modal-grid-2">
                    <label>
                    <span>Código:</span>
                    <input
                        type="text"
                        name="codigo"
                        value={cuponEditar.codigo}
                        onChange={handleEditChange}
                    />
                    </label>

                    <label>
                    <span>Descripción:</span>
                    <textarea
                        name="descripcion"
                        value={cuponEditar.descripcion}
                        onChange={handleEditChange}
                        style={{ resize: "vertical", minHeight: "80px" }}
                    />
                    </label>

                    <label>
                    <span>Tipo:</span>
                    <select
                        name="tipo"
                        value={cuponEditar.tipo}
                        onChange={handleEditChange}
                    >
                        <option value="porcentaje">Porcentaje</option>
                        <option value="monto_fijo">Monto Fijo</option>
                    </select>
                    </label>

                    <label>
                    <span>Valor:</span>
                    <input
                        type="number"
                        name="valor"
                        value={cuponEditar.valor}
                        onChange={handleEditChange}
                        min="0"
                        step={cuponEditar.tipo === "porcentaje" ? "0.1" : "1"}
                    />
                    </label>

                    <label>
                    <span>Usos por usuario:</span>
                    <input
                        type="number"
                        name="uso_maximo_por_usuario"
                        value={cuponEditar.uso_maximo_por_usuario}
                        onChange={handleEditChange}
                        min="1"
                    />
                    </label>

                    <label>
                    <span>Fecha de expiración:</span>
                    <input
                        type="date"
                        name="termina_en"
                        value={cuponEditar?.termina_en || ""}
                        onChange={handleEditChange}
                    />
                    </label>

                    <label>
                        <span>Estado:</span>
                        <select
                            name="activo"
                            value={cuponEditar.activo ? "activo" : "inactivo"}
                            onChange={(e) => 
                                setCuponEditar(prev => ({
                                    ...prev,
                                    activo: e.target.value === "activo"
                                }))
                            }
                        >
                            <option value="activo">ACTIVO</option>
                            <option value="inactivo">INACTIVO</option>
                        </select>
                    </label>
                </div>
                <div className="modal-actions">
                    <button className="btn-secondary" onClick={() => setEditOpen(false)}>
                    Cancelar
                    </button>
                    <button className="btn-primary" onClick={handleUpdate}>
                    <Icon icon="mdi:content-save" /> Guardar Cambios
                    </button>
                </div>
                </div>
            </div>
            )}
        </div>
    );
};

export default GestionCupones;