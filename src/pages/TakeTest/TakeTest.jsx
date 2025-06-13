/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from "react";
import { FaCamera, FaClock, FaFileAlt } from "react-icons/fa";
import "./TakeTest.css";
import { useLocation } from "react-router-dom";
import { useAlert } from "../../hooks/useAlert";

const API = `${import.meta.env.VITE_API_URL}/tests`;
const CHEATAPI = `${import.meta.env.VITE_API_URL}/cheating`;

export default function TakeTest() {
  const { show, AlertPortal } = useAlert();
  const { search } = useLocation();
  const testId = new URLSearchParams(search).get("testId");

  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState(() => getPersisted().answers || {});
  const [timer, setTimer] = useState(null); // set to null initially
  const [warnings, setWarnings] = useState(() => getPersisted().warnings || 0);
  const [cameraReady, setCamReady] = useState(false);

  const answersRef = useRef(answers);
  const hasSubmittedRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fullWarned = useRef(false);

  function storageKey() {
    return `exam-${currentUser._id}-${testId}`;
  }

  function getPersisted() {
    try {
      const raw = sessionStorage.getItem(storageKey());
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function persist() {
    // debounced write to avoid flooding storage on every keystroke
    if (pendingSaveRef.current) return;
    pendingSaveRef.current = true;
    requestAnimationFrame(() => {
      sessionStorage.setItem(
        storageKey(),
        JSON.stringify({
          answers: answersRef.current,
          timer,
          warnings,
        })
      );
      pendingSaveRef.current = false;
    });
  }


  useEffect(() => {
    persist();
  }, [answers, timer, warnings]);


  useEffect(() => {
  (async function fetchTest() {
    const res = await fetch(`${API}/${testId}`);
    const data = await res.json();
    setTest(data);

    const persisted = getPersisted();
    const durationSeconds = parseInt(data.duration) * 60;

    // Only initialize timer from persisted or backend duration
    setTimer(persisted.timer ?? durationSeconds);
  })();
}, [testId]);

  useEffect(() => {
    if (timer === null || timer <= 0) return;
    const id = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [timer]);

  useEffect(() => {
    if (timer === 0) {
      handleSubmit();
    }
  }, [timer]);


  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCamReady(true);
        // Enter fullscreen (some browsers may reject silently)
        document.documentElement.requestFullscreen?.().catch(() => {});
        // Detect camera loss
        stream.getVideoTracks()[0].onended = () =>
          handleViolation("camera-off");
      })
      .catch(() => {
        show({
          message: "Camera permission denied. Enable camera to start the exam.",
          type: "error",
        });
      });

    return stopCamera;
  }, []);

  const stopCamera = () => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      streamRef.current = null;
    }
  };

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && !hasSubmittedRef.current) {
        handleViolation("tab-switch");
      }
    };

    const onFull = () => {
      if (
        !document.fullscreenElement &&
        fullWarned.current &&
        !hasSubmittedRef.current
      ) {
        handleViolation("fullscreen-exit");
      }
      fullWarned.current = true;
    };

    const onBeforeUnload = (e) => {
      if (!hasSubmittedRef.current) {
        e.preventDefault();
        e.returnValue = "Your exam is still in progress.";
      }
    };

    const cheatKeys = (e) => {
      const combo =
        (e.ctrlKey && ["c", "x", "v", "C", "X", "V"].includes(e.key)) ||
        e.key === "F12" ||
        (e.ctrlKey &&
          e.shiftKey &&
          ["I", "i", "C", "c", "J", "j"].includes(e.key)) ||
        e.key === "Escape";
      if (combo && !hasSubmittedRef.current) {
        e.preventDefault();
        handleViolation("cheat-key");
      }
    };

    const blockClipboard = (e) => {
      e.preventDefault();
      if (!hasSubmittedRef.current) handleViolation("cheat-key");
    };

    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFull);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("keydown", cheatKeys, { capture: true });
    document.addEventListener("copy", blockClipboard);
    document.addEventListener("cut", blockClipboard);
    document.addEventListener("paste", blockClipboard);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("fullscreenchange", onFull);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("keydown", cheatKeys, { capture: true });
      document.removeEventListener("copy", blockClipboard);
      document.removeEventListener("cut", blockClipboard);
      document.removeEventListener("paste", blockClipboard);
    };
  }, []);

  const handleViolation = (eventType) => {
    setWarnings((w) => {
      const next = w + 1;
      show({
        message:
          `Warning ${next}/3: ${eventType.replace(/-/g, " ")} detected.\n` +
          (next === 3
            ? "Next violation will terminate the exam."
            : "Stay focused on the exam."),
        type: "warning",
      });

      if (next >= 4) terminateExam(eventType);
      return next;
    });
  };

  const terminateExam = async (eventType) => {
    handleSubmit();
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
    show({
      message: "Exam terminated due to repeated violations",
      type: "error",
    });
    window.location.href = "/student-home";
    sessionStorage.removeItem(storageKey());
  };

  const handleAnswerChange = (idx, value) => {
    setAnswers((prev) => {
      const upd = { ...prev, [idx]: value };
      answersRef.current = upd;
      return upd;
    });
  };

  const formatTime = (s) => {
  if (s === null) return "--:--";
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };


  const handleCancel = () => {
    window.location.href = "/student-home";
    stopCamera();
    sessionStorage.removeItem(storageKey());
  };

  const handleSubmit = async () => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    stopCamera();

    
    try {
      const payload = {
        studentId: currentUser._id,
        studentRoll: currentUser.rollNumber,
        studentEmail:currentUser.email,
        studentName: currentUser.name,
        answers: answersRef.current,
        timeLeft:timer,
      };

      // console.log("data" + JSON.stringify(payload));

      const res = await fetch(`${API}/${testId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        show({ message: "Test submitted and evaluated!", type: "success" });
      } else {
        const err = await res.json();
        show({ message: err.msg || "Submission failed", type: "error" });
      }
    } catch (e) {
      console.error(e);
      show({ message: "Server error during submission", type: "error" });
    } finally {
      stopCamera();
      window.location.href = "/student-home";
      sessionStorage.removeItem(storageKey());
    }
  };

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

        {cameraReady ? (
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
        ) : (
          <p className="camera-warning">
            Enable camera to begin. Questions will appear once camera is active.
          </p>
        )}
      </div>
      <AlertPortal />
    </div>
  );
}
