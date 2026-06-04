import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./Context/AuthContext";
import { WalletProvider } from "./Context/WalletContext";
import { ReferralProvider } from "./Context/ReferralContext";
import { RewardCodeProvider } from "./Context/RewardCodeContext";
import { ChatProvider } from "./Context/ChatContext";
import ProtectedRoute from "./Components/ProtectedRoute";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Home from "./Pages/Home";
import Earn from "./Pages/Earn";
import Wallet from "./Pages/Wallet";
import Profile from "./Pages/Profile";
import ChatPage from "./Pages/ChatPage";
import Referral from "./Pages/Referral";
import Reward from "./Pages/Reward";
import VerifyEmail from "./Pages/VerifyEmail";
import ForgotPassword from "./Pages/Forgotpassword";
import NotFound from "./Pages/NotFound";

const App = () => (
  <AuthProvider>
    <WalletProvider>
      <ReferralProvider>
        <RewardCodeProvider>
          <ChatProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/earn" element={<ProtectedRoute><Earn /></ProtectedRoute>} />
                <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/referral" element={<ProtectedRoute><Referral /></ProtectedRoute>} />
                <Route path="/reward" element={<ProtectedRoute><Reward /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </ChatProvider>
        </RewardCodeProvider>
      </ReferralProvider>
    </WalletProvider>
  </AuthProvider>
);

export default App;
