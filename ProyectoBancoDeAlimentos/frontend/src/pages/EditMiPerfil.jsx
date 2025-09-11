import { useState } from "react";

// Paleta de colores (usadas como HEX en Tailwind)
// primario oscuro: #d8572f
// primario: #f0833e
// azul claro: #2ca9e3
// azul: #2b6daf
// acento claro: #ffac77
// blanco: #ffffff
// gris claro: #f9fafb
// borde: #d8dadc

// Iconos simples inline (sin librerías externas)
function Icon({ name, className = "h-4 w-4" }) {
  switch (name) {
    case "user":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
          <circle cx="12" cy="8" r="4" strokeWidth="1.8" />
          <path d="M4 20c2-4 14-4 16 0" strokeWidth="1.8" />
        </svg>
      );
    case "mail":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
          <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="1.8" />
          <path d="M3 7l9 6 9-6" strokeWidth="1.8" />
        </svg>
      );
    case "phone":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
          <path d="M4 5l4-1 2 4-2 2c1.5 3 3.5 5 6.5 6.5l2-2 4 2-1 4c-7 0-16-9-16-16z" strokeWidth="1.8" />
        </svg>
      );
    case "map":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
          <path d="M12 22s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z" strokeWidth="1.8" />
          <circle cx="12" cy="10" r="2.5" strokeWidth="1.8" />
        </svg>
      );
    case "building":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
          <rect x="4" y="4" width="10" height="16" rx="2" strokeWidth="1.8" />
          <path d="M14 8h6v12H8" strokeWidth="1.8" />
          <path d="M7 8h4M7 12h4M7 16h4" strokeWidth="1.8" />
        </svg>
      );
    case "lock":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
          <rect x="4" y="10" width="16" height="10" rx="2" strokeWidth="1.8" />
          <path d="M8 10V7a4 4 0 118 0v3" strokeWidth="1.8" />
        </svg>
      );
    case "camera":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
          <path d="M4 8h4l2-2h4l2 2h4v12H4z" strokeWidth="1.8" />
          <circle cx="12" cy="14" r="3.5" strokeWidth="1.8" />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
          <path d="M5 13l4 4 10-10" strokeWidth="2" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
          <path d="M6 6l12 12M6 18L18 6" strokeWidth="2" />
        </svg>
      );
    case "chevron":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
          <path d="M6 9l6 6 6-6" strokeWidth="2" />
        </svg>
      );
    default:
      return null;
  }
}

export default function EditarPerfilAdmin() {
  const [genero, setGenero] = useState("Masculino");
  const [rol, setRol] = useState("Administrador");
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#f9fafb] py-8">
      {/* Encabezado */}
      <div className="mx-auto max-w-6xl px-4">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-[#d8dadc]">
          <div className="px-1 pb-1">
            <h1 className="text-4xl font-semibold text-[#f0833e] pt-3">Editar Perfil Administrador</h1>
          </div>
          <div className="flex items-center gap-3 rounded-t-2xl bg-[#ffffff] p-1">
            <div className="h-1 w-full rounded-md bg-[#f0833e]" />
          </div>
          
        </div>
      </div>

      {/* Contenido */}
      <div className="mx-auto mt-4 max-w-6xl px-4">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px,1fr]">
          {/* Sidebar */}
          <aside className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#d8dadc]">
            <div className="flex flex-col items-center gap-4">
              <div className="grid place-items-center rounded-full bg-[#f9fafb] ring-1 ring-[#d8dadc]" style={{ width: 120, height: 120 }}>
                <Icon name="user" className="h-14 w-14 text-[#d8dadc]" />
              </div>
              <button className="flex items-center gap-2 rounded-2xl bg-[#f0833e] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95">
                <Icon name="camera" className="h-4 w-4" /> Editar foto
              </button>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-slate-600">Rol</label>
              <div className="relative">
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-[#d8dadc] bg-white px-3 py-2 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2ca9e3]"
                >
                  <option>Administrador</option>
                  <option>Editor</option>
                  <option>Invitado</option>
                </select>
                <Icon name="chevron" className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </aside>

          {/* Tarjeta principal */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#d8dadc]">
            {/* Datos generales */}
            <div className="rounded-2xl border border-[#d8dadc] p-4">
              <h2 className="mb-4 text-center text-lg font-semibold text-slate-700">
                Datos generales <span className="text-slate-900"></span>
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Nombre" icon={<Icon name="user" />}> 
                  <input placeholder="Juan Javier" className="w-full rounded-xl border border-[#d8dadc] bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#2ca9e3]" />
                </Field>
                <Field label="Género" icon={<span className="inline-block h-2.5 w-2.5 rounded-full bg-[#2ca9e3]" />}> 
                  <Select value={genero} onChange={setGenero} options={["Masculino", "Femenino", "Otro"]} />
                </Field>
                <Field label="Correo" icon={<Icon name="mail" />}> 
                  <input placeholder="ejemplo@gmail.com" className="w-full rounded-xl border border-[#d8dadc] bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#2ca9e3]" />
                </Field>
                <Field label="Apellidos" icon={<Icon name="user" />}> 
                  <input placeholder="Perez Maldonado" className="w-full rounded-xl border border-[#d8dadc] bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#2ca9e3]" />
                </Field>
              </div>

              <div className="mt-4 flex justify-center">
                {/* Botón para abrir el modal */}
<button
  onClick={() => setShowPasswordModal(true)}
  className="rounded-xl bg-[#f0833e] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
>
  Cambio de contraseña
</button>

{/* Modal */}
{showPasswordModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-4xl font-semibold text-[#d8572f]">Cambio de contraseña</h3>

        <div className="flex items-center gap-3 rounded-t-2xl bg-[#ffffff] p-2">
            <div className="h-2 w-full rounded-md bg-[#f0833e]" />
        </div>
          
        <button onClick={() => setShowPasswordModal(false)} className="text-slate-500 hover:text-slate-700">
          ✕
        </button>
      </div>
        {/* Línea separadora añadida debajo del título */}
<div className="flex items-center gap-3 rounded-t-2xl bg-[#ffffff] p-1">
<div className="h-1 w-full rounded-md bg-[#f0833e]" />
</div>
      <div className="space-y-4 ">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 ">Contraseña anterior</label>
          <input type="password" className="w-full rounded-xl border border-[#d8dadc] px-3 py-2 text-sm focus:ring-2 focus:ring-[#2ca9e3]" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Nueva contraseña</label>
          <input type="password" className="w-full rounded-xl border border-[#d8dadc] px-3 py-2 text-sm focus:ring-2 focus:ring-[#2ca9e3]" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Confirmación de nueva contraseña</label>
          <input type="password" className="w-full rounded-xl border border-[#d8dadc] px-3 py-2 text-sm focus:ring-2 focus:ring-[#2ca9e3]" />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => setShowPasswordModal(false)}
          className="rounded-xl bg-[#d8572f] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
        >
          Cancelar
        </button>
        <button className="rounded-xl bg-[#2b6daf] px-4 py-2 text-sm font-semibold text-white hover:opacity-95">
          Guardar
        </button>
      </div>
    </div>
  </div>
)}

              </div>
            </div>

            {/* Contacto y ubicación */}
            <div className="mt-5 rounded-2xl border border-[#d8dadc] p-4">
              <h3 className="mb-4 text-center text-lg font-semibold text-slate-700">Contacto y ubicación</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Dirección" icon={<Icon name="map" />}> 
                  <input placeholder="Bo. El carmen 3 calle 6 ave" className="w-full rounded-xl border border-[#d8dadc] bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#2ca9e3]" />
                </Field>
                <Field label="Teléfono" icon={<Icon name="phone" />}> 
                  <input placeholder="8789-9099" className="w-full rounded-xl border border-[#d8dadc] bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#2ca9e3]" />
                </Field>
                <Field label="Departamento" icon={<Icon name="building" />}> 
                  <input placeholder="Cortés" className="w-full rounded-xl border border-[#d8dadc] bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#2ca9e3]" />
                </Field>
                <Field label="Municipio" icon={<Icon name="building" />}> 
                  <input placeholder="San Pedro Sula" className="w-full rounded-xl border border-[#d8dadc] bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#2ca9e3]" />
                </Field>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <button className="inline-flex items-center gap-2 rounded-xl bg-[#d8572f] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95">
                  <Icon name="x" className="h-4 w-4" /> Cancelar
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl bg-[#2b6daf] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95">
                  <Icon name="check" className="h-4 w-4" /> Guardar
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div>
      <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-[#d8dadc] bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-[#2ca9e3]">
        {icon && <span className="text-slate-400">{icon}</span>}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-transparent text-sm text-slate-700 outline-none"
      >
        {options.map((op) => (
          <option key={op}>{op}</option>
        ))}
      </select>
      <Icon name="chevron" className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
    </div>
  );
}