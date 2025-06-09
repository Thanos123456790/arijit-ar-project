import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaCheck, FaArrowRight,FaBackward } from "react-icons/fa";
import "./ManualEvaluation.css";
import Chatbot from "../Chatbot/Chatbot";

const API = `${import.meta.env.VITE_API_URL}`;

export default function ManualEvaluation() {
  const testId = new URLSearchParams(useLocation().search).get("testId");
  const navigate = useNavigate();
  const [subs, setSubs] = useState([]);
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState({});
  const [comms, setComms] = useState({});
  const [loading, setLoading] = useState(true);

  /* ─── fetch all submissions for this test ─── */
  useEffect(() => {
    fetch(`${API}/submissions/test/${testId}`)
      .then((r) => r.json())
      .then((data) => {
        setSubs(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [testId]);

  /* ─── whenever we switch submission, prime inputs ─ */
  useEffect(() => {
    if (!subs[idx]) return;
    const s = {};
    const c = {};
    subs[idx].evaluatedQuestions.forEach((q, i) => {
      if (q.teacherScore != null) s[i] = q.teacherScore;
      if (q.teacherComment) c[i] = q.teacherComment;
    });
    setScores(s);
    setComms(c);
  }, [idx, subs]);

  if (loading) return <p className="loading">Loading…</p>;
  if (!subs.length) return <p>No submissions for this test.</p>;

  const sub = subs[idx];

  /* ─── handlers ─────────────────────────────────── */
  const setScore = (i, v) => setScores({ ...scores, [i]: v });
  const setComment = (i, v) => setComms({ ...comms, [i]: v });

  const save = async () => {
    const body = {
      questions: Object.keys(scores).map(k => ({
        idx: Number(k),
        teacherScore: Number(scores[k]),
        teacherComment: comms[k] || ""
      }))
    };
    const res = await fetch(`${API}/submissions/${sub._id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      alert("Saved!");
      const updated = await res.json();
      const copy = subs.slice();
      copy[idx] = updated.submission;
      setSubs(copy);
    } else alert("Save failed");
  };

  const next = () => {
    if (idx < subs.length - 1) setIdx(idx + 1);
    else alert("All submissions evaluated.");
  };

  return (
    <div className="manual-evaluation-container">
      <header className="evaluation-header">
        <h4>Manual Evaluation Portal</h4>
        <p className="sub-info">
          <span><strong>TestId:</strong> {sub.testId}</span>
          <span><strong>Total:</strong> {sub.totalScore}</span>
          <span><strong>Student:</strong> {sub.studentName}</span>
        </p>
      </header>

      <div className="evaluation-body">
        {sub.evaluatedQuestions.map((q, i) => (
          <div className="question-card" key={i}>
            <h4>Q{i + 1}: {q.question}</h4>
            <p><strong>Answer:</strong> {q.studentAnswer || "—"}</p>
            <p><strong>Correct:</strong> {q.correctAnswer}</p>

            <label>Score:
              <input type="number" min="0" max={q.score}
                value={scores[i] ?? q.obtained}
                onChange={e => setScore(i, e.target.value)} />
            </label>

            <label>Comment:
              <textarea rows="2"
                value={comms[i] ?? ""}
                onChange={e => setComment(i, e.target.value)} />
            </label>
          </div>
        ))}
      </div>

      <footer className="evaluation-actions">
        <button className="back-btn" onClick={() => navigate(-1)}><FaBackward /> Back</button>
        <button className="save-btn" onClick={save}>
          Save <FaCheck />
        </button>
        <button className="next-btn" onClick={next}
          disabled={idx >= subs.length - 1}>
          Next <FaArrowRight />
        </button>
      </footer>

      <Chatbot />
    </div>
  );
}
