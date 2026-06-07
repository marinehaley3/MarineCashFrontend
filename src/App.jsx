// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./Context/AuthContext";
import { WalletProvider } from "./Context/WalletContext";
import { ReferralProvider } from "./Context/ReferralContext";
import { RewardCodeProvider } from "./Context/RewardCodeContext";
import { ChatProvider } from "./Context/ChatContext";
import ProtectedRoute from "./Components/ProtectedRoute";
import AdminRoute from "./Components/AdminRoute";

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
import PostTask from "./Pages/PostTask";
import TaskStatus from "./Pages/TaskStatus";
import Campaigns from "./Pages/Campaigns";
import SubmitProof from "./Pages/SubmitProof";


import AdminLayout from "./Pages/Admin/AdminLayout";
import AdminDashboard from "./Pages/Admin/AdminDashboard";
import AdminUsers from "./Pages/Admin/AdminUsers";
import AdminSettings from "./Pages/Admin/AdminSettings";
import AdminBadges from "./Pages/Admin/AdminBadges";
import AdminAnnouncements from "./Pages/Admin/AdminAnnouncements";
import AdminPolls from "./Pages/Admin/AdminPolls";
import AdminRewardCodes from "./Pages/Admin/AdminRewardCodes";
import AdminWithdrawals from "./Pages/Admin/AdminWithdrawals";
import AdminPermissions from "./Pages/Admin/AdminPermissions";
import AdminCampaigns from "./Pages/Admin/AdminCampaigns";


const App = () => (
  <AuthProvider>
    <WalletProvider>
      <ReferralProvider>
        <RewardCodeProvider>
          <ChatProvider>
            <Router>
              <Routes>
                {/* Public */}
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* User */}
                <Route path="/home"     element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/earn"     element={<ProtectedRoute><Earn /></ProtectedRoute>} />
                <Route path="/wallet"   element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
                <Route path="/profile"  element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/chat"     element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/referral" element={<ProtectedRoute><Referral /></ProtectedRoute>} />
                <Route path="/reward"   element={<ProtectedRoute><Reward /></ProtectedRoute>} />
                <Route path="/post-task"   element={<ProtectedRoute><PostTask /></ProtectedRoute>} />
                <Route path="/task-status" element={<ProtectedRoute><TaskStatus /></ProtectedRoute>} />
                <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
                <Route path="/submit-proof/:id" element={<ProtectedRoute><SubmitProof /></ProtectedRoute>} />
                


                {/* Admin */}
                <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users"         element={<AdminUsers />} />
                  <Route path="settings"      element={<AdminSettings />} />
                  <Route path="badges"        element={<AdminBadges />} />
                  <Route path="announcements" element={<AdminAnnouncements />} />
                  <Route path="polls"         element={<AdminPolls />} />
                  <Route path="rewards"       element={<AdminRewardCodes />} />
                  <Route path="withdrawals"   element={<AdminWithdrawals />} />
                  <Route path="permissions"   element={<AdminPermissions />} />
                  <Route path="campaigns" element={<AdminCampaigns />} />
                </Route>

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
