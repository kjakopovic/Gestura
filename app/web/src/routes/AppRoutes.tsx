import { Routes, Route, Outlet } from "react-router-dom";
import WebCam from "@/pages/WebCam";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import ForgotPassword from "@/pages/ForgotPassword";
import LandingPage from "@/pages/LandingPage";
import MainPage from "@/pages/MainPage";
import LoginCallback from "@/pages/LoginCallback";
import { ProtectedRoute } from "@/components/auth";
import { APP_ROUTES } from "@/constants/common";
import ChatRoom from "@/pages/ChatRoom";
import { RoomProvider } from "@/contexts/RoomContext";
import CreateRoom from "@/pages/CreateRoom";
import JoinRoom from "@/pages/JoinRoom";

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path={APP_ROUTES.WEBCAM}
        element={
          <ProtectedRoute>
            <WebCam />
          </ProtectedRoute>
        }
      />
      <Route
        path={APP_ROUTES.MAIN_PAGE}
        element={
          <ProtectedRoute>
            <MainPage />
          </ProtectedRoute>
        }
      />
      <Route
        element={
          <RoomProvider>
            <Outlet />
          </RoomProvider>
        }
      >
        <Route
          path="room/create"
          element={
            <ProtectedRoute>
              <CreateRoom />
            </ProtectedRoute>
          }
        />
        <Route
          path="room/join"
          element={
            <ProtectedRoute>
              <JoinRoom />
            </ProtectedRoute>
          }
        />
        <Route
          path="room/:id"
          element={
            <ProtectedRoute>
              <ChatRoom />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path={APP_ROUTES.LOGIN} element={<Login />} />
      <Route path={APP_ROUTES.SIGNUP} element={<SignUp />} />
      <Route path={APP_ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
      <Route path={APP_ROUTES.LANDING_PAGE} element={<LandingPage />} />
      <Route path={APP_ROUTES.AUTH_CALLBACK} element={<LoginCallback />} />
      <Route path={APP_ROUTES.BUY} element={<p>Buy Gestura</p>} />
      <Route path={APP_ROUTES.LICENSE} element={<p>license</p>} />
      <Route path={APP_ROUTES.ABOUT} element={<p>about</p>} />
      <Route path={APP_ROUTES.NEWS} element={<p>news</p>} />
      <Route path={APP_ROUTES.HELP} element={<p>help</p>} />
      <Route path={APP_ROUTES.CONTACT} element={<p>contact</p>} />
      <Route path={APP_ROUTES.NOT_FOUND} element={<p>Not Found</p>} />
    </Routes>
  );
};

export default AppRoutes;
