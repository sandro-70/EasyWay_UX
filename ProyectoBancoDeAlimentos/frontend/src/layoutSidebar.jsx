// LayoutWithSidebar.js
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./sidebar";

export default function LayoutSidebar() {
  const [moveButton, setMoveButton] = useState(false);
  return (
    <div className="flex min-h-screen">
      <Sidebar moveButton={moveButton} showSidebar={setMoveButton} />
      <main className="flex-1 flex-row bg-gray-100 pr-0">
        <Outlet context={{ moveButton, setMoveButton }} /> {}
      </main>
    </div>
  );
}
