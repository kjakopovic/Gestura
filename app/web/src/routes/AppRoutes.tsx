import { Routes, Route } from "react-router-dom";
import WebCam from "@/pages/WebCam";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import ForgotPassword from "@/pages/ForgotPassword";
import LandingPage from "@/pages/LandingPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/webcam" element={<WebCam />} />
      <Route path="/buy" element={<p>Buy Gestura</p>} />
      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<p>Not Found</p>} />
    </Routes>
  );
};

export default AppRoutes;
