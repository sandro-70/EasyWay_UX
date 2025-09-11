import React, { useMemo, useState } from "react";
import "./descuentos_aplicados.css";

const PageSize = 10;

const seed = Array.from({ length: 22 }).map((_, i) => ({
  fecha: "2025-08-30",
  producto: "Bananas",
  categoria: "Fruta",
  estado: "Entregado",
  monto: 156,
}));

function formatoLempiras(n) {
  return `L. ${new Intl.NumberFormat("es-HN", {
    maximumFractionDigits: 0,
  }).format(n)}`;
}

export default function DescuentosAplicados() {
  const [rows] = useState(seed);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: "fecha", dir: "desc" }); // asc | desc

  const sorted = useMemo(() => {
    const { key, dir } = sort;
    return [...rows].sort((a, b) => {
      const A = a[key],
        B = b[key];
      if (key === "monto") return dir === "asc" ? A - B : B - A;
      const sa = String(A),
        sb = String(B);
      if (sa < sb) return dir === "asc" ? -1 : 1;
      if (sa > sb) return dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PageSize));
  const pageData = useMemo(() => {
    const start = (page - 1) * PageSize;
    return sorted.slice(start, start + PageSize);
  }, [sorted, page]);

  function toggleSort(key) {
    setPage(1);
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }

  function exportarPDF() {
    alert("Exportar a PDF (conecta jsPDF/html2canvas cuando gustes).");
  }

  return (
    <div className="discounts-page">
      <header className="text-left">
        <h1 className="text-4xl font-semibold tracking-wide text-[#d8572f]">
          Descuentos Aplicados
        </h1>

        {/* Línea full-bleed estable */}
        <div className="relative mt-2 h-0">
          <div className="absolute left-1/2 -translate-x-1/2 w-[100svw] h-[2px] rounded-md bg-[#f0833e]" />
        </div>
      </header>

      {/* card--bleed: rompe max-width de contenedores padres y usa todo el viewport */}
      <section className="card card--bleed">
        <div
          className="table-wrap"
          role="region"
          aria-label="Tabla de descuentos aplicados"
        >
          <table className="table">
            {/* Fija proporciones de columnas para que siempre quepan visualmente */}
            <colgroup>
              <col style={{ width: "18%" }} /> {/* Fecha */}
              <col style={{ width: "28%" }} /> {/* Producto */}
              <col style={{ width: "20%" }} /> {/* Categoría */}
              <col style={{ width: "22%" }} /> {/* Estado */}
              <col style={{ width: "12%" }} /> {/* Monto */}
            </colgroup>

            <thead>
              <tr>
                <th>
                  <button
                    className={`th-sort ${
                      sort.key === "fecha" ? `is-${sort.dir}` : ""
                    }`}
                    onClick={() => toggleSort("fecha")}
                  >
                    Fecha <span className="caret" />
                  </button>
                </th>
                <th>
                  <button
                    className={`th-sort ${
                      sort.key === "producto" ? `is-${sort.dir}` : ""
                    }`}
                    onClick={() => toggleSort("producto")}
                  >
                    Producto <span className="caret" />
                  </button>
                </th>
                <th>
                  <button
                    className={`th-sort ${
                      sort.key === "categoria" ? `is-${sort.dir}` : ""
                    }`}
                    onClick={() => toggleSort("categoria")}
                  >
                    Categoría <span className="caret" />
                  </button>
                </th>
                <th>
                  <button
                    className={`th-sort ${
                      sort.key === "estado" ? `is-${sort.dir}` : ""
                    }`}
                    onClick={() => toggleSort("estado")}
                  >
                    Estado <span className="caret" />
                  </button>
                </th>
                <th className="num">
                  <button
                    className={`th-sort ${
                      sort.key === "monto" ? `is-${sort.dir}` : ""
                    }`}
                    onClick={() => toggleSort("monto")}
                  >
                    Monto <span className="caret" />
                  </button>
                </th>
              </tr>
            </thead>

            <tbody>
              {pageData.map((r, i) => (
                <tr key={i}>
                  <td>{new Date(r.fecha).toLocaleDateString("es-HN")}</td>
                  <td title={r.producto}>{r.producto}</td>
                  <td className="mono">{r.categoria}</td>
                  <td>{r.estado}</td>
                  <td className="num">{formatoLempiras(r.monto)}</td>
                </tr>
              ))}
              {pageData.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">
                    No hay datos para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card-footer">
          <nav className="pagination" aria-label="Paginación">
            <button
              className="page-nav"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => {
              const n = idx + 1;
              const show =
                n === 1 ||
                n === totalPages ||
                Math.abs(n - page) <= 1 ||
                totalPages <= 7;
              if (!show)
                return idx === 1 || idx === totalPages - 2 ? (
                  <span key={idx}>…</span>
                ) : null;
              return (
                <button
                  key={n}
                  className={`page ${n === page ? "current" : ""}`}
                  onClick={() => setPage(n)}
                  aria-current={n === page ? "page" : undefined}
                >
                  {n}
                </button>
              );
            })}
            <button
              className="page-nav"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              ›
            </button>
          </nav>

          <button className="btn-export" onClick={exportarPDF}>
            Exportar a PDF
          </button>
        </div>
      </section>
    </div>
  );
}
