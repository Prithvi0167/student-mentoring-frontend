import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import ChatBox from "../components/ChatBox";

export default function MentorDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [mentees, setMentees] = useState([]);
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [rescheduleTarget, setRescheduleTarget] = useState(null); // meeting id being rescheduled
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [respondingId, setRespondingId] = useState(null); // meeting id currently being acted on
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [profileRes, menteesRes, meetingsRes] = await Promise.all([
        api.get("/mentor/me"),
        api.get("/mentor/me/mentees"),
        api.get("/meetings"),
      ]);
      setProfile(profileRes.data);
      setMentees(menteesRes.data.mentees);
      setMeetings(meetingsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const openMentee = async (studentId) => {
    setError("");
    try {
      const res = await api.get(`/mentor/me/mentees/${studentId}`);
      setSelectedMentee(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load student details");
    }
  };

  const respondToMeeting = async (meetingId, action, newDatetime) => {
    setError("");
    setRespondingId(meetingId);
    try {
      await api.patch(`/meetings/${meetingId}/respond`, {
        action,
        ...(newDatetime ? { new_datetime: newDatetime } : {}),
      });
      setRescheduleTarget(null);
      setRescheduleDate("");
      loadAll();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${action} meeting`);
    } finally {
      setRespondingId(null);
    }
  };

  const statusClass = (status) => `status-badge status-${status}`;

  if (loading) return <div className="dashboard">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Welcome, {profile?.name}</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Mentor's own summary */}
      <div className="card">
        <h3>My Profile</h3>
        <div className="info-grid">
          <div><span>Mentor Code</span><strong>{profile.mentor_code}</strong></div>
          <div><span>Email</span><strong>{profile.email}</strong></div>
          <div><span>Department</span><strong>{profile.department}</strong></div>
          <div><span>Designation</span><strong>{profile.designation || "-"}</strong></div>
          <div><span>Specialization</span><strong>{profile.specialization || "-"}</strong></div>
          <div><span>Mentees</span><strong>{profile.current_mentee_count} / {profile.max_mentee_capacity}</strong></div>
        </div>
      </div>

      {/* Mentee list */}
      <div className="card">
        <h3>My Mentees ({mentees.length})</h3>
        {mentees.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Code</th>
                <th>Name</th>
                <th>Department</th>
                <th>Batch</th>
                <th>Semester</th>
                <th>CGPA</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {mentees.map((m) => (
                <tr key={m.id}>
                  <td>{m.student_code}</td>
                  <td>{m.name}</td>
                  <td>{m.department}</td>
                  <td>{m.batch}</td>
                  <td>{m.semester}</td>
                  <td>{m.cgpa ?? "N/A"}</td>
                  <td>
                    <button className="link-btn" onClick={() => openMentee(m.id)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No mentees assigned yet.</p>
        )}
      </div>

      {/* Meeting requests */}
      <div className="card">
        <h3>Meeting Requests ({meetings.length})</h3>
        {meetings.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Proposed</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((m) => (
                <tr key={m.id}>
                  <td>{m.student_name}</td>
                  <td>{new Date(m.proposed_datetime).toLocaleString()}</td>
                  <td><span className={statusClass(m.status)}>{m.status}</span></td>
                  <td>{m.notes || "-"}</td>
                  <td>
                    {m.status === "pending" ? (
                      rescheduleTarget === m.id ? (
                        <div className="inline-actions">
                          <input
                            type="datetime-local"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                          />
                          <button
                            className="link-btn"
                            disabled={!rescheduleDate || respondingId === m.id}
                            onClick={() => respondToMeeting(m.id, "reschedule", rescheduleDate)}
                          >
                            Confirm
                          </button>
                          <button className="link-btn" onClick={() => setRescheduleTarget(null)}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="inline-actions">
                          <button
                            className="link-btn"
                            disabled={respondingId === m.id}
                            onClick={() => respondToMeeting(m.id, "accept")}
                          >
                            Accept
                          </button>
                          <button
                            className="link-btn"
                            disabled={respondingId === m.id}
                            onClick={() => respondToMeeting(m.id, "reject")}
                          >
                            Reject
                          </button>
                          <button
                            className="link-btn"
                            disabled={respondingId === m.id}
                            onClick={() => setRescheduleTarget(m.id)}
                          >
                            Reschedule
                          </button>
                        </div>
                      )
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No meeting requests yet.</p>
        )}
      </div>

      {/* Selected mentee detail */}
      {selectedMentee && (
        <div className="card">
          <div className="card-header-row">
            <h3>{selectedMentee.name}'s Details</h3>
            <button className="link-btn" onClick={() => setSelectedMentee(null)}>
              Close
            </button>
          </div>

          <div className="info-grid">
            <div><span>Student Code</span><strong>{selectedMentee.student_code}</strong></div>
            <div><span>Email</span><strong>{selectedMentee.email}</strong></div>
            <div><span>Phone</span><strong>{selectedMentee.phone || "-"}</strong></div>
            <div><span>Department</span><strong>{selectedMentee.department}</strong></div>
            <div><span>Batch</span><strong>{selectedMentee.batch}</strong></div>
            <div><span>Semester</span><strong>{selectedMentee.semester}</strong></div>
            <div><span>Section</span><strong>{selectedMentee.section || "-"}</strong></div>
            <div><span>CGPA</span><strong>{selectedMentee.cgpa ?? "N/A"}</strong></div>
          </div>

          <h4 style={{ marginTop: 20 }}>Academic Records</h4>
          {selectedMentee.academic_records?.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Semester</th>
                  <th>Subject</th>
                  <th>Total</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {selectedMentee.academic_records.map((r, i) => (
                  <tr key={i}>
                    <td>{r.semester}</td>
                    <td>{r.subject}</td>
                    <td>{r.total}</td>
                    <td>{r.grade || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No academic records yet.</p>
          )}
          <h4 style={{ marginTop: 20 }}>Chat</h4>
          <ChatBox studentId={selectedMentee.id} mentorId={profile.id} currentUserRole="mentor" />
        </div>
      )}
    </div>
  );
}
