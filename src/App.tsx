import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Home } from "./routes/Home";
import { Background } from "./components/Background";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

function App() {
  return (
    <Router>
      <Background>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
        <Footer />
      </Background>
    </Router>
  );
}

export default App;
