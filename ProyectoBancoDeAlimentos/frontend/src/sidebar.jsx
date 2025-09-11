import React from "react";
import "./sidebar.css";
import logo from "./images/logo_sidebar.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ moveButton, showSidebar }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    showSidebar(!moveButton);
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`btn_sidebar ${moveButton ? "left-[186px]" : "left-2"}`}
      >
        <span className="material-symbols-outlined text-[42px] text-white">
          menu
        </span>
      </button>
      {moveButton && (
        <div className="sidebar min-h-screen pt-1">
          {
            //<img src={logo} className="w-40 h-12 object-cover ml-4 my-4"></img>
          }
          <hr className="bg-white h-[3px] mt-1"></hr>
          <a href="/user" className="perfil">
            <span className="material-symbols-outlined text-[42px] text-white">
              person
            </span>
            Mi Perfil
          </a>

          <hr className="bg-white h-[3px] mb-2"></hr>
          <ul className="space-y-5 relative flex flex-col pt-1">
            <li>
              <a href="/dashboard" className="sidebar_item">
                <span className="material-symbols-outlined text-[42px] text-white">
                  finance_mode
                </span>
                Dashboard
              </a>
            </li>
            <li>
              <a href="/Inventario" className="sidebar_item">
                <span className="material-symbols-outlined text-[42px] text-white">
                  package_2
                </span>
                Gestion de
                <br />
                Inventario
              </a>
            </li>
            <li>
              <a href="/reportes" className="sidebar_item">
                <span className="material-symbols-outlined text-[42px] text-white">
                  assignment
                </span>
                Gestion de
                <br />
                pedidos
              </a>
            </li>
            <li>
              <button
                onClick={() => navigate("/campanaPromocional")}
                className="sidebar_item text-left"
              >
                <span className="material-symbols-outlined text-[42px] text-white">
                  percent_discount
                </span>
                Promociones y descuentos
              </button>
            </li>
            <li>
              <a href="/mensajeria" className="sidebar_item">
                <span className="material-symbols-outlined text-[42px] text-white">
                  groups
                </span>
                Gestion de <br />
                Usuarios
              </a>
            </li>
            <li>
              <a href="/mensajeria" className="sidebar_item">
                <span className="material-symbols-outlined text-[42px] text-white">
                  clinical_notes
                </span>
                Reportes
              </a>
            </li>
            <li>
              <a href="/mensajeria" className="sidebar_item">
                <span className="material-symbols-outlined text-[42px] text-white">
                  settings
                </span>
                Configuracion
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
