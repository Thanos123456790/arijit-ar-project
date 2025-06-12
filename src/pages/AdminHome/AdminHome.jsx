import React, { useEffect, useState } from "react";
import {
  FaUsers,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import "./AdminHome.css";
import Chatbot from "../Chatbot/Chatbot";
import { useAlert } from "../../hooks/useAlert"; // adjust the path as needed
import "../../hooks/alert.css"; // assuming you have a CSS file for alert styles
const API = `${import.meta.env.VITE_API_URL}/users`;

export default function AdminHomePage() {
  const { show, AlertPortal } = useAlert();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    departments: {},
    semesters: {},
  });
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    department: "",
    semester: "",
    rollNumber: "",
    employeeId: "",
    designation: "",
  });

  const fetchUsers = async () => {
    const res = await fetch(API);
    const data = await res.json();
    setUsers(data);
    computeStats(data);
  };

  const computeStats = (list) => {
    const st = { students: 0, teachers: 0, departments: {}, semesters: {} };
    list.forEach((u) => {
      if (u.role === "student") {
        st.students++;
        st.departments[u.branch] = (st.departments[u.branch] || 0) + 1;
        const semKey = `${u.branch}-Sem${u.semester}`;
        st.semesters[semKey] = (st.semesters[semKey] || 0) + 1;
      } else if (u.role === "teacher") {
        st.teachers++;
        st.departments[u.department] = (st.departments[u.department] || 0) + 1;
      }
    });
    setStats(st);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const addUser = async () => {
    const payload = {
      name: newUser.name,
      email: newUser.email,
      password: newUser.password,
      role: newUser.role,
    };
    if (newUser.role === "student") {
      payload.branch = newUser.department;
      payload.semester = newUser.semester;
      payload.rollNumber = newUser.rollNumber;
    }
    if (newUser.role === "teacher") {
      payload.employeeId = newUser.employeeId;
      payload.department = newUser.department;
      payload.designation = newUser.designation;
    }
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "student",
        department: "",
        semester: "",
        rollNumber: "",
        employeeId: "",
        designation: "",
      });
      fetchUsers();
      show({ message: "User added successfully", type: "success" });
    } else show({ message: "Failed to add user", type: "error" });
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Remove user?")) return;
    await fetch(`${API}/${id}`, { method: "DELETE" });
    fetchUsers();
    show({ message: "User deleted", type: "info" });
  };

  const handleInput = (e) =>
    setNewUser({ ...newUser, [e.target.name]: e.target.value });

  return (
    <div className="admin-homepage">
      <header className="admin-header">
        <h2>
          <FaUsers /> Admin Dashboard
        </h2>
      </header>
      <section className="kpi-cards">
        <div className="card kpi-card">
          <FaUsers className="icon purple" />
          <h3>Total Users</h3>
          <p>{users.length}</p>
        </div>
        <div className="card kpi-card">
          <FaChalkboardTeacher className="icon green" />
          <h3>Total Teachers</h3>
          <p>{stats.teachers}</p>
        </div>
        <div className="card kpi-card">
          <FaUserGraduate className="icon blue" />
          <h3>Total Students</h3>
          <p>{stats.students}</p>
        </div>
      </section>
      <section className="user-management">
        <h2>User Management</h2>
        <div className="add-user-form">
          <input
            name="name"
            placeholder="Name"
            value={newUser.name}
            onChange={handleInput}
          />
          <input
            name="email"
            placeholder="Email"
            value={newUser.email}
            onChange={handleInput}
          />
          <input
            name="password"
            placeholder="Password"
            value={newUser.password}
            type="password"
            onChange={handleInput}
          />
          <select name="role" value={newUser.role} onChange={handleInput}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
          {newUser.role === "student" && (
            <input
              name="department"
              placeholder="Branch"
              value={newUser.department}
              onChange={handleInput}
            />
          )}
          {newUser.role === "student" && (
            <input
              name="rollNumber"
              placeholder="Roll No"
              value={newUser.rollNumber}
              onChange={handleInput}
            />
          )}
          {newUser.role === "student" && (
            <input
              name="semester"
              placeholder="Semester"
              value={newUser.semester}
              onChange={handleInput}
            />
          )}
          {newUser.role === "teacher" && (
            <input
              name="department"
              placeholder="Department"
              value={newUser.department}
              onChange={handleInput}
            />
          )}
          {newUser.role === "teacher" && (
            <input
              name="employeeId"
              placeholder="Employee ID"
              value={newUser.employeeId}
              onChange={handleInput}
            />
          )}
          {newUser.role === "teacher" && (
            <input
              name="designation"
              placeholder="Designation"
              value={newUser.designation}
              onChange={handleInput}
            />
          )}
          <button className="btn-success" onClick={addUser}>
            <FaPlus /> Add
          </button>
        </div>

        <div className="users-table">
          <h3>Registered Users</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Dept</th>
                <th>Sem</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.branch || u.department || "-"}</td>
                  <td>{u.semester || "-"}</td>
                  <td>
                    <button
                      className="btn-danger"
                      onClick={() => deleteUser(u._id)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <Chatbot />
      <AlertPortal /> {/* <-- 🔥 This is what was missing */}{" "}
    </div>
  );
}
