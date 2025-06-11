import React, { useEffect, useState } from "react";
import {
  FaClipboardList, FaBook, FaClock,
  FaCommentDots, FaEdit, FaEye
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Chatbot from "../Chatbot/Chatbot";
import "../TeacherHome/TeacherHomePage.css";

const API = `${import.meta.env.VITE_API_URL}`;

export default function StudentHomePage() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));

  const [tests,      setTests]      = useState([]);
  const [submitted,  setSubmitted]  = useState(new Set());   // ← NEW
  const [commentBox, setCommentBox] = useState({ show:false, id:null });
  const [comment,    setComment]    = useState("");

  /* 1️⃣  fetch all tests (same as before, but simplified) */
  useEffect(() => {
    fetch(`${API}/tests`)
      .then(r=>r.json())
      .then(setTests)
      .catch(console.error);
  }, []);

  /* 2️⃣  fetch my submissions → set of testIds */
  useEffect(() => {
    fetch(`${API}/submissions/student/${currentUser._id}`)
      .then(r=>r.json())
      .then(arr => setSubmitted(new Set(arr.map(o=>String(o.testId)))))
      .catch(console.error);
  }, [currentUser._id]);

  /* 3️⃣  derived metrics */
  const totalAssigned  = tests.length;
  const totalAttempted = submitted.size;

  /* 4️⃣  handlers */
  const handleWriteTest   = id => navigate(`/take-test?testId=${id}`);
  const handleViewResults = id => navigate(`/test-results?testId=${id}`);

  const openComment = id => { setCommentBox({show:true,id}); setComment(""); };

  const sendComment = async () => {
    if (!comment.trim()) return alert("Enter a comment");
    const res = await fetch(`${API}/comments/comment`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        testId: commentBox.id,
        userId: currentUser._id,
        userName: currentUser.name,
        commentText: comment
      })
    });
    if (res.ok){
      alert("Submitted!");
      setCommentBox({show:false,id:null});
    } else alert("Failed");
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
                {!submitted.has(String(t._id)) && (
                  <button className="btn-info" onClick={()=>handleWriteTest(t._id)}>
                    Write Test <FaEdit/>
                  </button>
                )}
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
      {commentBox.visible && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Comment on Test</h3>
            <textarea
              rows="5"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write comment..."
            />
            <div className="popup-actions">
              <button className="btn-secondary"
                      onClick={()=>setCommentBox({show:false,id:null})}>
                Cancel
              </button>
              <button className="btn-success" onClick={sendComment}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      <Chatbot />
    </div>
  );
};