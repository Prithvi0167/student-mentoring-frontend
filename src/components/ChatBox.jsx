import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import api, { API_BASE_URL } from "../api/client";

/**
 * Chat between one student and one mentor.
 * Props: studentId, mentorId, currentUserRole ("student" | "mentor")
 */
export default function ChatBox({ studentId, mentorId, currentUserRole }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  // Load past messages via REST, then open the live socket connection.
  useEffect(() => {
    let cancelled = false;

    const loadHistoryAndConnect = async () => {
      setLoadingHistory(true);
      try {
        const res = await api.get(`/chat/${studentId}/${mentorId}/history`);
        if (!cancelled) setMessages(res.data);
      } catch (err) {
        // non-fatal — chat can still work live even if history fails to load
        console.error("Failed to load chat history", err);
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    };

    loadHistoryAndConnect();

    const token = localStorage.getItem("access_token");
    const socket = io(API_BASE_URL, { query: { token } });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join", { student_id: studentId, mentor_id: mentorId });
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("new_message", (msg) => {
      // only append if it belongs to this specific student/mentor pair
      if (msg.student_id === studentId && msg.mentor_id === mentorId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on("error", (err) => {
      console.error("Chat socket error:", err.message);
    });

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [studentId, mentorId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || !socketRef.current) return;

    socketRef.current.emit("send_message", {
      student_id: studentId,
      mentor_id: mentorId,
      content,
    });
    setInput("");
  };

  return (
    <div className="chat-box">
      <div className="chat-status">
        {connected ? <span className="dot dot-green" /> : <span className="dot dot-gray" />}
        {connected ? "Connected" : "Connecting..."}
      </div>

      <div className="chat-messages">
        {loadingHistory ? (
          <p className="chat-empty">Loading messages...</p>
        ) : messages.length ? (
          messages.map((m, i) => (
            <div
              key={m.id ?? i}
              className={`chat-bubble ${m.sender_role === currentUserRole ? "chat-bubble-mine" : "chat-bubble-theirs"}`}
            >
              <div>{m.content}</div>
              <div className="chat-timestamp">
                {new Date(m.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ))
        ) : (
          <p className="chat-empty">No messages yet. Say hello!</p>
        )}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-row" onSubmit={handleSend}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={!connected}
        />
        <button type="submit" disabled={!connected || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
