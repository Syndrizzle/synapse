import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Home } from "./routes/Home";
import UploadPage from "./routes/Upload";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
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
            }
          },
        }}
      />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<UploadPage />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
