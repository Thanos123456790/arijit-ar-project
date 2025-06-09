import React, { useState, useEffect } from "react";
import {
  FaClipboardList,
  FaBook,
  FaClock,
  FaCommentDots,
  FaEdit,
  FaEye,
} from "react-icons/fa";
import "../TeacherHome/TeacherHomePage.css";
import Chatbot from "../Chatbot/Chatbot";
import { useNavigate } from "react-router-dom";

const API = `${import.meta.env.VITE_API_URL}`;

const StudentHomePage = () => {
  const [tests, setTests] = useState([]);
  const [commentPopup, setCommentPopup] = useState({ visible: false, testId: null });
  const [commentText, setCommentText] = useState("");
  const navigate = useNavigate();

  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));

  useEffect(() => {
    async function fetchTests() {
      const res = await fetch(`${API}/tests`);
      const all = await res.json();          // everything from the API
      const me = JSON.parse(sessionStorage.getItem("currentUser"));
      const mail = me?.email?.toLowerCase();  // student’s e-mail

      const show = all.filter(t => {
        if (!t.assignedTo || t.assignedTo.length === 0) return true;

        const first = t.assignedTo[0];
        if (typeof first === "string") {
          return t.assignedTo.map(e => e.toLowerCase()).includes(mail);
        }

        return t.assignedTo.some(a =>
          (Array.isArray(a.emails) && a.emails.map(e => e.toLowerCase()).includes(mail)) ||
          (Array.isArray(a.email) && a.email.map(e => e.toLowerCase()).includes(mail))
        );
      });

      setTests(show);
    }
    fetchTests();
  }, []);


  const handleWriteTest = (testId) => navigate(`/take-test?testId=${testId}`);
  const handleViewResults = (testId) => navigate(`/test-results?testId=${testId}`);
  const totalAssigned = tests.length;
  const totalAttempted = tests.filter((t) => t.studentsAttempted > 0).length;

  const openComment = (testId) => {
    console.log(testId);
    setCommentPopup({ visible: true, testId });
    setCommentText("");
  };

  const submitComment = async () => {
    if (!commentText.trim()) return alert("Enter a comment.");
    const payload = {
      testId: commentPopup.testId,
      userId: currentUser._id,
      userName: currentUser.name,
      commentText,
    };
    console.log(commentText);
    const res = await fetch(`${API}/comments/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      alert("Comment submitted!");
      setCommentPopup({ visible: false, testId: null });
    } else {
      alert("Failed to submit comment.");
    }
  };

  return (
    <div className="teacher-homepage">
      <header className="teacher-header">
        <h1>
          <FaClipboardList className="header-icon" /> Student Dashboard
        </h1>
      </header>
      <section className="summary-cards">
        <div className="card stat-card">
          <h3>Total Tests Assigned</h3><p>{totalAssigned}</p>
        </div>
        <div className="card stat-card">
          <h3>Tests Attempted</h3><p>{totalAttempted}</p>
        </div>
        <div className="card stat-card">
          <h3>Results Published</h3><p>0</p>
        </div>
      </section>
      <section className="tests-section">
        <h3>Assigned Tests</h3>
        <div className="tests-container">
          {tests.map((t, index) => (
            <div key={index} className="test-card">
              <h3><FaBook className="icon green" /> {t.name}</h3>
              <p><FaClock className="icon yellow" /> Duration: {t.duration}</p>
              <p>Total Score: {t.totalScore}</p>
              <div className="card-actions">
                <button className="btn-info" onClick={() => handleWriteTest(t._id)}>
                  Write Test <FaEdit />
                </button>
                <button className="btn-secondary" onClick={() => handleViewResults(t._id)}>
                  Results <FaEye />
                </button>
                <button className="btn-warning" onClick={() => openComment(t._id)}>
                  Comment <FaCommentDots />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      {commentPopup.visible && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Comment on Test</h3>
            <textarea
              rows="5"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write comment..."
            />
            <div className="popup-actions">
              <button className="btn-secondary" onClick={() => setCommentPopup({ visible: false, testId: null })}>Cancel</button>
              <button className="btn-success" onClick={submitComment}>Submit</button>
            </div>
          </div>
        </div>
      )}
      <Chatbot />
    </div>
  );
};

export default StudentHomePage;
