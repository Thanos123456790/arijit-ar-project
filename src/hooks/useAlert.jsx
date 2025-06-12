import { useState, useCallback } from "react";
import ReactDOM from "react-dom";
// import "./alert.css";
const alertRoot =
  document.getElementById("alert-root") ||
  (() => {
    const el = document.createElement("div");
    el.id = "alert-root";
    document.body.appendChild(el);
    return el;
  })();

export function useAlert() {
  const [alerts, setAlerts] = useState([]);

  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const show = useCallback(
    ({
      message = "This is an alert!",
      type = "info", // "success" | "error" | "warning" | "info"
      duration = 3000,
      position = "top-right", // "top-right" | "top-left" | "bottom-right" | "bottom-left"
      closable = true,
    }) => {
      const id = Date.now() + Math.random();
      const alert = { id, message, type, position, closable };

      setAlerts((prev) => [...prev, alert]);

      if (duration > 0) {
        setTimeout(() => removeAlert(id), duration);
      }
    },
    []
  );

  const AlertPortal = () =>
    ReactDOM.createPortal(
      <>
        {alerts.map(({ id, message, type, position, closable }) => (
          <div key={id} className={`alert ${type} ${position}`}>
            <span>{message}</span>
            {closable && <button onClick={() => removeAlert(id)}>x</button>}
          </div>
        ))}
      </>,
      alertRoot
    );

  return { show, AlertPortal };
}
