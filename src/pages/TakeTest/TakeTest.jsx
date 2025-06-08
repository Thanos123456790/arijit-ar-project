import React, { useState, useEffect, useRef } from "react";
import { FaCamera, FaClock, FaFileAlt } from "react-icons/fa";
import "./TakeTest.css";
import { useLocation, useNavigate } from "react-router-dom";

function TakeTest() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const testId = queryParams.get("testId");

  const Navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [studentInfo] = useState(
    JSON.parse(sessionStorage.getItem("currentUser"))
  );
  const [answers, setAnswers] = useState({});
  const [timer, setTimer] = useState(30 * 60); // default 30 min

  const answersRef = useRef({});
  const hasSubmittedRef = useRef(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const timerKey = `testTimer_${testId}`;
  const answersKey = `testAnswers_${testId}`;

  useEffect(() => {
    const savedTestdata = JSON.parse(sessionStorage.getItem("testsData"));
    if (savedTestdata) {
      const test = savedTestdata.find((t) => t.id === testId);
      setQuestions(test.questions || []);
    }
  }, [testId]);

  useEffect(() => {
    const savedTimer = sessionStorage.getItem(timerKey);
    if (savedTimer) {
      setTimer(parseInt(savedTimer));
    }
  }, [timerKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        } else {
          const newTime = prev - 1;
          sessionStorage.setItem(timerKey, newTime.toString());
          return newTime;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerKey]);

  useEffect(() => {
    const savedAnswers = sessionStorage.getItem(answersKey);
    if (savedAnswers) {
      const parsed = JSON.parse(savedAnswers);
      setAnswers(parsed);
      answersRef.current = parsed;
    }
  }, [answersKey]);

  useEffect(() => {
    sessionStorage.setItem(answersKey, JSON.stringify(answers));
  }, [answers, answersKey]);

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

  const handleAnswerChange = (qIndex, value) => {
    setAnswers((prev) => {
      const updated = {
        ...prev,
        [qIndex]: value,
      };
      answersRef.current = updated;
      return updated;
    });
  };

  const handleCancel = () => {
    sessionStorage.removeItem(timerKey);
    sessionStorage.removeItem(answersKey);
    stopCamera();
    Navigate("/student-home");
  };

  const handleSubmit = () => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    sessionStorage.removeItem(timerKey);
    sessionStorage.removeItem(answersKey);

    stopCamera();
    const savedTestdata = JSON.parse(sessionStorage.getItem("testsData"));
    const test = savedTestdata?.find((t) => t.id === testId);

    if (!test) {
      alert("Test data not found!");
      return;
    }

    let obtainedScore = 0;

    const evaluatedQuestions = test.questions.map((q, index) => {
      const studentAnswer = answersRef.current[index];
      let scoreEarned = 0;

      if (q.type === "Multiple Choice" || q.type === "True/False") {
        if (studentAnswer === q.correctAnswer) {
          scoreEarned = parseInt(q.score);
        }
      } else if (q.type === "Short Answer") {
        scoreEarned = studentAnswer?.trim()
          ? Math.floor(parseInt(q.score) / 2)
          : 0;
      }

      obtainedScore += scoreEarned;

      return {
        question: q.question,
        correctAnswer: q.correctAnswer,
        studentAnswer: studentAnswer || "",
        score: parseInt(q.score),
        obtained: scoreEarned,
      };
    });

    const percentage =
      test.totalScore > 0
        ? Math.round((obtainedScore / test.totalScore) * 100)
        : 0;

    const testResult = {
      testId: test.id,
      testName: test.name,
      totalScore: parseInt(test.totalScore),
      obtainedScore,
      percentage,
      student: studentInfo,
      timestamp: new Date().toISOString(),
      questions: evaluatedQuestions,
    };

    const previousSubmissions =
      JSON.parse(sessionStorage.getItem("submittedTests")) || [];

    const filteredSubmissions = previousSubmissions.filter(
      (sub) =>
        sub.testId !== test.id || sub.student.userId !== studentInfo.userId
    );

    const updatedSubmissions = [...filteredSubmissions, testResult];
    sessionStorage.setItem(
      "submittedTests",
      JSON.stringify(updatedSubmissions)
    );

    alert("Test submitted and evaluated successfully!");
    Navigate("/student-home");
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

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
                <strong>Name:</strong> {studentInfo.name}
              </p>
              <p>
                <strong>Roll Number:</strong> {studentInfo.rollNumber}
              </p>
            </div>
          </div>
        </div>
        <div className="questions-section">
          {questions.map((q, index) => (
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
      </div>
    </div>
  );
}

export default TakeTest;

// import React, { useState, useEffect, useRef } from "react";
// import { FaCamera, FaClock, FaFileAlt } from "react-icons/fa";
// import "./TakeTest.css";
// import { useLocation, useNavigate } from "react-router-dom";

// function TakeTest() {
//   const location = useLocation();
//   const queryParams = new URLSearchParams(location.search);
//   const testId = queryParams.get("testId");

//   const Navigate = useNavigate();
//   const [questions, setQuestions] = useState([]);
//   const [studentInfo] = useState(
//     JSON.parse(sessionStorage.getItem("currentUser"))
//   );
//   const [answers, setAnswers] = useState({});
//   const [timer, setTimer] = useState(1 * 60); // 30 minutes in seconds

//   const answersRef = useRef({});

//   const hasSubmittedRef = useRef(false); // 🛡️ To prevent double submit

//   const videoRef = useRef(null);
//   const streamRef = useRef(null); // ✅ Store the media stream

//   useEffect(() => {
//     const savedTestdata = JSON.parse(sessionStorage.getItem("testsData"));
//     if (savedTestdata) {
//       const test = savedTestdata.find((t) => t.id === testId);
//       setQuestions(test.questions || []);
//     }
//   }, []);

//   useEffect(() => {
//     const savedTimer = sessionStorage.getItem("testTimer");
//     if (savedTimer) {
//       setTimer(parseInt(savedTimer));
//     }
//   }, []);
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setTimer((prev) => {
//         if (prev <= 1) {
//           clearInterval(interval);
//           handleSubmit();
//           return 0;
//         } else {
//           const newTime = prev - 1;
//           sessionStorage.setItem("testTimer", newTime); // 💾 Save to session
//           return newTime;
//         }
//       });
//     }, 1000);

//     return () => clearInterval(interval);
//   }, []);
//   // useEffect(() => {
//   //   const interval = setInterval(() => {
//   //     setTimer((prev) => {
//   //       if (prev === 1) {
//   //         clearInterval(interval);
//   //         handleSubmit(); // ⏰ Auto-submit when timer hits 0
//   //       }
//   //       return prev > 0 ? prev - 1 : 0;
//   //     });
//   //   }, 1000);

//   //   return () => clearInterval(interval);
//   // }, []);

//   useEffect(() => {
//     if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
//       navigator.mediaDevices
//         .getUserMedia({ video: true })
//         .then((stream) => {
//           if (videoRef.current) {
//             videoRef.current.srcObject = stream;
//           }
//           streamRef.current = stream; // ✅ Save stream
//         })
//         .catch(() => {
//           alert(
//             "Video recording is required for this test. Please enable your camera."
//           );
//         });
//     }

//     return () => {
//       stopCamera(); // Cleanup on unmount
//     };
//   }, []);

//   const stopCamera = () => {
//     console.log("Stopping camera...");
//     const stream = streamRef.current;
//     if (stream) {
//       stream.getTracks().forEach((track) => {
//         console.log(`Stopping track: ${track.kind}`);
//         track.stop();
//       });

//       if (videoRef.current) {
//         videoRef.current.srcObject = null;
//       }

//       streamRef.current = null; // Clear the ref
//     }
//   };

//   // const handleAnswerChange = (qIndex, value) => {
//   //   setAnswers((prev) => ({
//   //     ...prev,
//   //     [qIndex]: value,
//   //   }));
//   // };
//   const handleAnswerChange = (qIndex, value) => {
//     setAnswers((prev) => {
//       const updated = {
//         ...prev,
//         [qIndex]: value,
//       };
//       answersRef.current = updated; // keep ref in sync
//       return updated;
//     });
//   };

//   const handleCancel = () => {
//     stopCamera();
//     Navigate("/student-home");
//   };

//   const handleSubmit = () => {
//     if (hasSubmittedRef.current) return; // ❌ Prevent duplicate submit
//     hasSubmittedRef.current = true;
//     stopCamera();
//     const savedTestdata = JSON.parse(sessionStorage.getItem("testsData"));
//     const test = savedTestdata?.find((t) => t.id === testId);

//     if (!test) {
//       alert("Test data not found!");
//       return;
//     }

//     let obtainedScore = 0;

//     const evaluatedQuestions = test.questions.map((q, index) => {
//       const studentAnswer = answersRef.current[index];
//       // answers[index];
//       let scoreEarned = 0;

//       if (q.type === "Multiple Choice" || q.type === "True/False") {
//         if (studentAnswer === q.correctAnswer) {
//           scoreEarned = parseInt(q.score);
//         }
//       } else if (q.type === "Short Answer") {
//         scoreEarned = studentAnswer?.trim()
//           ? Math.floor(parseInt(q.score) / 2)
//           : 0;
//       }

//       obtainedScore += scoreEarned;

//       return {
//         question: q.question,
//         correctAnswer: q.correctAnswer,
//         studentAnswer: studentAnswer || "",
//         score: parseInt(q.score),
//         obtained: scoreEarned,
//       };
//     });

//     const percentage =
//       test.totalScore > 0
//         ? Math.round((obtainedScore / test.totalScore) * 100)
//         : 0;

//     const testResult = {
//       testId: test.id,
//       testName: test.name,
//       totalScore: parseInt(test.totalScore),
//       obtainedScore,
//       percentage,
//       student: studentInfo,
//       timestamp: new Date().toISOString(),
//       questions: evaluatedQuestions,
//     };

//     const previousSubmissions =
//       JSON.parse(sessionStorage.getItem("submittedTests")) || [];

//     const filteredSubmissions = previousSubmissions.filter(
//       (sub) =>
//         sub.testId !== test.id || sub.student.userId !== studentInfo.userId
//     );

//     const updatedSubmissions = [...filteredSubmissions, testResult];
//     sessionStorage.setItem(
//       "submittedTests",
//       JSON.stringify(updatedSubmissions)
//     );

//     console.log("Evaluated Test Result:", testResult);
//     alert("Test submitted and evaluated successfully!");
//     Navigate("/student-home");
//   };

//   const formatTime = (seconds) => {
//     const minutes = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${minutes.toString().padStart(2, "0")}:${secs
//       .toString()
//       .padStart(2, "0")}`;
//   };

//   const isTimeCritical = timer < 5 * 60; // Less than 5 minutes

//   return (
//     <div className="take-test-page">
//       <div className="timer-header">
//         <h3 style={{ color: "black" }}>
//           <FaFileAlt /> Test: Sample Test
//         </h3>
//         <div className={`timer ${isTimeCritical ? "critical" : ""}`}>
//           <FaClock /> Time Left: {formatTime(timer)}
//         </div>
//       </div>
//       <div className="main-content">
//         <div className="video-section">
//           <div className="video-box">
//             <video ref={videoRef} autoPlay muted className="video-stream" />
//             <p className="recording-text">
//               <FaCamera /> Camera & Microphone recording in progress...
//             </p>
//             <br />
//             <div>
//               <p>
//                 <strong>Name:</strong> {studentInfo.name}
//               </p>
//               <p>
//                 <strong>Roll Number:</strong> {studentInfo.rollNumber}
//               </p>
//             </div>
//           </div>
//         </div>
//         <div className="questions-section">
//           {questions.map((q, index) => (
//             <div className="question-card" key={index}>
//               <div className="question-header">
//                 <h4 style={{ color: "black" }}>
//                   Question {index + 1}: {q.question}
//                 </h4>
//                 <span className="question-score">Score: {q.score}</span>
//               </div>
//               {q.type === "Multiple Choice" && (
//                 <div className="options">
//                   {q.options.map((option, optIndex) => (
//                     <label
//                       key={optIndex}
//                       style={{ display: "flex", flexDirection: "row" }}
//                     >
//                       <input
//                         style={{ marginRight: "10px" }}
//                         type="radio"
//                         name={`question-${index}`}
//                         value={option}
//                         onChange={(e) =>
//                           handleAnswerChange(index, e.target.value)
//                         }
//                       />
//                       <p style={{ color: "black" }}>{option}</p>
//                     </label>
//                   ))}
//                 </div>
//               )}
//               {q.type === "True/False" && (
//                 <div className="options">
//                   {["True", "False"].map((option, optIndex) => (
//                     <label
//                       key={optIndex}
//                       style={{ display: "flex", flexDirection: "row" }}
//                     >
//                       <input
//                         style={{ marginRight: "10px" }}
//                         type="radio"
//                         name={`question-${index}`}
//                         value={option}
//                         onChange={(e) =>
//                           handleAnswerChange(index, e.target.value)
//                         }
//                       />
//                       <p style={{ color: "black" }}>{option}</p>
//                     </label>
//                   ))}
//                 </div>
//               )}
//               {q.type === "Short Answer" && (
//                 <textarea
//                   rows="3"
//                   placeholder="Type your answer here..."
//                   onChange={(e) => handleAnswerChange(index, e.target.value)}
//                 />
//               )}
//             </div>
//           ))}
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "flex-end",
//               padding: "20px",
//               gap: "10px",
//             }}
//           >
//             <button
//               className="submit-btn"
//               onClick={handleCancel}
//               style={{ width: "150px", background: "red", color: "white" }}
//             >
//               Cancel
//             </button>
//             <button
//               className="submit-btn"
//               onClick={handleSubmit}
//               disabled={timer === 0}
//               style={{ width: "150px" }}
//             >
//               Submit Test
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default TakeTest;
