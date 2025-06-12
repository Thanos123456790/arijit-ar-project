import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaCheck, FaArrowRight, FaRobot, FaBackward } from "react-icons/fa";
import "./AiEvaluation.css";
import Chatbot from "../Chatbot/Chatbot";
import { useAlert } from "../../hooks/useAlert";
import "../../hooks/alert.css";

const API = `${import.meta.env.VITE_API_URL}`;

function AIEvaluation() {
  const testId = new URLSearchParams(useLocation().search).get("testId");
  const navigate = useNavigate();
  const [subs, setSubs] = useState([]);
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState({});
  const [comms, setComms] = useState({});
  const [loading, setLoad] = useState(true);
  const { show, AlertPortal } = useAlert();

  /* ─── fetch submissions once ───────────── */
  useEffect(() => {
    fetch(`${API}/submissions/test/${testId}`)
      .then((r) => r.json())
      .then((data) => {
        setSubs(data);
        setLoad(false);
      })
      .catch(console.error);
  }, [testId]);

  // console.log(subs);

  const sub = subs[idx];

  /* ─── inputs ───────────────────────────── */
  const setScore = (qIdx, val) => setScores({ ...scores, [qIdx]: val });
  const setComment = (qIdx, val) => setComms({ ...comms, [qIdx]: val });

  const saveEval = async () => {
    const updates = Object.keys(scores).map((k) => ({
      idx: Number(k),
      teacherScore: Number(scores[k]),
      teacherComment: comms[k] || "",
    }));

    /* client-side validation */
    for (const { idx, teacherScore } of updates) {
      const max = sub.evaluatedQuestions[idx].score;
      if (teacherScore > max || teacherScore < 0) {
        return show({
          message: `Score for Q${idx + 1} must be between 0 and ${max}`,
          type: "error",
        });
      }
    }

    const res = await fetch(`${API}/submissions/${sub._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions: updates }),
    });

    if (!res.ok) {
      const err = await res.json();
      return show({ message: err.error || "Save failed", type: "error" });
    }

    const { submission } = await res.json();
    setSubs((prev) => prev.map((s, i) => (i === idx ? submission : s)));
    setScores({});
    setComms({});
    show({ message: "Saved!", type: "success" });
  };

  /* ─── next submission ───────────────────── */
  const next = () => {
    if (idx < subs.length - 1) {
      setIdx(idx + 1);
      setScores({});
      setComms({});
    } else show({ message: "All submissions evaluated.", type: "info" });
  };

  /* ─── quick AI evaluation (front-end mock) ─ */
  const aiEval = async () => {
    if (!sub) return;

    try {
      const res = await fetch(`${API}/ai/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: sub.evaluatedQuestions }),
      });

      const data = await res.json();

      const aiS = {}, aiC = {};
      data.forEach((res, i) => {
        aiS[i] = res.score;
        aiC[i] = res.comment;
      });

      setScores(aiS);
      setComms(aiC);
    } catch (err) {
      show({ message: "AI evaluation failed", type: "error" });
      console.error(err);
    }
  };


  /* ─── render guards ─────────────────────── */
  if (loading) return <p className="loading">Loading…</p>;
  if (!subs.length) return <p>No submissions.</p>;

  return (
    <div className="manual-evaluation-container">
      <header className="evaluation-header">
        <h4 style={{ paddingBottom: "6px" }}>AI Evaluation Portal</h4>
        <p
          style={{
            fontSize: "14px",
            display: "flex",
            justifyContent: "center",
            gap: "20px",
          }}
        >
          <span>
            <strong>Test ID:</strong> {sub.testId}
          </span>
          <span>
            <strong>Total Score:</strong> {sub.totalScore}
          </span>
          <span>
            <strong>Obtained:</strong> {sub.obtainedScore}
          </span>
          <span>
            <strong>%:</strong> {sub.percentage}
          </span>
          <span>
            <strong>Student Name:</strong> {sub.studentName}
          </span>
          {/* <span><strong>Roll Number:</strong> {sub.student.rollNumber}</span> */}
        </p>
      </header>
      <div className="evaluation-body">
        <div className="questions-list">
          {sub.evaluatedQuestions.map((q, i) => (
            <div className="question-card" key={i}>
              <h4>
                Question {i + 1}: {q.question}
              </h4>
              <p>
                <strong>Student Answer:</strong>{" "}
                {q.studentAnswer || "Not Answered"}
              </p>
              <p>
                <strong>Correct Answer:</strong> {q.correctAnswer}
              </p>

              <div className="input-group">
                <label>Score:</label>
                <input
                  type="number"
                  min="0"
                  max={q.score}
                  value={scores[i] || ""}
                  onChange={(e) => setScore(i, e.target.value)}
                  placeholder="Enter score"
                />
              </div>
              <div className="input-group">
                <label>Comment:</label>
                <textarea
                  rows="2"
                  placeholder="Add a comment (optional)"
                  value={comms[i] || ""}
                  onChange={(e) => setComment(i, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <footer className="evaluation-actions">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FaBackward /> Back
        </button>
        <button className="save-btn" onClick={saveEval}>
          Save Evaluation <FaCheck />
        </button>
        <button className="next-btn" onClick={next}>
          Next Submission <FaArrowRight />
        </button>
        <button
          className="next-btn"
          style={{ backgroundColor: "#28a745" }}
          onClick={aiEval}
        >
          Evaluate with AI <FaRobot />
        </button>
      </footer>
      <Chatbot />
      <AlertPortal /> {/* <-- 🔥 This is what was missing */}
    </div>
  );
}

export default AIEvaluation;
