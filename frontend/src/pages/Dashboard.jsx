import React, { useEffect, useState, useContext } from 'react';
import api from '../api';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { AuthContext } from '../contexts/AuthContext';
import {
  Chart as ChartJS,
  ArcElement,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';

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
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    const token = localStorage.getItem('token');

    // ✅ if no token, redirect to login immediately
    if (!token) {
      console.warn('No token found — redirecting to login.');
      window.location.href = '/login';
      return;
    }

    // ✅ fetch analytics
    api
      .get('/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => setData(r.data))
      .catch((e) => {
        console.warn('Analytics fetch error:', e?.message || e);
        setError('Failed to load analytics. Redirecting to login...');
        // ✅ auto logout + redirect if token invalid
        setTimeout(() => {
          localStorage.clear();
          window.location.href = '/login';
        }, 1500);
      });
  }, []);

  // ✅ handle loading & error states gracefully
  if (error) return <div className="card">{error}</div>;
  if (!data) return <div className="card">Loading analytics...</div>;

  const monthly = data.monthly || [];
  const months = monthly.map((m) =>
    new Date(m.month).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    })
  );
  const income = monthly.map((m) => parseFloat(m.income));
  const expense = monthly.map((m) => parseFloat(m.expense));

  const pieData = {
    labels: data.categories.map((c) => c.category),
    datasets: [
      {
        data: data.categories.map((c) => parseFloat(c.total)),
        backgroundColor: ['#0099cc', '#00cc99', '#ffaa00', '#ff6666', '#9999ff'],
      },
    ],
  };

  return (
    <div>
      <div className="header">
        <h2>Dashboard</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ fontSize: 14 }}>
            {user?.name || 'User'} ({user?.role || 'N/A'})
          </div>
          <button
            className="btn"
            onClick={() => {
              localStorage.clear();
              logout?.();
              window.location.href = '/login';
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          padding: 16,
        }}
      >
        <div className="card">
          <h3>Monthly Trend</h3>
          <Line
            data={{
              labels: months,
              datasets: [
                {
                  label: 'Income',
                  data: income,
                  borderColor: '#00cc99',
                  tension: 0.3,
                },
                {
                  label: 'Expense',
                  data: expense,
                  borderColor: '#ff6666',
                  tension: 0.3,
                },
              ],
            }}
          />
        </div>

        <div className="card">
          <h3>Category Breakdown</h3>
          <Pie data={pieData} />
        </div>

        <div className="card" style={{ gridColumn: '1 / span 2' }}>
          <h3>Income vs Expense</h3>
          <Bar
            data={{
              labels: months,
              datasets: [
                {
                  label: 'Income',
                  data: income,
                  backgroundColor: '#00cc99',
                },
                {
                  label: 'Expense',
                  data: expense,
                  backgroundColor: '#ff6666',
                },
              ],
            }}
          />
        </div>
      </div>
    </div>
  );
}
