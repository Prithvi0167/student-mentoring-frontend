import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";

const initialForm = {
  email: "",
  password: "",
  student_code: "",
  name: "",
  department: "",
  batch: "",
  semester: "",
  phone: "",
  section: "",
};

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", {
        ...form,
        semester: parseInt(form.semester, 10),
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-form">
          <h2>Registered!</h2>
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Student Registration</h2>
        {error && <div className="error-banner">{error}</div>}

        <label>Full Name</label>
        <input name="name" value={form.name} onChange={handleChange} required />

        <label>Email</label>
        <input type="email" name="email" value={form.email} onChange={handleChange} required />

        <label>Password</label>
        <input type="password" name="password" value={form.password} onChange={handleChange} required />

        <label>Student Code (Roll Number)</label>
        <input name="student_code" value={form.student_code} onChange={handleChange} required />

        <label>Department</label>
        <input name="department" value={form.department} onChange={handleChange} required />

        <label>Batch</label>
        <input name="batch" value={form.batch} onChange={handleChange} placeholder="e.g. 2024" required />

        <label>Semester</label>
        <input type="number" name="semester" value={form.semester} onChange={handleChange} min="1" max="12" required />

        <label>Section (optional)</label>
        <input name="section" value={form.section} onChange={handleChange} />

        <label>Phone (optional)</label>
        <input name="phone" value={form.phone} onChange={handleChange} />

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
