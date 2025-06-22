import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Home } from "./routes/Home";
import UploadPage from "./routes/Upload";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<UploadPage />} />
      </Routes>
    </Router>
  );
}

export default App;
