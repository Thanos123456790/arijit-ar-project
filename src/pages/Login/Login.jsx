import { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";
const API = `${import.meta.env.VITE_API_URL}`;

function Login() {
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
  const [department, setDepartment] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [designation, setDesignation] = useState("");

  const navigate = useNavigate();

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const validatePhone = (phone) => phone.length === 10 && !isNaN(phone);


  const handleLogin = async () => {
    if (!email || !password) {
      alert("Email and password are required.");
      return;
    }

    if (!validateEmail(email)) {
      alert("Please enter a valid email.");
      return;
    }

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password, role })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Login failed.");
        return;
      }

      sessionStorage.setItem("currentUser", JSON.stringify(data.user));
      sessionStorage.setItem("token", data.token);

      if (data.user.role === "admin") {
        navigate("/admin-home");
      } else if (data.user.role === "student") {
        navigate("/student-home");
      } else if (data.user.role === "teacher") {
        navigate("/teacher-home");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during login.");
    }
  };

  const handleSignUp = async () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!validateEmail(email)) {
      alert("Please enter a valid email.");
      return;
    }

    if (!validatePhone(phone)) {
      alert("Phone number must be 10 digits.");
      return;
    }

    if (password.length < 6) {
      alert("Password should be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    let newUser = {
      name,
      email,
      phone,
      password,
      role
    };

    if (role === "student") {
      if (!rollNumber || !branch || !semester) {
        alert("All student fields are required.");
        return;
      }

      newUser = {
        ...newUser,
        rollNumber,
        branch,
        semester
      };
    }

    if (role === "teacher") {
      if (!employeeId || !department || !designation) {
        alert("All teacher fields are required.");
        return;
      }

      newUser = {
        ...newUser,
        employeeId,
        department,
        designation
      };
    }

    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newUser)
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Registration failed.");
        return;
      }
      const existingUsers = JSON.parse(sessionStorage.getItem("currentUser")) || [];
      existingUsers.push(newUser);
      sessionStorage.setItem("currentUser", JSON.stringify(existingUsers));
      alert("User registered successfully!");
      setIsSignUp(false);
    } catch (err) {
      console.error(err);
      alert("An error occurred during registration.");
    }


  };

  return (
    <div className="login-container">
      <div className="form-box">
        {!isSignUp && (
          <div className="watermark">
            <p style={{ color: "black" }}>Exam Handling System</p>
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
    </div>
  );
}

export default Login;
