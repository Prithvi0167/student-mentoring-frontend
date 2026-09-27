import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import ChatBox from "../components/ChatBox";

export default function StudentDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [mentor, setMentor] = useState(null);
  const [academics, setAcademics] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const [meetingDate, setMeetingDate] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [requesting, setRequesting] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [profileRes, mentorRes, academicsRes, meetingsRes] = await Promise.all([
        api.get("/student/me"),
        api.get("/student/me/mentor"),
        api.get("/student/me/academics"),
        api.get("/meetings"),
      ]);
      setProfile(profileRes.data);
      setMentor(mentorRes.data.id ? mentorRes.data : null);
      setAcademics(academicsRes.data);
      setMeetings(meetingsRes.data);
      setEditForm({
        phone: profileRes.data.phone || "",
        address: profileRes.data.address || "",
        parent_guardian_name: profileRes.data.parent_guardian_name || "",
        parent_guardian_phone: profileRes.data.parent_guardian_phone || "",
        emergency_contact: profileRes.data.emergency_contact || "",
      });
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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/student/me", editForm);
      setEditing(false);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestMeeting = async (e) => {
    e.preventDefault();
    setError("");
    if (!meetingDate) {
      setError("Pick a date and time first");
      return;
    }
    setRequesting(true);
    try {
      await api.post("/meetings", {
        proposed_datetime: meetingDate,
        notes: meetingNotes,
      });
      setMeetingDate("");
      setMeetingNotes("");
      loadAll();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to request meeting");
    } finally {
      setRequesting(false);
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

      {/* Profile card */}
      <div className="card">
        <div className="card-header-row">
          <h3>My Profile</h3>
          <button className="link-btn" onClick={() => setEditing(!editing)}>
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>

        {!editing ? (
          <div className="info-grid">
            <div><span>Student Code</span><strong>{profile.student_code}</strong></div>
            <div><span>Email</span><strong>{profile.email}</strong></div>
            <div><span>Department</span><strong>{profile.department}</strong></div>
            <div><span>Batch</span><strong>{profile.batch}</strong></div>
            <div><span>Semester</span><strong>{profile.semester}</strong></div>
            <div><span>Section</span><strong>{profile.section || "-"}</strong></div>
            <div><span>Phone</span><strong>{profile.phone || "-"}</strong></div>
            <div><span>Address</span><strong>{profile.address || "-"}</strong></div>
            <div><span>Guardian</span><strong>{profile.parent_guardian_name || "-"}</strong></div>
            <div><span>Guardian Phone</span><strong>{profile.parent_guardian_phone || "-"}</strong></div>
            <div><span>Emergency Contact</span><strong>{profile.emergency_contact || "-"}</strong></div>
            <div><span>CGPA</span><strong>{profile.cgpa ?? "N/A"}</strong></div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="edit-form">
            <label>Phone</label>
            <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />

            <label>Address</label>
            <input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />

            <label>Guardian Name</label>
            <input
              value={editForm.parent_guardian_name}
              onChange={(e) => setEditForm({ ...editForm, parent_guardian_name: e.target.value })}
            />

            <label>Guardian Phone</label>
            <input
              value={editForm.parent_guardian_phone}
              onChange={(e) => setEditForm({ ...editForm, parent_guardian_phone: e.target.value })}
            />

            <label>Emergency Contact</label>
            <input
              value={editForm.emergency_contact}
              onChange={(e) => setEditForm({ ...editForm, emergency_contact: e.target.value })}
            />

            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </div>

      {/* Mentor card */}
      <div className="card">
        <h3>My Mentor</h3>
        {mentor ? (
          <div className="info-grid">
            <div><span>Name</span><strong>{mentor.name}</strong></div>
            <div><span>Email</span><strong>{mentor.email}</strong></div>
            <div><span>Phone</span><strong>{mentor.phone || "-"}</strong></div>
            <div><span>Department</span><strong>{mentor.department}</strong></div>
            <div><span>Designation</span><strong>{mentor.designation || "-"}</strong></div>
            <div><span>Specialization</span><strong>{mentor.specialization || "-"}</strong></div>
          </div>
        ) : (
          <p>No mentor assigned yet. Check back once admin allocates one.</p>
        )}
      </div>

      {/* Academics card */}
      <div className="card">
        <h3>Academic Performance {academics?.cgpa != null && `(CGPA: ${academics.cgpa})`}</h3>
        {academics?.records?.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Semester</th>
                <th>Subject</th>
                <th>Internal</th>
                <th>Assignment</th>
                <th>Practical</th>
                <th>End Sem</th>
                <th>Total</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {academics.records.map((r, i) => (
                <tr key={i}>
                  <td>{r.semester}</td>
                  <td>{r.subject}</td>
                  <td>{r.internal_marks}</td>
                  <td>{r.assignment_marks}</td>
                  <td>{r.practical_marks}</td>
                  <td>{r.end_semester_marks}</td>
                  <td>{r.total}</td>
                  <td>{r.grade || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No academic records yet.</p>
        )}
      </div>
      {/* Chat with mentor */}
      {mentor && (
        <div className="card">
          <h3>Chat with {mentor.name}</h3>
          <ChatBox studentId={profile.id} mentorId={mentor.id} currentUserRole="student" />
        </div>
      )}

      {/* Meetings card */}
      <div className="card">
        <h3>Meetings</h3>

        {mentor ? (
          <form onSubmit={handleRequestMeeting} className="edit-form">
            <label>Proposed Date & Time</label>
            <input
              type="datetime-local"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              required
            />

            <label>Notes (optional)</label>
            <input
              value={meetingNotes}
              onChange={(e) => setMeetingNotes(e.target.value)}
              placeholder="What do you want to discuss?"
            />

            <button type="submit" disabled={requesting}>
              {requesting ? "Requesting..." : "Request Meeting"}
            </button>
          </form>
        ) : (
          <p>Assign a mentor first before requesting a meeting.</p>
        )}

        <h4 style={{ marginTop: 20 }}>My Requests</h4>
        {meetings.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Proposed</th>
                <th>Confirmed</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((m) => (
                <tr key={m.id}>
                  <td>{new Date(m.proposed_datetime).toLocaleString()}</td>
                  <td>{m.confirmed_datetime ? new Date(m.confirmed_datetime).toLocaleString() : "-"}</td>
                  <td><span className={statusClass(m.status)}>{m.status}</span></td>
                  <td>{m.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No meeting requests yet.</p>
        )}
      </div>
    </div>
  );
}
