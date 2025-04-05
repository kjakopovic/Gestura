import { Routes, Route } from "react-router-dom";
import WebCam from "@/pages/WebCam";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import ForgotPassword from "@/pages/ForgotPassword";
import LandingPage from "@/pages/LandingPage";
import MainPage from "@/pages/MainPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/webcam" element={<WebCam />} />
      <Route path="/buy" element={<p>Buy Gestura</p>} />
      <Route path="/license" element={<p>license</p>} />
      <Route path="/about" element={<p>about</p>} />
      <Route path="/news" element={<p>news</p>} />
      <Route path="/help" element={<p>help</p>} />
      <Route path="/contact" element={<p>contact</p>} />
      <Route path="/" element={<LandingPage />} />
      <Route path="/main-page" element={<MainPage />} />
      <Route path="*" element={<p>Not Found</p>} />
    </Routes>
  );
};

export default AppRoutes;
