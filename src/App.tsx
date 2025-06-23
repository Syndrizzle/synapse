import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Home } from "./routes/Home";
import toast, { Toaster, useToasterStore, ToastBar } from "react-hot-toast";
import { useEffect } from "react";
import { Uploading } from "./routes/Uploading";
import { Analyzing } from "./routes/Analyzing";
import { Error } from "./routes/Error";
import UploadPage from "./routes/Upload";


function App() {
  const { toasts } = useToasterStore();
  const TOAST_LIMIT = 2;

  useEffect(() => {
    toasts
      .filter((t) => t.visible)
      .filter((_, i) => i >= TOAST_LIMIT)
      .forEach((t) => toast.dismiss(t.id));
  }, [toasts]);

  return (
    <>
      <style>
        {`
          @keyframes slideInLeft {
            from {
              transform: translateX(-100%);
            }
            to {
              transform: translateX(0);
            }
          }
          @keyframes slideOutLeft {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(-110%);
            }
          }
        `}
      </style>
      <Toaster
        position="bottom-left"
        toastOptions={{
          className: "font-body font-medium shadow-black shadow-lg",
          style: {
            background: "#27272a",
            color: "#fafafa",
            borderRadius: "0px",
            border: "3px solid #171717",
          },
          error: {
            style: {
              background: "#f87171",
              color: "#171717",
            },
            iconTheme: {
              primary: "#171717",
              secondary: "#f87171",
            },
          },
        }}
      >
        {(t) => (
          <ToastBar
            toast={t}
            style={{
              ...t.style,
              animation: t.visible
                ? "slideInLeft 0.3s forwards"
                : "slideOutLeft 0.4s forwards",
            }}
          >
            {({ icon, message }) => (
              <div
                onClick={() => toast.dismiss(t.id)}
                className="flex items-center"
                style={{ cursor: "pointer" }}
              >
                {icon}
                {message}
              </div>
            )}
          </ToastBar>
        )}
      </Toaster>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/uploading" element={<Uploading />} />
          <Route path="/analyzing" element={<Analyzing />} />
          <Route path="/error" element={<Error />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
