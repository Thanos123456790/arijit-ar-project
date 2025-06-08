import React, { useState, useEffect } from "react";
import {
  FaPlusCircle, FaEdit, FaTrashAlt, FaBook,
  FaClock, FaClipboardList, FaUsers, FaClipboardCheck,
  FaChartLine, FaBrain
} from "react-icons/fa";
import "./TeacherHomePage.css";
import UpdateTest from "../UpdateTest/UpdateTest";
import Chatbot from "../Chatbot/Chatbot";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api/tests/teacher-tests";

const TeacherHomePage = () => {
  const [tests, setTests] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [branchName, setBranchName] = useState("");
  const [semester, setSemester] = useState("");
  const [editingTest, setEditingTest] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [testToDelete, setTestToDelete] = useState(null);

  const navigate = useNavigate();
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
  // console.log(currentUser._id);
  
  useEffect(() => {
    const fetchTests = async () => {
      const res  = await fetch(`${API}?teacherId=${currentUser._id}`);
      const data = await res.json();
      setTests(data);
    };
    fetchTests();
  }, [currentUser]);

  const handleAssignTest = (testId) => {
    setSelectedTestId(testId);
    setShowPopup(true);
  };

  const handlePopupSubmit = async () => {
    const payload = { branch: branchName, semester };
    const res = await fetch(`${API}/${selectedTestId}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      setTests(prev =>
        prev.map(t =>
          t._id === selectedTestId
            ? { ...t, assignedTo: [...t.assignedTo, payload] }
            : t
        )
      );
      alert("Assigned successfully");
    }
    setShowPopup(false);
    setBranchName("");
    setSemester("");
  };
  
  const handleEditTest = (test) => {
    setEditingTest({
      ...test,
      testName: test.name,
      testDuration: test.duration
    });
  };

  const handleUpdateSubmit = async (updated) => {
    const res = await fetch(`${API}/${editingTest._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    });
    if (res.ok) {
      const newTest = await res.json();
      setTests(prev => prev.map(t => (t._id === newTest._id ? newTest : t)));
      alert("Test updated");
    }
    setEditingTest(null);
  };

  /* ────────────────────────────
     Delete test
  ─────────────────────────────*/
  const handleDeleteClick = (t) => {
    setTestToDelete(t);
    setShowDeletePopup(true);
  };

  const confirmDelete = async () => {
    const res = await fetch(`${API}/${testToDelete._id}`, { method: "DELETE" });
    if (res.ok) {
      setTests(prev => prev.filter(t => t._id !== testToDelete._id));
      alert("Deleted");
    }
    setShowDeletePopup(false);
    setTestToDelete(null);
  };

  /* ────────────────────────────
     Misc helpers
  ─────────────────────────────*/
  const handleViewResults     = () => navigate("/test-results-teacher");
  const handleMannualEvaluation     = (id) => navigate(`/manual-evaluation?testId=${id}`);
  const handleAIEvaluation          = (id) => navigate(`/ai-evaluation?testId=${id}`);
  const navigateToCreateTest  = ()  => navigate("/create-test");

  const totalAssignedClasses = tests.reduce(
    (sum, t) => sum + t.assignedTo.length, 0
  );
  const totalStudents = tests.reduce(
    (sum, t) => sum + (t.studentsAttempted || 0), 0
  );


  return (
    <div className="teacher-homepage">
      <header className="teacher-header">
        <h1>
          <FaClipboardList
            style={{ fontSize: "1.6rem" }}
            className="header-icon"
          />{" "}
          Teacher Dashboard
        </h1>
      </header>

      {/* Summary Cards */}
      <section className="summary-cards">
        <div className="card stat-card">
          <h3>Total Tests</h3>
          <p>{tests.length}</p>
        </div>
        <div className="card stat-card">
          <h3>Classes Assigned</h3>
          <p>{totalAssignedClasses}</p>
        </div>
        <div className="card stat-card">
          <h3>Manual Evaluations</h3>
          <p>{totalStudents}</p>
        </div>

        <div className="card stat-card">
          <h3>Auto Evaluation</h3>
          <p>{totalStudents}</p>
        </div>
      </section>

      {/* Tests Grid */}
      <section className="tests-section">
        <h3 style={{ color: "black" }}>Available Tests</h3>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "10px",
          }}
        >
          {" "}
          <button
            style={{ width: "unset", padding: 10 }}
            className="btn-primary"
            onClick={navigateToCreateTest}
          >
            <FaPlusCircle /> Create Test
          </button>
        </div>

        <div className="tests-container">
          {tests.map((test) => (
            <div key={test.id} className="test-card">
              <h3>
                <FaBook className="icon green" /> {test.name}
              </h3>

              <p style={{ color: "black" }}>
                <FaClock className="icon yellow" /> Duration: {test.duration}
              </p>
              <p style={{ color: "black" }}>Total Score: {test.totalScore}</p>
              <p style={{ color: "black" }}>
                Assigned To:{" "}
                {test.assignedTo.length > 0
                  ? test.assignedTo[0].branch +
                  "," +
                  test.assignedTo[0].semester
                  : "None"}
              </p>
              <p style={{ color: "black" }}>
                <FaUsers style={{ fontSize: "1.5rem" }} className="icon blue" />{" "}
                Students Attempted: {test.studentsAttempted}
              </p>
              <div className="card-actions">
                <button
                  style={{ background: "#28a745" }}
                  className="btn-success"
                  title="Assign"
                  onClick={() => handleAssignTest(test.id)}
                >
                  Assign{" "}
                </button>
                <button
                  title="Edit test"
                  className="btn-warning"
                  onClick={() => handleEditTest(test)}
                >
                  <FaEdit />
                </button>
                <button
                  style={{ background: "#c2185b" }}
                  title="Delete test"
                  className="btn-danger"
                  onClick={() => handleDeleteClick(test)}
                >
                  <FaTrashAlt />
                </button>
                <button
                  title="View Results"
                  className="btn-info"
                  onClick={() => handleViewResults(test.id)}
                >
                  <FaChartLine />
                </button>

                {test.evaluationType === "Manual" && (
                  <button
                    title="Evaluate"
                    className="btn-secondary"
                    onClick={() => handleMannualEvaluation(test.id)}
                  >
                    <FaClipboardCheck />
                  </button>
                )}
                {test.evaluationType === "AI" && (
                  <button
                    title="Evaluate"
                    className="btn-secondary"
                    onClick={() => handleAIEvaluation(test.id)}
                  >
                    <FaBrain />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Assign Popup */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3 style={{ color: "black" }}>Assign Test to Class</h3>
            <input
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="Enter branch name"
            />
            <input
              type="text"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              placeholder="Enter semester name"
            />
            <div className="popup-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowPopup(false)}
              >
                Cancel
              </button>
              <button className="btn-success" onClick={handlePopupSubmit}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3 style={{ color: "black" }}>Confirm Delete</h3>
            <p>
              Are you sure you want to delete the test:{" "}
              <strong>{testToDelete.name}</strong>?
            </p>
            <div className="popup-actions">
              <button className="btn-secondary" onClick={()=>setShowDeletePopup(false)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={confirmDelete}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Test Section */}
      {editingTest && (
        <div className="popup-overlay">
          <UpdateTest
            initialTestData={editingTest}
            onUpdate={handleUpdateSubmit}
            onCancel={()=>setEditingTest(null)}
          />
        </div>
      )}

      <Chatbot />
    </div>
  );
};

export default TeacherHomePage;
