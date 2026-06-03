// src/Components/ProtectedRoute.jsx
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-orange-500 text-xl font-bold animate-pulse">Loading...</div>
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
