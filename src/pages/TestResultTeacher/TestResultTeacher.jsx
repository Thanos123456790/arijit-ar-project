import React, { useState, useEffect } from "react";
import {
  FaChartBar, FaEye, FaTimesCircle, FaDownload, FaBackward, FaFlag
} from "react-icons/fa";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import "./TestResultTeacher.css";
import { useLocation, useNavigate } from "react-router-dom";

const API = `${import.meta.env.VITE_API_URL}`;
const COLORS = ["#28a745", "#dc3545", "#ffc107", "#17a2b8"];

export default function TeacherTestResults() {
  const testId = new URLSearchParams(useLocation().search).get("testId");
  const navigate = useNavigate();

  const [subs, setSubs] = useState(null);
  const [selected, setSelected] = useState(null);
  const [comments, setComments] = useState([]);
  const [cheatMap, setCheat] = useState({});
  const [noResults, setNoResults] = useState(false);

  // Fetch comments
  useEffect(() => {
    if (!testId) return;
    fetch(`${API}/comments/${testId}`)
      .then((r) => r.json())
      .then(setComments)
      .catch(console.error);
  }, [testId]);

  // Fetch cheating logs
  useEffect(() => {
    if (!testId) return;
    fetch(`${API}/cheating/${testId}`)
      .then(r => r.json())
      .then((logs) => {
        const map = {};
        logs.forEach((log) => {
          if (!map[log.studentId]) map[log.studentId] = log.event;
        });
        setCheat(map);
      })
      .catch(console.error);
  }, [testId]);

  // Fetch submissions
  useEffect(() => {
    async function getSubs() {
      try {
        const res = await fetch(`${API}/results/${testId}`);
        const json = await res.json();
        if (!res.ok || !json || (Array.isArray(json) && json.length === 0) || (json.students && json.students.length === 0)) {
          setNoResults(true);
          return;
        }
        setSubs(json);
      } catch (error) {
        console.error(error);
        setNoResults(true);
      }
    }
    if (testId) getSubs();
  }, [testId]);

  if (noResults) {
    return (
      <div className="teacher-results-container">
        <h3>No one attempted the exam. No results available.</h3>
        <button onClick={() => navigate(-1)}><FaBackward /> Back</button>
      </div>
    );
  }

  if (!subs) return <p className="loading">Loading…</p>;

  const students = Array.isArray(subs) ? subs : subs.students;
  const testName = subs.testName || "Test";
  const totalScore = subs.totalScore || students[0]?.totalScore || 0;
  const testDate = subs.date || students[0]?.submittedAt;

  const average = (
    students.reduce((a, s) => a + s.percentage, 0) / students.length
  ).toFixed(2);

  const barData = students.map(s => ({
    name: s.studentName || s.name,
    Score: s.obtainedScore,
  }));

  const pieData = [
    { name: "Above Avg", value: students.filter(s => s.percentage > average).length },
    { name: "Below Avg", value: students.filter(s => s.percentage <= average).length },
  ];

  const scoreRanges = [0, 5, 10, 15, 20].map(min => {
    const max = min + 4;
    return {
      range: `${min}-${max}`,
      count: students.filter(s => s.obtainedScore >= min && s.obtainedScore <= max).length,
    };
  });

  const questionAverage = students[0].evaluatedQuestions.map((_, i) => {
    const avg = (
      students.reduce((sum, s) => sum + s.evaluatedQuestions[i].obtained, 0) / students.length
    ).toFixed(2);
    return { question: `Q${i + 1}`, avgScore: parseFloat(avg) };
  });

  const downloadCSV = () => {
    const rows = [
      ["Name", "Score", "Percentage"],
      ...students.map(s => [s.studentName || s.name, s.obtainedScore, s.percentage]),
    ];
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const link = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: "class_results.csv",
    });
    link.click();
  };

  return (
    <div className="teacher-results-container">
      <header className="results-header">
        <h2><FaChartBar /> Results Overview: {testName}</h2>
        <p><strong>Date:</strong> {new Date(testDate).toLocaleDateString()}</p>
        <p><strong>Average Class Score:</strong> {average}%</p>
        <div className="header-actions">
          <button onClick={downloadCSV}><FaDownload /> CSV</button>
          <button onClick={() => navigate(-1)}><FaBackward /> Back</button>
        </div>
      </header>

      {/* Charts Section */}
      <section className="charts-section">
        {/* Bar Chart */}
        <div className="chart-card">
          <h4>Individual Scores</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Score" fill="#007bff" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="chart-card">
          <h4>Performance Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Score Range */}
        <div className="chart-card">
          <h4>Score Range Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreRanges}>
              <XAxis dataKey="range" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#17a2b8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Question Averages */}
        <div className="chart-card">
          <h4>Question-wise Average</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={questionAverage}>
              <XAxis dataKey="question" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgScore" fill="#ffc107" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Results Table */}
      <section className="results-table-section">
        <h4>Student-wise Results</h4>
        <table className="results-table">
          <thead>
            <tr><th>Name</th><th>Score</th><th>%</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {students.map((s, i) => (
              <tr key={i}>
                <td>
                  {s.studentName || s.name}
                  {cheatMap[s.studentId] && (
                    <FaFlag
                      className="cheat-flag"
                      title={`Cheating detected: ${cheatMap[s.studentId]}`}
                    />
                  )}
                </td>
                <td>{s.obtainedScore}/{totalScore}</td>
                <td>{s.percentage}%</td>
                <td>
                  <button className="view-btn" onClick={() => setSelected(s)}><FaEye /> View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Feedback Section */}
      <section className="comments-section">
        <h4>Test Feedback</h4>
        {comments.length ? (
          <ul className="comments-list">
            {comments.map((c) => (
              <li key={c._id} className="comment-item">
                <strong>{c.userName}:</strong> {c.commentText}
              </li>
            ))}
          </ul>
        ) : (
          <p>No comments yet.</p>
        )}
      </section>

      {/* Modal View */}
      {selected && (
        <div className="student-modal">
          <div className="modal-overlay" onClick={() => setSelected(null)} />
          <div className="modal-content">
            <div className="modal-header">
              <h3>Details for {selected.studentName || selected.name}</h3>
              <button onClick={() => setSelected(null)}><FaTimesCircle /></button>
            </div>
            <div className="modal-body">
              {selected.evaluatedQuestions.map((q, i) => (
                <div key={i} className="question-block">
                  <p><strong>Q{i + 1}:</strong> {q.question}</p>
                  <p><strong>Student Answer:</strong> {q.studentAnswer || "—"}</p>
                  <p className={q.obtained === q.score ? "correct" : "incorrect"}>
                    <strong>Score:</strong> {q.obtained}/{q.score}
                  </p>
                  <p><strong>Teacher Comment:</strong> {q.teacherComment || "—"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
