'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function LoginForm() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState("student");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [rollNumber, setRollNumber] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [step, setStep] = useState("email");
  const [newPassword, setNewPassword] = useState("");

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const validatePhone = (phone) => phone.length === 10 && !isNaN(+phone);

  const handleLogin = async () => {
    if (!email || !password) {
      return toast.warning("Email and password are required.");
    }
    if (!validateEmail(email)) {
      return toast.warning("Please enter a valid email.");
    }

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        return toast.error(data.message || "Login failed.");
      }

      localStorage.setItem("currentUser", data.token); // you may encrypt if needed
      const destination =
        data.user.role === "admin"
          ? "/admin/dashboard"
          : data.user.role === "student"
            ? "/student/dashboard"
            : "/teacher/dashboard";

      router.replace(destination);
    } catch (err) {
      toast.error("An error occurred during login.");
    }
  };

  const handleSignUp = async () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      return toast.warning("Please fill in all required fields.");
    }
    if (!validateEmail(email)) {
      return toast.warning("Please enter a valid email.");
    }
    if (!validatePhone(phone)) {
      return toast.warning("Phone number must be 10 digits.");
    }
    if (password.length < 6) {
      return toast.warning("Password should be at least 6 characters.");
    }
    if (password !== confirmPassword) {
      return toast.warning("Passwords do not match.");
    }

    let newUser = { name, email, phone, password, role };

    if (role === "student") {
      if (!rollNumber || !branch || !semester) {
        return toast.warning("All student fields are required.");
      }
      Object.assign(newUser, { rollNumber, branch, semester });
    }

    if (role === "teacher") {
      if (!employeeId || !department || !designation) {
        return toast.warning("All teacher fields are required.");
      }
      Object.assign(newUser, { employeeId, department, designation });
    }

    try {
      const res = await fetch(`${API}/auth/register/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();
      if (!res.ok) {
        return toast.error(data.message || "Registration failed.");
      }

      sessionStorage.setItem("_pending_user", JSON.stringify(newUser));
      router.push("/verify-otp");
    } catch (err) {
      toast.error("An error occurred.");
    }
  };

  const handleSendOtp = async () => {
    if (!validateEmail(resetEmail)) {
      return toast.warning("Enter a valid email.");
    }

    try {
      const res = await fetch(`${API}/reset/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await res.json();
      if (!res.ok) return toast.error(data.message || "Failed to send OTP.");

      toast.success("OTP sent to your email.");
      setStep("otp");
    } catch {
      toast.error("Something went wrong.");
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const res = await fetch(`${API}/reset/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, otp: resetOtp }),
      });

      const data = await res.json();
      if (!res.ok) return toast.error(data.message || "Invalid OTP.");

      toast.success("OTP verified. Set new password.");
      setStep("password");
    } catch {
      toast.error("Verification failed.");
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      return toast.warning("Password must be at least 6 characters.");
    }

    try {
      const res = await fetch(`${API}/reset/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) return toast.error(data.message || "Failed to reset password.");

      toast.success("Password reset successful.");
      setShowResetModal(false);
      setStep("email");
      setResetEmail("");
      setResetOtp("");
      setNewPassword("");
    } catch {
      toast.error("Error resetting password.");
    }
  };

  return (
    <div className="login-container">
      <div className="form-box">
        {!isSignUp && (
          <div className="watermark">
            <p>Secure Exam Handling & Encrypted Storage System</p>
            <p>Asansol Engineering College</p>
            <p>Computer Science and Engineering</p>
          </div>
        )}

        <h3>{isSignUp ? "Sign Up" : "Login"}</h3>

        <div className="role-selection mb-4">
          {["student", "teacher", !isSignUp && "admin"]
            .filter(Boolean)
            .map((r) => (
              <label key={r}>
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={role === r}
                  onChange={() => setRole(r)}
                />
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </label>
            ))}
        </div>

        {isSignUp && role !== "admin" && (
          <>
            <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </>
        )}

        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

        {!isSignUp && (
          <p
            className="text-sm text-blue-600 cursor-pointer mt-1"
            onClick={() => setShowResetModal(true)}
          >
            Forgot Password?
          </p>
        )}

        {isSignUp && role !== "admin" && (
          <>
            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {role === "student" && (
              <>
                <Input placeholder="Roll Number" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
                <Input placeholder="Branch" value={branch} onChange={(e) => setBranch(e.target.value)} />
                <Input placeholder="Semester" value={semester} onChange={(e) => setSemester(e.target.value)} />
              </>
            )}

            {role === "teacher" && (
              <>
                <Input placeholder="Employee ID" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
                <Input placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
                <Input placeholder="Designation" value={designation} onChange={(e) => setDesignation(e.target.value)} />
              </>
            )}
          </>
        )}

        <Button className="mt-4 w-full" onClick={isSignUp ? handleSignUp : handleLogin}>
          {isSignUp ? "Sign Up" : "Login"}
        </Button>

        {role !== "admin" && (
          <p className="text-sm text-center mt-2">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
            <span className="text-blue-600 cursor-pointer ml-1" onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? "Login" : "Sign Up"}
            </span>
          </p>
        )}
      </div>

      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          {step === "email" && (
            <>
              <Input placeholder="Enter your registered email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
              <Button onClick={handleSendOtp}>Send OTP</Button>
            </>
          )}
          {step === "otp" && (
            <>
              <Input placeholder="Enter OTP" value={resetOtp} onChange={(e) => setResetOtp(e.target.value)} />
              <Button onClick={handleVerifyOtp}>Verify OTP</Button>
            </>
          )}
          {step === "password" && (
            <>
              <Input placeholder="Enter New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <Button onClick={handleResetPassword}>Reset Password</Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
