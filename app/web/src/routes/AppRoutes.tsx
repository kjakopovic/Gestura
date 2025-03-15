import { Routes, Route } from "react-router-dom";
import WebCam from "../pages/WebCam";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<p>Welcome Bro</p>} />
      <Route path="/webcam" element={<WebCam />} />
      <Route path="*" element={<p>Not Found</p>} />
    </Routes>
  );
};

export default AppRoutes;
