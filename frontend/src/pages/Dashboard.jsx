// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState, useContext } from "react";
import api from "../api";
import { AuthContext } from "../contexts/AuthContext";
import {
  Chart as ChartJS,
  ArcElement,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    api
      .get("/analytics")
      .then((res) => {
        if (!mounted) return;
        setData(res.data || {});
      })
      .catch((e) => {
        console.error("analytics fetch err", e && (e.response?.data || e.message));
        if (!mounted) return;
        setError("Failed to load analytics");
        setData({});
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Normalize analytics object and provide safe defaults
  const analytics = data && (data.analytics || data) ? (data.analytics || data) : {};
  const monthly = Array.isArray(analytics.monthly)
    ? analytics.monthly
    : Array.isArray(analytics.months)
    ? analytics.months
    : [];

  // categories: prefer analytics.categories, fall back to categoryBreakdown and other likely names
  const categories = Array.isArray(analytics.categories)
    ? analytics.categories
    : Array.isArray(analytics.categoryBreakdown)
    ? analytics.categoryBreakdown
    : Array.isArray(analytics.categoryTotals)
    ? analytics.categoryTotals
    : [];

  // Prepare chart-safe arrays
  const labels = monthly.map((m) => {
    // m.month could be a date string or something else
    try {
      return new Date(m.month).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
      return String(m.month || "");
    }
  });

  const incomeData = monthly.map((m) => parseFloat(m.income ?? m.in ?? 0));
  const expenseData = monthly.map((m) => parseFloat(m.expense ?? m.exp ?? 0));

  const pieLabels = categories.map((c) => c.category ?? c.name ?? "Unknown");
  const pieValues = categories.map((c) => parseFloat(c.total ?? c.amount ?? c.value ?? 0));

  // Chart data objects
  const lineData = {
    labels,
    datasets: [
      {
        label: "Income",
        data: incomeData,
        fill: false,
        tension: 0.2,
      },
      {
        label: "Expense",
        data: expenseData,
        fill: false,
        tension: 0.2,
      },
    ],
  };

  const pieData = {
    labels: pieLabels,
    datasets: [
      {
        data: pieValues,
        backgroundColor: ["#0099cc", "#00cc99", "#ffaa00", "#ff6666", "#9999ff"],
      },
    ],
  };

  return (
    <div style={{ padding: 20 }}>
      <div className="header" style={{ marginBottom: 12 }}>
        <h2>Dashboard</h2>
        <div style={{ color: "#666" }}>
          Welcome, <strong>{user?.name ?? user?.email ?? "User"}</strong>
        </div>
      </div>

      {loading && <div className="card">Loading analytics...</div>}
      {error && (
        <div className="card" style={{ color: "darkred" }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Summary / diagnostics (small, unobtrusive) */}
          <div className="card" style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>Total Income:</strong> {analytics.totalIncome ?? "-"} &nbsp;&nbsp;
                <strong>Total Expense:</strong> {analytics.totalExpense ?? "-"} &nbsp;&nbsp;
                <strong>Net:</strong> {analytics.netBalance ?? "-"}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div className="card" style={{ flex: 1, minWidth: 360 }}>
              <h3>Monthly Income / Expense</h3>
              {labels.length ? (
                <Line data={lineData} />
              ) : (
                <div>No monthly data available</div>
              )}
            </div>

            <div className="card" style={{ width: 420 }}>
              <h3>Spending by Category</h3>
              {pieValues.length ? (
                <Pie data={pieData} />
              ) : (
                <div>No category data available</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
