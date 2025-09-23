import React, { useEffect, useMemo, useState } from "react";

const MiniChart = ({ title1, title2, data = [], itemsPerPage = 4, renderRow }) => {
  const [page, setPage] = useState(1);          // 1-based

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));

  // Si cambian los datos/filtros y la página queda fuera de rango, corrígela
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    if (page < 1) setPage(1);
  }, [totalPages, page]);

  const startIndex = (page - 1) * itemsPerPage;
  const currentData = useMemo(
    () => data.slice(startIndex, startIndex + itemsPerPage),
    [data, startIndex, itemsPerPage]
  );

  // Construye: [1, (… si hay hueco), page-1, page, page+1, (… si hay hueco), totalPages]
  const compactPages = useMemo(() => {
    const base = new Set([1, totalPages, page - 1, page, page + 1]);
    const list = [...base]
      .filter((n) => n >= 1 && n <= totalPages)
      .sort((a, b) => a - b);

    const out = [];
    let prev = 0;
    for (const n of list) {
      if (n - prev > 1) out.push("…");
      out.push(n);
      prev = n;
    }
    return out;
  }, [page, totalPages]);

  return (
    <div className="w-80 flex flex-col min-w-[360px] -ml-4">
      {/* Header */}
      <div className="bg-white rounded-md shadow-md border-2 border-black">
        <div className="flex flex-row justify-between bg-[#2b6daf] text-white rounded-t-sm rounded-b-none px-4 pt-2">
          <h2 className="text-lg font-bold text-center mb-3">{title1}</h2>
          <h2 className="text-lg font-bold text-center mb-3">{title2}</h2>
        </div>

        {/* Rows */}
        <div className="flex-1">
          {currentData.map((item, idx) => (
            <div
              key={idx}
              className="border-t-2 border-black py-1 px-2 flex justify-between items-center text-sm"
            >
              {renderRow(item)}
            </div>
          ))}

          {currentData.length === 0 && (
            <div className="py-4 text-center text-gray-500 text-sm">Sin datos</div>
          )}
        </div>
      </div>

      {/* Paginación compacta (solo si hay +1 página) */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1 mt-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-7 h-7 rounded-full text-sm border border-gray-300 bg-white hover:bg-orange-100 disabled:opacity-40"
            aria-label="Anterior"
          >
            ‹
          </button>

          {compactPages.map((n, i) =>
            n === "…" ? (
              <span key={`gap-${i}`} className="w-7 text-center text-gray-400 select-none">
                …
              </span>
            ) : (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-7 h-7 rounded-full text-sm leading-7 text-center border transition
                  ${page === n
                    ? "bg-[#f0833e] text-white border-[#f0833e]"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-orange-100"
                  }`}
                aria-current={page === n ? "page" : undefined}
              >
                {n}
              </button>
            )
          )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-7 h-7 rounded-full text-sm border border-gray-300 bg-white hover:bg-orange-100 disabled:opacity-40"
            aria-label="Siguiente"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};

export default MiniChart;