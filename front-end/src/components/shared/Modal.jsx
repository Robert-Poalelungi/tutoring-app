import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./Modal.css";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  confirmLabel = "Confirmă",
  cancelLabel = "Anulează",
  onConfirm,
  confirmDisabled = false,
}) => {
  const overlayRef = useRef(null);

  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="modal-card">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Închide">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {(onConfirm || cancelLabel) && (
          <div className="modal-footer">
            <button type="button" className="modal-btn modal-btn--cancel" onClick={onClose}>
              {cancelLabel}
            </button>
            {onConfirm && (
              <button
                type="button"
                className="modal-btn modal-btn--confirm"
                onClick={onConfirm}
                disabled={confirmDisabled}
              >
                {confirmLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
