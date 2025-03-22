import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes, useNavigate, useParams } from "react-router-dom";
import "./index.css";
import MainPage from "./pages/MainPage";
import StreamTest from "./pages/StreamTest";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/test" element={<StreamTest />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
