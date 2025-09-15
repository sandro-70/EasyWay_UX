import React from "react";
import { toast } from "react-toastify";

const ToastTester = () => {
  return (
    <div style={{ display: "flex", gap: "10px", marginTop: "20px", marginBottom: "50px" }}>
      <button
        onClick={() => toast.success("Inicio de sesión correcto", { className: "toast-success" })}
      >
        Success
      </button>

      <button
        onClick={() => toast.error("Credenciales inválidas", { className: "toast-error" })}
      >
        Error
      </button>

      <button
        onClick={() => toast.warn("Campo vacío", { className: "toast-warn" })}
      >
        Warn
      </button>

      <button
        onClick={() => toast.info("Revisa tu correo", { className: "toast-info" })}
      >
        Info
      </button>

      <button
        onClick={() => toast("Mensaje", { className: "toast-default" })}
      >
        Default
      </button>
    </div>
  );
};

export default ToastTester;
