import React, { useEffect, useState, useContext } from "react";
import api from "../api";
import { AuthContext } from "../contexts/AuthContext";
import { Chart as ChartJS, ArcElement, LineElement, BarElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from "chart.js";
import { Pie, Line, Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, LineElement, BarElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    let mounted = true;
    setError(null);
    api.get("/analytics")
      .then((res) => {
        // Expecting res.data to be the analytics object
        if (!mounted) return;
        setData(res.data || null);
      })
      .catch((e) => {
        console.error("analytics fetch err", e && (e.response?.data || e.message));
        if (!mounted) return;
        setError("Failed to load analytics. See console for details.");
        setData(null);
      });
    return () => { mounted = false; };
  }, []);

  if (error) {
    return (
      <div className="card">
        <h3>Error</h3>
        <div>{error}</div>
      </div>
    );
  }

  if (!data) {
    return <div className="card">Loading analytics...</div>;
  }

  // Defensive defaults: if the backend doesn't return properties, use empty arrays
  const monthly = Array.isArray(data.monthly) ? data.monthly : [];
  const categories = Array.isArray(data.categories) ? data.categories : [];

  // Prepare labels / data for charts safely
  const labels = monthly.map((m) => {
    try {
      return new Date(m.month).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
      // fallback if month isn't parseable
      return String(m.month || "");
    }
  });

  const incomeData = monthly.map((m) => parseFloat(m.income || 0));
  const expenseData = monthly.map((m) => parseFloat(m.expense || 0));

  const pieLabels = categories.map((c) => c.category || "Unknown");
  const pieValues = categories.map((c) => parseFloat(c.total || 0));

  const lineData = {
    labels,
    datasets: [
      { label: "Income", data: incomeData, fill: false, tension: 0.1 },
      { label: "Expense", data: expenseData, fill: false, tension: 0.1 },
    ],
  };

  const pieData = {
    labels: pieLabels,
    datasets: [
      {
        data: pieValues,
        // default colors (chartjs will fallback if omitted)
        backgroundColor: ["#0099cc", "#00cc99", "#ffaa00", "#ff6666", "#9999ff"],
      },
    ],
  };

  return (
    <div>
      <div className="header">
        <h2>Dashboard</h2>
        <p>Welcome, {user?.name || "User"}</p>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Monthly Income / Expense</h3>
          {labels.length ? (
            <Line data={lineData} />
          ) : (
            <div>No monthly data available</div>
          )}
        </div>

        <div className="card">
          <h3>Spending by Category</h3>
          {pieValues.length ? (
            <Pie data={pieData} />
          ) : (
            <div>No category data available</div>
          )}
        </div>

        {/* Add any other analytics widgets below, always guarding with defensive checks */}
      </div>
    </div>
  );
}
