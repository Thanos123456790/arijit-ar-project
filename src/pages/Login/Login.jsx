import { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { useAlert } from "../../hooks/useAlert";

const API = `${import.meta.env.VITE_API_URL}`;

function Login() {
  const { show, AlertPortal } = useAlert();
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

  const navigate = useNavigate();

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const validatePhone = (phone) => phone.length === 10 && !isNaN(phone);

  const handleLogin = async () => {
    if (!email || !password) {
      show({ message: "Email and password are required.", type: "warning" });
      return;
    }
    if (!validateEmail(email)) {
      show({ message: "Please enter a valid email.", type: "warning" });
      return;
    }

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();

      if (!res.ok) {
        show({ message: data.message || "Login failed.", type: "error" });
        return;
      }

      sessionStorage.setItem("currentUser", JSON.stringify(data.user));
      sessionStorage.setItem("token", data.token);
      const dest =
        data.user.role === "admin"
          ? "/admin-home"
          : data.user.role === "student"
          ? "/student-home"
          : "/teacher-home";
      navigate(dest);
    } catch (err) {
      console.error(err);
      show({ message: "An error occurred during login.", type: "error" });
    }
  };

  const handleSignUp = async () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      show({ message: "Please fill in all required fields.", type: "warning" });
      return;
    }
    if (!validateEmail(email)) {
      show({ message: "Please enter a valid email.", type: "warning" });
      return;
    }
    if (!validatePhone(phone)) {
      show({ message: "Phone number must be 10 digits.", type: "warning" });
      return;
    }
    if (password.length < 6) {
      show({ message: "Password should be at least 6 characters.", type: "warning" });
      return;
    }
    if (password !== confirmPassword) {
      show({ message: "Passwords do not match.", type: "warning" });
      return;
    }

    let newUser = { name, email, phone, password, role };
    if (role === "student") {
      if (!rollNumber || !branch || !semester) {
        show({ message: "All student fields are required.", type: "warning" });
        return;
      }
      newUser = { ...newUser, rollNumber, branch, semester };
    }
    if (role === "teacher") {
      if (!employeeId || !department || !designation) {
        show({ message: "All teacher fields are required.", type: "warning" });
        return;
      }
      newUser = { ...newUser, employeeId, department, designation };
    }

    try {
      const res = await fetch(`${API}/auth/register/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (!res.ok) {
        show({ message: data.message || "Registration failed.", type: "error" });
        return;
      }
      // OTP sent, navigate to verification
      sessionStorage.setItem("_pending_user", JSON.stringify(newUser));
      navigate("/verify-otp");
    } catch (err) {
      console.error(err);
      show({ message: "An error occurred.", type: "error" });
    }
  };

  return (
    <div className="login-container">
      <div className="form-box">
        {!isSignUp && (
          <div className="watermark">
            <p style={{ color: "black" }}>
              Secure Exam Handling <br /> & Encrtpted Storage System
            </p>
            <p>Asansol Engineering College</p>
            <p>Computer Science and Engineering</p>
          </div>
        )}

        {!isSignUp && <h3>Login</h3>}

        <div className="role-selection">
          <label>
            <input
              type="radio"
              value="student"
              checked={role === "student"}
              onChange={() => setRole("student")}
            />
            Student
          </label>
          <label>
            <input
              type="radio"
              value="teacher"
              checked={role === "teacher"}
              onChange={() => setRole("teacher")}
            />
            Teacher
          </label>
          {!isSignUp && (
            <label>
              <input
                type="radio"
                value="admin"
                checked={role === "admin"}
                onChange={() => setRole("admin")}
              />
              Admin
            </label>
          )}
        </div>

        {isSignUp && role !== "admin" && (
          <>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {isSignUp && role !== "admin" && (
          <>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {role === "student" && (
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Roll Number"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Semester"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                />
              </div>
            )}

            {role === "teacher" && (
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Employee ID"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Designation"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                />
              </div>
            )}
          </>
        )}

        <button onClick={isSignUp ? handleSignUp : handleLogin}>
          {isSignUp ? "Sign Up" : "Login"}
        </button>

        {role !== "admin" && (
          <p className="toggle-text">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
            <span onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? " Login" : " Sign Up"}
            </span>
          </p>
        )}
      </div>
      <AlertPortal />
    </div>
  );
}

export default Login;
