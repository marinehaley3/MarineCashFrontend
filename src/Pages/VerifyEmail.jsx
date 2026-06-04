import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resendVerify } from "../api/index";
import logo from "../Assets/logo.png";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  const email  = localStorage.getItem("pendingEmail");
  const [resending, setResending] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (status === "success") {
      localStorage.removeItem("pendingEmail");
    }
  }, [status]);

  const handleResend = async () => {
    if (!email) return setMsg("No email found. Please register again.");
    setResending(true);
    try {
      await resendVerify(email);
      setMsg("✅ Verification email resent! Check your inbox.");
    } catch {
      setMsg("❌ Failed to resend. Try again.");
    }
    setResending(false);
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-lg p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-check-circle text-green-500 text-4xl"></i>
          </div>
          <h1 className="text-xl font-extrabold text-gray-800 mb-2">Email Verified!</h1>
          <p className="text-gray-500 text-sm mb-6">Your account is now active. Start earning!</p>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-lg p-8 flex flex-col items-center text-center">
        <img
          src={logo} alt="MarineCash"
          style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", marginBottom: "12px" }}
        />
        <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-4">
          <i className="fas fa-envelope-open-text text-orange-500 text-3xl"></i>
        </div>
        <h1 className="text-xl font-extrabold text-gray-800 mb-2">Check your email</h1>
        <p className="text-gray-500 text-sm mb-1">We sent a verification link to:</p>
        <p className="text-orange-500 font-bold text-sm mb-5">{email || "your email"}</p>
        <p className="text-gray-400 text-xs mb-6">
          Click the link in the email to activate your account. Check spam if you don't see it.
        </p>
        {msg && <p className="text-sm font-semibold text-green-600 mb-4">{msg}</p>}
        <button
          onClick={handleResend} disabled={resending}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition mb-3 disabled:opacity-50"
        >
          {resending ? "Resending..." : "Resend Email"}
        </button>
        <button
          onClick={() => navigate("/login")}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-sm transition"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;
