import { useState } from "react";
import { registerUser } from "./api/auth";

type Role = "admin" | "campaign_manager" | "comms_team";

function Register({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("comms_team");

  // Admin fields
  const [adminId, setAdminId] = useState("");
  const [department, setDepartment] = useState("");
  const [accessLevel, setAccessLevel] = useState("");

  // Campaign Manager fields
  const [managerId, setManagerId] = useState("");
  const [assignedRegion, setAssignedRegion] = useState("");
  const [shiftTiming, setShiftTiming] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await registerUser({
        name,
        email,
        phone,
        password,
        role,
        ...(role === "admin" && {
          admin_id: adminId,
          department,
          access_level: accessLevel,
        }),
        ...(role === "campaign_manager" && {
          manager_id: managerId,
          assigned_region: assignedRegion,
          shift_timing: shiftTiming,
        }),
      });
      onSuccess();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 20 }}>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label>Name</label><br />
          <input value={name} onChange={(e) => setName(e.target.value)} required style={{ width: "100%" }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Email</label><br />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%" }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Phone</label><br />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ width: "100%" }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Password</label><br />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%" }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Role</label><br />
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} style={{ width: "100%" }}>
            <option value="comms_team">User</option>
            <option value="campaign_manager">Cabin Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {role === "admin" && (
          <div style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
            <strong>Admin Details</strong>
            <div style={{ marginTop: 8 }}>
              <label>Admin ID</label><br />
              <input value={adminId} onChange={(e) => setAdminId(e.target.value)} required style={{ width: "100%" }} />
            </div>
            <div style={{ marginTop: 8 }}>
              <label>Department</label><br />
              <input value={department} onChange={(e) => setDepartment(e.target.value)} required style={{ width: "100%" }} />
            </div>
            <div style={{ marginTop: 8 }}>
              <label>Access Level</label><br />
              <input value={accessLevel} onChange={(e) => setAccessLevel(e.target.value)} required style={{ width: "100%" }} />
            </div>
          </div>
        )}

        {role === "campaign_manager" && (
          <div style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
            <strong>Cabin Manager Details</strong>
            <div style={{ marginTop: 8 }}>
              <label>Manager ID</label><br />
              <input value={managerId} onChange={(e) => setManagerId(e.target.value)} required style={{ width: "100%" }} />
            </div>
            <div style={{ marginTop: 8 }}>
              <label>Assigned Region</label><br />
              <input value={assignedRegion} onChange={(e) => setAssignedRegion(e.target.value)} required style={{ width: "100%" }} />
            </div>
            <div style={{ marginTop: 8 }}>
              <label>Shift Timing</label><br />
              <input value={shiftTiming} onChange={(e) => setShiftTiming(e.target.value)} required style={{ width: "100%" }} />
            </div>
          </div>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" disabled={submitting} style={{ width: "100%", padding: 10 }}>
          {submitting ? "Registering..." : "Create Account"}
        </button>
      </form>
    </div>
  );
}

export default Register;