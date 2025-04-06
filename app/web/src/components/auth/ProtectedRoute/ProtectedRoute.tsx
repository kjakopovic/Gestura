import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

interface Props {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: Props) => {
  const auth = useAuth();

  if (auth?.loading) {
    return <div>Loading...</div>;
  }

  if (!auth?.authState.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
