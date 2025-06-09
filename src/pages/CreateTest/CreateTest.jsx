import React, { useEffect, useState } from "react";
import {
  FaTrashAlt,
  FaPlusCircle,
  FaCheck,
  FaClock,
  FaFileAlt,
  FaClipboardList,
  FaDownload,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import "./CreateTest.css";
import { useNavigate } from "react-router-dom";

const API = `${import.meta.env.VITE_API_URL}`;


function CreateTest() {
  const [data, setData] = useState({});
  useEffect(() => {
    const user = sessionStorage.getItem("currentUser");
    setData(user ? JSON.parse(user) : {});
  }, []);
  const TEACHER_ID = data._id;
  console.log(TEACHER_ID);

  const [testName, setTestName] = useState("");
  const [evaluationType, setEvaluationType] = useState("Automated");
  const [testDuration, setTestDuration] = useState("");
  const [totalScore, setTotalScore] = useState("");
  const [questions, setQuestions] = useState([]);
  const [useExcelUpload, setUseExcelUpload] = useState(false);
  const navigate = useNavigate();

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question: "",
        type: "Multiple Choice",
        options: ["", "", "", ""],
        correctAnswer: "",
        score: 0,
      },
    ]);
  };

  const deleteQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      const parsedQuestions = json.map((q) => ({
        question: q.Question || "",
        type: q.Type || "Multiple Choice",
        options: [
          q.Option1 || "",
          q.Option2 || "",
          q.Option3 || "",
          q.Option4 || "",
        ],
        correctAnswer: q.CorrectAnswer || "",
        score: parseInt(q.Score || 0),
      }));

      setQuestions(parsedQuestions);
    };
    reader.readAsBinaryString(file);
  };

  const downloadSampleExcel = () => {
    const sample = [
      {
        Question: "What is 2 + 2?",
        Type: "Multiple Choice",
        Option1: "3",
        Option2: "4",
        Option3: "5",
        Option4: "6",
        CorrectAnswer: "4",
        Score: 5,
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sample");
    XLSX.writeFile(wb, "SampleTestFormat.xlsx");
  };

  const handleSubmit = async () => {
    if (!testName || !testDuration || !totalScore || questions.length === 0) {
      alert("Please complete all fields and add at least one question.");
      return;
    }

    const payload = {
      teacherId: TEACHER_ID,
      name: testName,
      duration: testDuration,
      totalScore: parseInt(totalScore),
      evaluationType,
      questions,
    };

    try {
      const res = await fetch(`${API}/tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Test submitted successfully!");
        navigate("/teacher-home");
      } else {
        const err = await res.json();
        alert(`Failed to submit test: ${err.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error submitting test:", error);
      alert("Server error while submitting test.");
    }
  };

  const handleCancel = () => navigate("/teacher-home");


  return (
    <div className="create-test-page">
      <div className="create-test-container">
        <h3 className="page-title">
          <FaClipboardList /> Create New Test
        </h3>

        <div className="test-details">
          <div className="input-row">
            <div className="input-group half-width">
              <label style={{ marginBottom: 0 }} htmlFor="testName">
                <FaFileAlt /> Test Name
              </label>
              <input
                id="testName"
                type="text"
                placeholder="Enter the test title"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
              />
            </div>

            <div className="input-group half-width">
              <label htmlFor="evaluationType">
                <FaClipboardList /> Evaluation Type
              </label>
              <select
                id="evaluationType"
                value={evaluationType}
                onChange={(e) => setEvaluationType(e.target.value)}
              >
                <option value="Manual">Manual</option>
                <option value="Automated">Automated</option>
                <option value="AI">AI</option>
              </select>
            </div>
          </div>

          <div className="input-row">
            <div className="input-group half-width">
              <label style={{ marginBottom: 0 }} htmlFor="testDuration">
                <FaClock /> Duration
              </label>
              <input
                id="testDuration"
                type="text"
                placeholder="e.g., 45 minutes"
                value={testDuration}
                onChange={(e) => setTestDuration(e.target.value)}
              />
            </div>
            <div className="input-group half-width">
              <label htmlFor="totalScore">
                <FaCheck /> Total Score
              </label>
              <input
                id="totalScore"
                type="number"
                min="0"
                placeholder="e.g., 100"
                value={totalScore}
                onChange={(e) => setTotalScore(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="workflow-toggle" style={{ color: "black" }}>
          <label className="toggle-label">Choose how to add questions:</label>
          <div className="checkbox-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={useExcelUpload}
                onChange={() => setUseExcelUpload(!useExcelUpload)}
              />
              Upload questions via Excel
            </label>
          </div>
        </div>

        {useExcelUpload && (
          <div className="upload-section" style={{ color: "black" }}>
            <input
              id="excelUpload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
            />
            <button
              style={{ width: "unset", padding: 10, margin: 0 }}
              className="secondary-btn"
              onClick={downloadSampleExcel}
            >
              <FaDownload /> Download Sample File
            </button>
          </div>
        )}

        {!useExcelUpload && (
          <div className="manual-section">
            <button className="primary-btn" onClick={addQuestion}>
              <FaPlusCircle /> Add Question
            </button>
          </div>
        )}

        {questions.map((q, index) => (
          <div className="question-card" key={index}>
            <div className="question-header">
              <h4 style={{ color: "black" }}>Question {index + 1}</h4>
              <button
                className="icon-btn danger"
                title="Delete Question"
                onClick={() => deleteQuestion(index)}
              >
                <FaTrashAlt />
              </button>
            </div>

            <input
              type="text"
              placeholder="Enter your question here"
              value={q.question}
              onChange={(e) =>
                handleQuestionChange(index, "question", e.target.value)
              }
            />

            <div className="input-group">
              <label>Question Type</label>
              <select
                value={q.type}
                onChange={(e) =>
                  handleQuestionChange(index, "type", e.target.value)
                }
              >
                <option>Multiple Choice</option>
                <option>True/False</option>
                <option>Short Answer</option>
              </select>
            </div>

            {q.type === "Multiple Choice" && (
              <div className="options-group">
                {q.options.map((opt, i) => (
                  <input
                    key={i}
                    type="text"
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) =>
                      handleOptionChange(index, i, e.target.value)
                    }
                  />
                ))}
                <input
                  type="text"
                  placeholder="Correct Answer"
                  value={q.correctAnswer}
                  onChange={(e) =>
                    handleQuestionChange(index, "correctAnswer", e.target.value)
                  }
                />
              </div>
            )}

            {q.type === "True/False" && (
              <div className="input-group">
                <label>Correct Answer</label>
                <select
                  value={q.correctAnswer}
                  onChange={(e) =>
                    handleQuestionChange(index, "correctAnswer", e.target.value)
                  }
                >
                  <option value="">Select</option>
                  <option value="True">True</option>
                  <option value="False">False</option>
                </select>
              </div>
            )}

            {q.type === "Short Answer" && (
              <input
                type="text"
                placeholder="Expected Answer"
                value={q.correctAnswer}
                onChange={(e) =>
                  handleQuestionChange(index, "correctAnswer", e.target.value)
                }
              />
            )}

            <div className="input-group">
              <label>Score</label>
              <input
                type="number"
                min="0"
                placeholder="Score for this question"
                value={q.score}
                onChange={(e) =>
                  handleQuestionChange(index, "score", e.target.value)
                }
              />
            </div>
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
          <button
            style={{ backgroundColor: "red", width: "50%" }}
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            style={{ backgroundColor: "green", width: "50%" }}
            onClick={handleSubmit}
          >
            Submit Test
          </button>
        </div>
      </div>
      <br />
    </div>
  );
}
export default CreateTest;