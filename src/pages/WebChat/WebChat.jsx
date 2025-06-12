import React, { useEffect, useState, useRef } from "react";
import { FaPaperPlane } from "react-icons/fa";
import CloseIcon from "@mui/icons-material/Close";
import { IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import "./WebChat.css";
import { useAlert } from "../../hooks/useAlert";

const API = `${import.meta.env.VITE_API_URL}/chats`;

const WebChat = () => {
  const { show, AlertPortal } = useAlert();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [department, setDept] = useState("");
  const [semester, setSem] = useState("");
  const [search, setSearch] = useState("");
  const [currentUser] = useState(
    JSON.parse(sessionStorage.getItem("currentUser"))
  );
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  /* ─── Fetch msgs every 5s (or on filter change) ─── */
  const fetchMessages = async () => {
    const params = new URLSearchParams();
    if (department) params.append("department", department);
    if (semester) params.append("semester", semester);
    const res = await fetch(`${API}?${params.toString()}`);
    const data = await res.json();
    setMessages(data);
  };

  useEffect(() => {
    fetchMessages();
  }, [department, semester]);
  useEffect(() => {
    let controller = new AbortController();
    let timeout;

    const fetchAndSchedule = async () => {
      try {
        await fetchMessages();
        timeout = setTimeout(fetchAndSchedule, 3000); // 3 seconds
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchAndSchedule();

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [department, semester]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ─── send message ─── */
  const send = async () => {
    if (!message.trim()) return;
    if (!department || !semester) {
      // alert("Select department & semester first.");
      show("Select department and semester first.", "error");
      return;
    }
    const payload = {
      text: message,
      senderId: currentUser._id,
      senderName: currentUser.name,
      role: currentUser.role,
      department,
      semester,
    };
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setMessage("");
      await fetchMessages();
    }
  };

  /* ─── filtering (search) ─── */
  const filtered = messages.filter(
    (m) =>
      m.text.toLowerCase().includes(search.toLowerCase()) ||
      m.senderName.toLowerCase().includes(search.toLowerCase())
  );

  /* ─── group by date ─── */
  const grouped = filtered.reduce((acc, m) => {
    const date = new Date(m.createdAt).toDateString();
    (acc[date] = acc[date] || []).push(m);
    return acc;
  }, {});

  const closeChat = () =>
    navigate(
      currentUser.role === "student" ? "/student-home" : "/teacher-home"
    );

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h3>💬 EMS Integrated Chat</h3>
        <IconButton style={{ width: "unset" }} onClick={closeChat}>
          <CloseIcon sx={{ color: "white" }} />
        </IconButton>{" "}
      </header>

      <div className="chat-controls">
        <select value={department} onChange={(e) => setDept(e.target.value)}>
          <option value="">All Departments</option>
          <option value="CS">CS</option>
          <option value="EC">EC</option>
          <option value="ME">ME</option>
        </select>
        <select value={semester} onChange={(e) => setSem(e.target.value)}>
          <option value="">All Semesters</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
        </select>
        <input
          type="text"
          placeholder="🔍 Search messages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <main className="chat-messages">
        {Object.entries(grouped).map(([date, msgs]) => (
          <div key={date}>
            <div className="date-divider">{date}</div>
            {msgs.map((m) => (
              <div
                key={m._id}
                className={`message-card ${
                  m.role === "teacher" ? "teacher-msg" : "student-msg"
                }`}
              >
                <div className="message-header">
                  <span className="sender">
                    {m.senderName} ({m.role})
                  </span>
                  <span className="timestamp">
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="message-text">{m.text}</p>
              </div>
            ))}
          </div>
        ))}
        <div ref={chatEndRef} />
      </main>

      <footer className="chat-footer">
        <input
          type="text"
          placeholder="✏️ Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button title="Send Message" onClick={send}>
          <FaPaperPlane />
        </button>
      </footer>
      <AlertPortal />
    </div>
  );
};

export default WebChat;
