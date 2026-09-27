import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";

const initialMentorForm = {
  email: "",
  password: "",
  mentor_code: "",
  name: "",
  department: "",
  phone: "",
  designation: "",
  specialization: "",
  max_mentee_capacity: 20,
};

const initialRecordForm = {
  semester: "",
  subject: "",
  internal_marks: "",
  assignment_marks: "",
  practical_marks: "",
  end_semester_marks: "",
  grade: "",
  grade_point: "",
};

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showMentorForm, setShowMentorForm] = useState(false);
  const [mentorForm, setMentorForm] = useState(initialMentorForm);
  const [creatingMentor, setCreatingMentor] = useState(false);

  const [assignStudentId, setAssignStudentId] = useState("");
  const [assignMentorId, setAssignMentorId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [academicsStudent, setAcademicsStudent] = useState(null); // {id, name, records, cgpa}
  const [recordForm, setRecordForm] = useState(initialRecordForm);
  const [savingRecord, setSavingRecord] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [studentsRes, mentorsRes] = await Promise.all([
        api.get("/admin/students"),
        api.get("/admin/mentors"),
      ]);
      setStudents(studentsRes.data);
      setMentors(mentorsRes.data);
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

  const handleCreateMentor = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setCreatingMentor(true);
    try {
      await api.post("/admin/mentors", {
        ...mentorForm,
        max_mentee_capacity: parseInt(mentorForm.max_mentee_capacity, 10) || 20,
      });
      setMessage("Mentor created successfully");
      setMentorForm(initialMentorForm);
      setShowMentorForm(false);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create mentor");
    } finally {
      setCreatingMentor(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!assignStudentId || !assignMentorId) {
      setError("Select both a student and a mentor");
      return;
    }
    setAssigning(true);
    try {
      const res = await api.post("/admin/assign", {
        student_id: parseInt(assignStudentId, 10),
        mentor_id: parseInt(assignMentorId, 10),
      });
      setMessage(res.data.message);
      setAssignStudentId("");
      setAssignMentorId("");
      loadAll();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to assign mentor");
    } finally {
      setAssigning(false);
    }
  };

  const openAcademics = async (student) => {
    setError("");
    try {
      const res = await api.get(`/admin/students/${student.id}/academics`);
      setAcademicsStudent({ id: student.id, name: student.name, ...res.data });
      setRecordForm(initialRecordForm);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load academic records");
    }
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!recordForm.semester || !recordForm.subject) {
      setError("Semester and subject are required");
      return;
    }
    setSavingRecord(true);
    try {
      await api.post(`/admin/students/${academicsStudent.id}/academics`, {
        ...recordForm,
        semester: parseInt(recordForm.semester, 10),
        internal_marks: parseFloat(recordForm.internal_marks) || 0,
        assignment_marks: parseFloat(recordForm.assignment_marks) || 0,
        practical_marks: parseFloat(recordForm.practical_marks) || 0,
        end_semester_marks: parseFloat(recordForm.end_semester_marks) || 0,
        grade_point: recordForm.grade_point ? parseFloat(recordForm.grade_point) : null,
      });
      setMessage("Academic record saved");
      setRecordForm(initialRecordForm);
      openAcademics({ id: academicsStudent.id, name: academicsStudent.name });
      loadAll(); // refresh CGPA shown in the students table
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save record");
    } finally {
      setSavingRecord(false);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    setError("");
    try {
      await api.delete(`/admin/academics/${recordId}`);
      openAcademics({ id: academicsStudent.id, name: academicsStudent.name });
      loadAll();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete record");
    }
  };

  if (loading) return <div className="dashboard">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Admin Dashboard</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {message && <div className="success-banner">{message}</div>}

      {/* Summary */}
      <div className="card">
        <div className="info-grid">
          <div><span>Total Students</span><strong>{students.length}</strong></div>
          <div><span>Total Mentors</span><strong>{mentors.length}</strong></div>
          <div>
            <span>Unassigned Students</span>
            <strong>{students.filter((s) => !s.mentor_id).length}</strong>
          </div>
        </div>
      </div>

      {/* Assign mentor */}
      <div className="card">
        <h3>Assign Student to Mentor</h3>
        <form onSubmit={handleAssign} className="assign-form">
          <select value={assignStudentId} onChange={(e) => setAssignStudentId(e.target.value)}>
            <option value="">Select student...</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.student_code} - {s.name} {s.mentor_name ? `(current: ${s.mentor_name})` : "(unassigned)"}
              </option>
            ))}
          </select>

          <select value={assignMentorId} onChange={(e) => setAssignMentorId(e.target.value)}>
            <option value="">Select mentor...</option>
            {mentors.map((m) => (
              <option key={m.id} value={m.id} disabled={m.current_mentee_count >= m.max_mentee_capacity}>
                {m.mentor_code} - {m.name} ({m.current_mentee_count}/{m.max_mentee_capacity})
              </option>
            ))}
          </select>

          <button type="submit" disabled={assigning}>
            {assigning ? "Assigning..." : "Assign"}
          </button>
        </form>
      </div>

      {/* Mentors list + create */}
      <div className="card">
        <div className="card-header-row">
          <h3>Mentors ({mentors.length})</h3>
          <button className="link-btn" onClick={() => setShowMentorForm(!showMentorForm)}>
            {showMentorForm ? "Cancel" : "+ Add Mentor"}
          </button>
        </div>

        {showMentorForm && (
          <form onSubmit={handleCreateMentor} className="edit-form">
            <label>Full Name</label>
            <input
              value={mentorForm.name}
              onChange={(e) => setMentorForm({ ...mentorForm, name: e.target.value })}
              required
            />

            <label>Email</label>
            <input
              type="email"
              value={mentorForm.email}
              onChange={(e) => setMentorForm({ ...mentorForm, email: e.target.value })}
              required
            />

            <label>Password</label>
            <input
              type="password"
              value={mentorForm.password}
              onChange={(e) => setMentorForm({ ...mentorForm, password: e.target.value })}
              required
            />

            <label>Mentor Code</label>
            <input
              value={mentorForm.mentor_code}
              onChange={(e) => setMentorForm({ ...mentorForm, mentor_code: e.target.value })}
              required
            />

            <label>Department</label>
            <input
              value={mentorForm.department}
              onChange={(e) => setMentorForm({ ...mentorForm, department: e.target.value })}
              required
            />

            <label>Designation</label>
            <input
              value={mentorForm.designation}
              onChange={(e) => setMentorForm({ ...mentorForm, designation: e.target.value })}
            />

            <label>Specialization</label>
            <input
              value={mentorForm.specialization}
              onChange={(e) => setMentorForm({ ...mentorForm, specialization: e.target.value })}
            />

            <label>Max Mentee Capacity</label>
            <input
              type="number"
              value={mentorForm.max_mentee_capacity}
              onChange={(e) => setMentorForm({ ...mentorForm, max_mentee_capacity: e.target.value })}
            />

            <button type="submit" disabled={creatingMentor}>
              {creatingMentor ? "Creating..." : "Create Mentor"}
            </button>
          </form>
        )}

        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Department</th>
              <th>Status</th>
              <th>Mentees</th>
            </tr>
          </thead>
          <tbody>
            {mentors.map((m) => (
              <tr key={m.id}>
                <td>{m.mentor_code}</td>
                <td>{m.name}</td>
                <td>{m.department}</td>
                <td>{m.status}</td>
                <td>{m.current_mentee_count} / {m.max_mentee_capacity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Students list */}
      <div className="card">
        <h3>Students ({students.length})</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Department</th>
              <th>Batch</th>
              <th>Semester</th>
              <th>Mentor</th>
              <th>CGPA</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td>{s.student_code}</td>
                <td>{s.name}</td>
                <td>{s.department}</td>
                <td>{s.batch}</td>
                <td>{s.semester}</td>
                <td>{s.mentor_name || "Unassigned"}</td>
                <td>{s.cgpa ?? "N/A"}</td>
                <td>
                  <button className="link-btn" onClick={() => openAcademics(s)}>
                    Academics
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Academic records management */}
      {academicsStudent && (
        <div className="card">
          <div className="card-header-row">
            <h3>{academicsStudent.name}'s Academic Records</h3>
            <button className="link-btn" onClick={() => setAcademicsStudent(null)}>
              Close
            </button>
          </div>

          <form onSubmit={handleAddRecord} className="edit-form">
            <label>Semester</label>
            <input
              type="number"
              value={recordForm.semester}
              onChange={(e) => setRecordForm({ ...recordForm, semester: e.target.value })}
              required
            />

            <label>Subject</label>
            <input
              value={recordForm.subject}
              onChange={(e) => setRecordForm({ ...recordForm, subject: e.target.value })}
              required
            />

            <label>Internal Marks</label>
            <input
              type="number"
              value={recordForm.internal_marks}
              onChange={(e) => setRecordForm({ ...recordForm, internal_marks: e.target.value })}
            />

            <label>Assignment Marks</label>
            <input
              type="number"
              value={recordForm.assignment_marks}
              onChange={(e) => setRecordForm({ ...recordForm, assignment_marks: e.target.value })}
            />

            <label>Practical Marks</label>
            <input
              type="number"
              value={recordForm.practical_marks}
              onChange={(e) => setRecordForm({ ...recordForm, practical_marks: e.target.value })}
            />

            <label>End Semester Marks</label>
            <input
              type="number"
              value={recordForm.end_semester_marks}
              onChange={(e) => setRecordForm({ ...recordForm, end_semester_marks: e.target.value })}
            />

            <label>Grade (e.g. A, B+)</label>
            <input
              value={recordForm.grade}
              onChange={(e) => setRecordForm({ ...recordForm, grade: e.target.value })}
            />

            <label>Grade Point (e.g. 9.0)</label>
            <input
              type="number"
              step="0.1"
              value={recordForm.grade_point}
              onChange={(e) => setRecordForm({ ...recordForm, grade_point: e.target.value })}
            />

            <button type="submit" disabled={savingRecord}>
              {savingRecord ? "Saving..." : "Save Record"}
            </button>
            <p style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
              Same semester + subject updates the existing record instead of duplicating it.
            </p>
          </form>

          <h4 style={{ marginTop: 20 }}>
            Existing Records {academicsStudent.cgpa != null && `(CGPA: ${academicsStudent.cgpa})`}
          </h4>
          {academicsStudent.records?.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Semester</th>
                  <th>Subject</th>
                  <th>Total</th>
                  <th>Grade</th>
                  <th>Grade Point</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {academicsStudent.records.map((r) => (
                  <tr key={r.id}>
                    <td>{r.semester}</td>
                    <td>{r.subject}</td>
                    <td>{r.total}</td>
                    <td>{r.grade || "-"}</td>
                    <td>{r.grade_point ?? "-"}</td>
                    <td>
                      <button className="link-btn" onClick={() => handleDeleteRecord(r.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No records yet for this student.</p>
          )}
        </div>
      )}
    </div>
  );
}
