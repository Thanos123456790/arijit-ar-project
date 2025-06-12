import React, { useState, useEffect } from "react";
import {
  FaDownload, FaChartBar, FaBackward
} from "react-icons/fa";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from "recharts";
import "./TestResults.css";
import { useLocation, useNavigate } from "react-router-dom";

const API = `${import.meta.env.VITE_API_URL}`;

function TestResults() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const testId = new URLSearchParams(search).get("testId");

  const studentInfo = JSON.parse(sessionStorage.getItem("currentUser"));

  const [testResult, setTestResult] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [isResultAvailable, setIsResultAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResult() {
      try {
        const res = await fetch(
          `${API}/submissions/student?testId=${testId}&studentId=${studentInfo._id}`
        );
        const data = await res.json();
        // console.log(data);

        if (!res.ok || !data || data.length === 0 || !data.evaluatedQuestions) {
          setIsResultAvailable(false);
        } else {
          setTestResult(data);
          setIsResultAvailable(true);
        }
      } catch (error) {
        setIsResultAvailable(false);
        console.log(error);
      } finally {
        setLoading(false);
      }
    }

    if (testId && studentInfo) {
      fetchResult();
    } else {
      setLoading(false);
      setIsResultAvailable(false);
    }
  }, [testId, studentInfo]);

  if (loading) return <div className="loading">Loading test results…</div>;

  if (!isResultAvailable) {
    return (
      <div style={{marginLeft:"70px",marginRight:"70px"}}>
        <p style={{ textAlign: "center", color: "red", fontWeight: "bold" }}>
          Please attempt the exam. No results available.
        </p>
        <button onClick={() => navigate("/student-home")}><FaBackward /> Back</button>
      </div>
    );
  }

  const perfData = testResult.evaluatedQuestions.map((q, i) => ({
    name: `Q${i + 1}`,
    Total: q.score,
    Obtained: q.obtained,
  }));

  const pieData = [
    { name: "Correct", value: testResult.obtainedScore },
    { name: "Incorrect", value: testResult.totalScore - testResult.obtainedScore },
  ];
  const COLORS = ["#28a745", "#dc3545"];

  const downloadReport = () => {
    const txt = `
Test Name     : ${testResult.testId}
Student Name  : ${studentInfo.name}
Roll Number   : ${studentInfo.rollNumber || "—"}
Total Score   : ${testResult.totalScore}
Obtained Score: ${testResult.obtainedScore}
Percentage    : ${testResult.percentage}%
`;
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const link = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: "test_result.txt",
    });
    link.click();
  };

  return (
    <div className="test-results-page">
      <header className="results-header1">
        <h3>
          <FaChartBar /> Test Results: {testResult.testName}
        </h3>
      </header>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "20px" }}>
        <button style={{ width: "unset", padding: 8, fontSize: 12 }} onClick={downloadReport}>
          <FaDownload /> Download
        </button>
        <button onClick={() => navigate("/student-home")}><FaBackward /> Back</button>
      </div>

      <div className="student-info">
        <p><strong>Name:</strong> {studentInfo.name}</p>
        <p><strong>Roll Number:</strong> {studentInfo.rollNumber}</p>
        <p><strong>Branch:</strong> {studentInfo.branch}</p>
        <p><strong>Semester:</strong> {studentInfo.semester}</p>
      </div>

      <div className="results-summary">
        <p><strong>Total Score:</strong> {testResult.totalScore}</p>
        <p><strong>Obtained Score:</strong> {testResult.obtainedScore}</p>
        <p><strong>Percentage:</strong> {testResult.percentage}%</p>
        <button className="toggle-answers-btn" onClick={() => setShowAnswers(!showAnswers)}>
          {showAnswers ? "Hide" : "Show"} Student Answers
        </button>
      </div>

      {showAnswers && (
        <div className="answers-section">
          <h3>Student Answers</h3>
          {testResult.evaluatedQuestions.map((q, i) => (
            <div key={i} className="answer-block">
              <p><strong>Q{i + 1}:</strong> {q.question}</p>
              <p><strong>Student Answer:</strong> {q.studentAnswer}</p>
              <p><strong>Correct Answer:</strong> {q.correctAnswer}</p>
              <p><strong>Score:</strong> {q.obtained}/{q.score}</p>
              <p><strong>Teacher Commernt:</strong> {q.teacherComment}</p>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ color: "black" }}>Result Analytics: {testResult.testName}</h3>

      <div className="graphs-section">
        <div className="graph-container">
          <h3>Performance per Question</h3>
          <BarChart width={500} height={300} data={perfData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Total" fill="#8884d8" />
            <Bar dataKey="Obtained" fill="#82ca9d" />
          </BarChart>
        </div>

        <div className="graph-container">
          <h3>Overall Performance</h3>
          <PieChart width={300} height={300}>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>

        <div className="graph-container">
          <h3>Line Chart of Scores</h3>
          <LineChart width={500} height={300} data={perfData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Obtained" stroke="#8884d8" />
            <Line type="monotone" dataKey="Total" stroke="#82ca9d" />
          </LineChart>
        </div>

        <div className="graph-container">
          <h3>Area Chart Insights</h3>
          <AreaChart width={500} height={300} data={perfData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="Obtained" stroke="#82ca9d" fill="#82ca9d" />
          </AreaChart>
        </div>
      </div>
      <br />
      <br />
    </div>
  );
}

export default TestResults;
