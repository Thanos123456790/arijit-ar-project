import React, { useState, useEffect, useRef } from "react";
import { FaCamera, FaClock, FaFileAlt } from "react-icons/fa";
import "./TakeTest.css";
import { useLocation, useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api/tests";
const CHEATAPI = "http://localhost:5000/api/cheating";

function TakeTest() {
  const { search } = useLocation();
  const testId = new URLSearchParams(search).get("testId");
  const navigate = useNavigate();

  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));

  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timer, setTimer] = useState(1 * 60);
  const [, setWarnings] = useState(0);
  const [cameraReady, setCamReady] = useState(false);

  /* ───────── refs ───────── */
  const answersRef = useRef({});
  const hasSubmittedRef = useRef(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fullWarned = useRef(false);


  /* ───────── fetch test once ───────── */
  useEffect(() => {
    async function fetchTest() {
      const res = await fetch(`${API}/${testId}`);
      const data = await res.json();
      setTest(data);
      setTimer(parseInt(data.duration) * 60); // duration field is minutes
    }
    fetchTest();
  }, [testId]);

  /* ───────── countdown ───────── */
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  /* ───────── start webcam ───────── */
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          streamRef.current = stream;
        })
        .catch(() => {
          alert(
            "Video recording is required for this test. Please enable your camera."
          );
        });
    }

    return () => {
      stopCamera();
    };
  }, []);
  const stopCamera = () => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      streamRef.current = null;
    }
  };

  /* ───── Start webcam + fullscreen ───── */
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCamReady(true);
        // ⬇ request fullscreen
        document.documentElement.requestFullscreen?.().catch(() => { });
        // track camera loss
        stream.getVideoTracks()[0].onended = () => handleViolation("camera-off");
      })
      .catch(() =>
        alert("Camera permission denied. Enable camera to start the exam.")
      );
    // cleanup
    return () => stopCamera();
  }, []);

  /* ───── Count-down ───── */
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  /* ───── Anti-cheat listeners ───── */
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) handleViolation("tab-switch");
    };
    const onFull = () => {
      if (!document.fullscreenElement && fullWarned.current) {
        handleViolation("fullscreen-exit");
      }
      fullWarned.current = true; // ignore first toggle triggered by our own request
    };
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFull);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("fullscreenchange", onFull);
    };
  }, []);

  const handleViolation = async (eventType) => {
    setWarnings((w) => {
      const next = w + 1;
      alert(
        `Warning ${next}/3: ${eventType.replace("-", " ")} detected.\n` +
        (next === 3
          ? "Next violation will terminate the exam."
          : "Stay focused on the exam.")
      );
      
      if (next >= 4) terminateExam(eventType);
      return next;
    });
  };



  const terminateExam = async (eventType) => {
    stopCamera();
    await fetch(CHEATAPI, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: currentUser._id,
        testId,
        event: eventType,
      }),
    });
    alert("Exam terminated due to repeated violations.");
    navigate("/student-home");
  };

  /* ───────── helpers ───────── */
  const handleAnswerChange = (idx, value) => {
    setAnswers((prev) => {
      const upd = { ...prev, [idx]: value };
      answersRef.current = upd;
      return upd;
    });
  };

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(
      2,
      "0"
    )}`;

  /* ───────── cancel ───────── */
  const handleCancel = () => {
    stopCamera();
    navigate("/student-home");
  };

  /* ───────── submit ───────── */
  const handleSubmit = async () => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    stopCamera();

    try {
      const payload = {
        studentId: currentUser._id,
        studentName: currentUser.name,
        answers: answersRef.current,
      };
      const res = await fetch(`${API}/${testId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Test submitted and evaluated!");
        stopCamera();
        navigate("/student-home");
      } else {
        const err = await res.json();
        alert(err.msg || "Submission failed");
      }
    } catch (e) {
      console.error(e);
      alert("Server error during submission");
    }
  };

  /* ───────── auto submit on timer 0 ───────── */
  useEffect(() => {
    if (timer === 0) handleSubmit();
  }, [timer]);

  if (!test) return <p>Loading…</p>;

  const isTimeCritical = timer < 5 * 60;

  return (
    <div className="take-test-page">
      <div className="timer-header">
        <h3 style={{ color: "black" }}>
          <FaFileAlt /> Test: Sample Test
        </h3>
        <div className={`timer ${isTimeCritical ? "critical" : ""}`}>
          <FaClock /> Time Left: {formatTime(timer)}
        </div>
      </div>
      <div className="main-content">
        <div className="video-section">
          <div className="video-box">
            <video ref={videoRef} autoPlay muted className="video-stream" />
            <p className="recording-text">
              <FaCamera /> Camera & Microphone recording in progress...
            </p>
            <br />
            <div>
              <p>
                <strong>Name:</strong> {currentUser.name}
              </p>
              <p>
                <strong>Roll Number:</strong> {currentUser.rollNumber}
              </p>
            </div>
          </div>
        </div>
        {
          cameraReady ? (
            <div className="questions-section">
              {test.questions.map((q, index) => (
                <div className="question-card" key={index}>
                  <div className="question-header">
                    <h4 style={{ color: "black" }}>
                      Question {index + 1}: {q.question}
                    </h4>
                    <span className="question-score">Score: {q.score}</span>
                  </div>
                  {q.type === "Multiple Choice" && (
                    <div className="options">
                      {q.options.map((option, optIndex) => (
                        <label
                          key={optIndex}
                          style={{ display: "flex", flexDirection: "row" }}
                        >
                          <input
                            style={{ marginRight: "10px" }}
                            type="radio"
                            name={`question-${index}`}
                            value={option}
                            checked={answers[index] === option}
                            onChange={(e) =>
                              handleAnswerChange(index, e.target.value)
                            }
                          />
                          <p style={{ color: "black" }}>{option}</p>
                        </label>
                      ))}
                    </div>
                  )}
                  {q.type === "True/False" && (
                    <div className="options">
                      {["True", "False"].map((option, optIndex) => (
                        <label
                          key={optIndex}
                          style={{ display: "flex", flexDirection: "row" }}
                        >
                          <input
                            style={{ marginRight: "10px" }}
                            type="radio"
                            name={`question-${index}`}
                            value={option}
                            checked={answers[index] === option}
                            onChange={(e) =>
                              handleAnswerChange(index, e.target.value)
                            }
                          />
                          <p style={{ color: "black" }}>{option}</p>
                        </label>
                      ))}
                    </div>
                  )}
                  {q.type === "Short Answer" && (
                    <textarea
                      rows="3"
                      value={answers[index] || ""}
                      placeholder="Type your answer here..."
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                    />
                  )}
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  padding: "20px",
                  gap: "10px",
                }}
              >
                <button
                  className="submit-btn"
                  onClick={handleCancel}
                  style={{ width: "150px", background: "red", color: "white" }}
                >
                  Cancel
                </button>
                <button
                  className="submit-btn"
                  onClick={handleSubmit}
                  disabled={timer === 0}
                  style={{ width: "150px" }}
                >
                  Submit Test
                </button>
              </div>
            </div>
          ) :
            (
              <p className="camera-warning">
                Enable camera to begin. Questions will appear once camera is active.
              </p>
            )
        }
      </div>
    </div>
  );
}

export default TakeTest;