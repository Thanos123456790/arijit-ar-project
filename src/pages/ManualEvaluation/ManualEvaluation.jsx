import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaCheck, FaArrowRight, FaBackward } from "react-icons/fa";
import "./ManualEvaluation.css";
import Chatbot from "../Chatbot/Chatbot";
import { useAlert } from "../../hooks/useAlert";

const API = `${import.meta.env.VITE_API_URL}`;

export default function ManualEvaluation() {
  const testId = new URLSearchParams(useLocation().search).get("testId");
  const navigate = useNavigate();
  const { show, AlertPortal } = useAlert();
  const [subs, setSubs] = useState([]);
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState({});
  const [comms, setComms] = useState({});
  const [loading, setLoading] = useState(true);

  /* ─── load submissions ─── */
  useEffect(() => {
    setLoading(true);
    fetch(`${API}/submissions/test/${testId}`)
      .then((r) => r.json())
      .then((data) => {
        setSubs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [testId]);

  /* ─── prime inputs when idx switches ─── */
  useEffect(() => {
    if (!subs[idx]) return;
    const s = {};
    const c = {};
    subs[idx].evaluatedQuestions.forEach((q, i) => {
      if (q.teacherScore != null) s[i] = q.teacherScore;
      if (q.teacherComment != null) c[i] = q.teacherComment;
    });
    setScores(s);
    setComms(c);
  }, [idx, subs]);

  if (loading) return <p className="loading">Loading…</p>;
  if (!subs.length) return <p>No submissions.</p>;

  const sub = subs[idx];

  /* ─── handlers ─── */
  const handleScore = (qIdx, val) =>
    setScores((prev) => ({ ...prev, [qIdx]: val }));
  const handleComment = (qIdx, val) =>
    setComms((prev) => ({ ...prev, [qIdx]: val }));

  /* ─── save current submission ─── */
  const save = async () => {
    // Build a unified list of question indices touched by either scores or comments
    const keys = new Set([...Object.keys(scores), ...Object.keys(comms)]);

    if (!keys.size)
      return show({ message: "No changes to save.", type: "info" });

    const updates = [...keys].map((k) => {
      const i = Number(k);
      const current = sub.evaluatedQuestions[i] || {};
      return {
        idx: i,
        teacherScore:
          scores[k] !== undefined ? Number(scores[k]) : current.teacherScore,
        teacherComment:
          comms[k] !== undefined ? comms[k] : current.teacherComment || "",
      };
    });

    // client-side score validation
    for (const { idx: qIdx, teacherScore } of updates) {
      const max = sub.evaluatedQuestions[qIdx].score;
      if (teacherScore > max || teacherScore < 0) {
        return show({
          message: `Invalid score for Q${qIdx + 1} (0-${max})`,
          type: "error",
        });
      }
    }

    try {
      const res = await fetch(`${API}/submissions/${sub._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: updates }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return show({ message: err.message || "Save failed", type: "error" });
      }

      const { submission } = await res.json();
      setSubs((prev) => prev.map((s, i) => (i === idx ? submission : s)));
      show({ message: "Saved successfully!", type: "success" });
    } catch (err) {
      console.error(err);
      show({ message: "An error occurred while saving.", type: "error" });
    }
  };

  const next = () => {
    if (idx < subs.length - 1) {
      setIdx(idx + 1);
    } else {
      // alert("All submissions evaluated.");
      show({ message: "All submissions evaluated.", type: "info" });
    }
  };

  /* ─── render ─── */
  return (
    <div className="manual-evaluation-container">
      <header className="evaluation-header">
        <h4>Manual Evaluation Portal</h4>
        <p className="sub-info">
          <span>
            <strong>TestId:</strong> {sub.testId}
          </span>
          <span>
            <strong>Total:</strong> {sub.totalScore}
          </span>
          <span>
            <strong>Student:</strong> {sub.studentName}
          </span>
        </p>
      </header>

      <div className="evaluation-body">
        {sub.evaluatedQuestions.map((q, i) => (
          <div className="question-card" key={i}>
            <h4>
              Q{i + 1}: {q.question}
            </h4>
            <p>
              <strong>Answer:</strong> {q.studentAnswer || "—"}
            </p>
            <p>
              <strong>Correct:</strong> {q.correctAnswer}
            </p>

            <label>
              Score:
              <input
                type="number"
                min="0"
                max={q.score}
                value={scores[i] ?? ""}
                onChange={(e) => handleScore(i, e.target.value)}
              />
            </label>

            <label>
              Comment:
              <textarea
                rows="2"
                value={comms[i] ?? ""}
                onChange={(e) => handleComment(i, e.target.value)}
              />
            </label>
          </div>
        ))}
      </div>

      <footer className="evaluation-actions">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FaBackward /> Back
        </button>

        <button className="save-btn" onClick={save}>
          Save <FaCheck />
        </button>

        <button
          className="next-btn"
          onClick={next}
          disabled={idx >= subs.length - 1}
        >
          Next <FaArrowRight />
        </button>
      </footer>

      <Chatbot />
      <AlertPortal />
    </div>
  );
}
