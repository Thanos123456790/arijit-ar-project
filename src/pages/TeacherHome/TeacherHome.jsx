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
import * as XLSX from "xlsx";          // ← NEW
import { FaDownload } from "react-icons/fa";

const API = `${import.meta.env.VITE_API_URL}/tests`;

const TeacherHomePage = () => {
  const [tests, setTests] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [editingTest, setEditingTest] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [testToDelete, setTestToDelete] = useState(null);

  const navigate = useNavigate();
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));

  const [emails, setEmails] = useState([""]);
  const [excelEmails, setExcel] = useState([]);
  const [useExcel, setUseExcel] = useState(false);

  const resetAssignPopup = () => {
    setShowPopup(false);
    setSelectedTestId(null);
    setEmails([""]);
    setExcel([]);
    setUseExcel(false);
  };

  /* ----- add / change manual email fields -------------------- */
  const addEmailField = () => setEmails(prev => [...prev, ""]);
  const changeEmail = (idx, val) =>
    setEmails(prev => prev.map((e, i) => i === idx ? val : e));

  /* ----- Excel helpers -------------------------------------- */
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const arr = XLSX.utils.sheet_to_json(ws);
      const list = arr.map(r => (r.Email || r.email || "").trim()).filter(Boolean);
      setExcel(list);
    };
    reader.readAsBinaryString(file);
  };

  const downloadSampleExcel = () => {
    const ws = XLSX.utils.json_to_sheet([{ Email: "example@abc.com" }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Emails");
    XLSX.writeFile(wb, "SampleEmails.xlsx");
  };

  /* ----- submit assignment ---------------------------------- */
  const handlePopupSubmit = async () => {
    const list = useExcel ? excelEmails : emails.map(e => e.trim()).filter(Boolean);

    if (!list.length) return alert("No e-mails provided.");

    const payload = { emails: list };
    // console.log("all emails" + JSON.stringify(payload));
    const res = await fetch(`${API}/${selectedTestId}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert("Assigned!");
      resetAssignPopup();
    }
  };
  // console.log(currentUser._id);

  useEffect(() => {
    const fetchTests = async () => {
      const res = await fetch(`${API}/teacher-tests?teacherId=${currentUser._id}`);
      const data = await res.json();
      setTests(data);
    };
    fetchTests();
  }, [currentUser]);

  const handleAssignTest = (testId) => {
    setSelectedTestId(testId);
    setShowPopup(true);
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

  const handleViewResults = (id) => navigate(`/test-results-teacher?testId=${id}`);
  const handleMannualEvaluation = (id) => navigate(`/manual-evaluation?testId=${id}`);
  const handleAIEvaluation = (id) => navigate(`/ai-evaluation?testId=${id}`);
  const navigateToCreateTest = () => navigate("/create-test");

  const totalAssignedClasses = tests.reduce(
    (sum, t) => sum + t.assignedTo?.length, 0
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
          <p>{tests?.length || 0}</p>
        </div>
        <div className="card stat-card">
          <h3>Classes Assigned</h3>
          <p>{totalAssignedClasses || 0}</p>
        </div>
        <div className="card stat-card">
          <h3>Manual Evaluations</h3>
          <p>{totalStudents || 0}</p>
        </div>

        <div className="card stat-card">
          <h3>Auto Evaluation</h3>
          <p>{totalStudents || 0}</p>
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
          {tests.map((test, index) => (
            <div key={index} className="test-card">
              <h3>
                <FaBook className="icon green" /> {test.name}
              </h3>

              <p style={{ color: "black" }}>
                <FaClock className="icon yellow" /> Duration: {test.duration}
              </p>
              <p style={{ color: "black" }}>Total Score: {test.totalScore}</p>
              <p style={{ color: "black" }}>
                Assigned To:&nbsp;
                {test.assignedTo?.length ? `${test.assignedTo?.length} Candidates` : "None"}
              </p>
              <div className="card-actions">
                <button
                  style={{ background: "#28a745" }}
                  className="btn-success"
                  title="Assign"
                  onClick={() => handleAssignTest(test._id)}
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
                  onClick={() => handleViewResults(test._id)}
                >
                  <FaChartLine />
                </button>

                {test.evaluationType === "Manual" && (
                  <button
                    title="Evaluate"
                    className="btn-secondary"
                    onClick={() => handleMannualEvaluation(test._id)}
                  >
                    <FaClipboardCheck />
                  </button>
                )}
                {test.evaluationType === "AI" && (
                  <button
                    title="Evaluate"
                    className="btn-secondary"
                    onClick={() => handleAIEvaluation(test._id)}
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
            <h3 style={{ color: "black" }}>Assign Test – E-mail list</h3>
            <div className="upload-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={useExcel}
                  onChange={() => { setUseExcel(!useExcel); setExcel([]); }}
                /> Upload via Excel
              </label>
            </div>

            {useExcel ? (
              /* -- Excel section ---------------------------------- */
              <>
                <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} />
                <button className="secondary-btn" style={{ marginTop: 6 }}
                  onClick={downloadSampleExcel}>
                  <FaDownload /> Sample
                </button>
                <p style={{ fontSize: 12, marginTop: 6 }}>
                  {excelEmails.length ? `Loaded ${excelEmails.length} emails.` : "Expecting column 'Email'"}
                </p>
              </>
            ) : (
              /* -- Manual email inputs ----------------------------- */
              <>
                {emails.map((val, idx) => (
                  <input key={idx}
                    type="email" placeholder="user@example.com"
                    value={val}
                    onChange={e => changeEmail(idx, e.target.value)}
                    style={{ marginBottom: 6 }} />
                ))}
                <button className="primary-btn" onClick={addEmailField}>
                  + Add another
                </button>
              </>
            )}

            <div className="popup-actions" style={{ marginTop: 12 }}>
              <button className="btn-secondary" onClick={resetAssignPopup}>Cancel</button>
              <button className="btn-success" onClick={handlePopupSubmit}>Submit</button>
            </div>
          </div>
        </div>)}

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
              <button className="btn-secondary" onClick={() => setShowDeletePopup(false)}>
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
            onCancel={() => setEditingTest(null)}
          />
        </div>
      )}

      <Chatbot />
    </div>
  );
};

export default TeacherHomePage;
