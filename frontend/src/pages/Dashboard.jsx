// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState, useContext } from "react";
import api from "../api";
import { AuthContext } from "../contexts/AuthContext";
import { Chart as ChartJS, ArcElement, LineElement, BarElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from "chart.js";
import { Pie, Line } from "react-chartjs-2";

ChartJS.register(ArcElement, LineElement, BarElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [raw, setRaw] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get("/analytics")
      .then(res => {
        if (!mounted) return;
        setRaw(res.data);      // keep raw response visible
        setData(res.data || {});
        setError(null);
      })
      .catch(e => {
        console.error("analytics fetch err:", e && (e.response?.data || e.message));
        if (!mounted) return;
        setError("Failed to load analytics (check console)");
        setData({});
        setRaw(e && e.response && e.response.data ? e.response.data : null);
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  // Defensive normalization: support several shapes
  const analytics = data && (data.analytics || data) || {};
  const monthly = Array.isArray(analytics.monthly) ? analytics.monthly
    : Array.isArray(analytics.months) ? analytics.months
    : Array.isArray(analytics.monthlyData) ? analytics.monthlyData
    : [];

  const categories = Array.isArray(analytics.categories) ? analytics.categories
    : Array.isArray(analytics.categoryTotals) ? analytics.categoryTotals
    : Array.isArray(analytics.categoriesData) ? analytics.categoriesData
    : [];

  // Derived safe arrays
  const labels = monthly.map(m => {
    try { return new Date(m.month).toLocaleDateString("en-US", { month: "short", year: "numeric" }); }
    catch { return String(m.month || ""); }
  });
  const incomeData = monthly.map(m => parseFloat(m.income || m.in || 0));
  const expenseData = monthly.map(m => parseFloat(m.expense || m.exp || 0));

  const pieLabels = categories.map(c => c.category || c.name || "Unknown");
  const pieValues = categories.map(c => parseFloat(c.total || c.amount || c.value || 0));

  // Render
  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 12 }}>
        <h2>Dashboard</h2>
        <div style={{ color: "#666" }}>
          Signed in as: <strong>{user?.name ?? user?.email ?? "Unknown"}</strong> (id: {user?.id ?? "?"})
        </div>
      </div>

      {loading && <div className="card">Loading analytics...</div>}
      {error && <div className="card" style={{ color: "darkred" }}>{error}</div>}

      {/* Diagnostics & raw JSON */}
      <div className="card" style={{ marginTop: 12 }}>
        <h3>Diagnostics</h3>
        <div><strong>Raw analytics object keys:</strong> {raw ? Object.keys(raw).join(", ") : "(no raw response)"}</div>
        <div><strong>monthly array length:</strong> {monthly.length}</div>
        <div><strong>categories array length:</strong> {categories.length}</div>
      </div>

      {/* Show charts or "no data" messages */}
      <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        <div className="card" style={{ flex: 1, minWidth: 300 }}>
          <h3>Monthly Income / Expense</h3>
          {monthly.length ? (
            <Line data={{
              labels,
              datasets: [
                { label: "Income", data: incomeData, fill: false, tension: 0.2 },
                { label: "Expense", data: expenseData, fill: false, tension: 0.2 }
              ]
            }} />
          ) : (
            <div>No monthly data available</div>
          )}
        </div>

        <div className="card" style={{ width: 400 }}>
          <h3>Spending by Category</h3>
          {pieValues.length ? (
            <Pie data={{
              labels: pieLabels,
              datasets: [{ data: pieValues, backgroundColor: ['#0099cc','#00cc99','#ffaa00','#ff6666','#9999ff'] }]
            }} />
          ) : (
            <div>No category data available</div>
          )}
        </div>
      </div>

      {/* Raw JSON viewer for debugging */}
      <div className="card" style={{ marginTop: 12 }}>
        <h3>Raw analytics JSON (debug)</h3>
        <pre style={{ whiteSpace: "pre-wrap", maxHeight: 400, overflow: "auto", background: "#f7f7f7", padding: 10 }}>
          {raw ? JSON.stringify(raw, null, 2) : "(no raw response body)"}
        </pre>
      </div>
    </div>
  );
}
