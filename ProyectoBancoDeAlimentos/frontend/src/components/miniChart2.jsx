import React, { useState } from "react";

const MiniChart2 = ({
  title1,
  title2,
  title3,
  data,
  itemsPerPage,
  renderRow,
}) => {
  const [page, setPage] = useState(1);

  // Pagination logic
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const currentData = data.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="w-96 flex flex-col  ">
      {/* Title */}
      <div className="bg-white rounded-xl shadow-md border-2 border-black">
        <div className="flex flex-row justify-between bg-[#f0833e] text-white rounded-t-lg rounded-b-none px-4 pt-2 ">
          <h2 className="text-lg font-bold text-center mb-3">{title1}</h2>
          <h2 className="text-lg font-bold text-center mb-3 ">{title2}</h2>
          <h2 className="text-lg font-bold text-center mb-3 ">{title3}</h2>
        </div>

        {/* Content (table or custom rows) */}
        <div className="flex-1">
          {currentData.map((item, idx) => (
            <div
              key={idx}
              className="border-t-2 border-black py-1 px-2 flex justify-between items-center text-sm  "
            >
              {renderRow(item)}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center space-x-2 mt-3">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="px-2 py-1 text-xl"
        >
          ◀
        </button>

        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`w-6 h-6 rounded-full border flex items-center justify-center text-sm ${
              page === i + 1
                ? "border-orange-500 text-orange-500"
                : "border-gray-400"
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
          className="px-2 py-1 text-xl"
        >
          ▶
        </button>
      </div>
    </div>
  );
};

export default MiniChart2;
