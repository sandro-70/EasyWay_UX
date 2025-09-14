import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

const MODAL_ROOT_ID = "modal-root";

function ensureModalRoot() {
  let root = document.getElementById(MODAL_ROOT_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = MODAL_ROOT_ID;
    // Ensure the modal root sits above other content and covers viewport
    Object.assign(root.style, {
      position: "fixed",
      top: "0",
      left: "0",
      right: "0",
      bottom: "0",
      zIndex: "2147483647", // very high to be above other z-index values
      pointerEvents: "none",
    });
    document.body.appendChild(root);
  }
  return root;
}

export default function ModalPortal({ children }) {
  // Create or reuse modal root once
  const modalRoot = useMemo(() => ensureModalRoot(), []);

  // when rendering children inside modal root we want the immediate wrapper
  // to allow pointer events for modal content while the root itself is
  // non-interactive to avoid blocking page interactions when no modal is open.
  useEffect(() => {
    return () => {
      // optional cleanup: don't remove the root to avoid re-creating on every mount
    };
  }, []);

  return createPortal(
    <div style={{ width: "100%", height: "100%", pointerEvents: "auto" }}>
      {children}
    </div>,
    modalRoot
  );
}
