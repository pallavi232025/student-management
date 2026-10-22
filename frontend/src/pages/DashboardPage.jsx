import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import api from '../services/api';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    total_students: 0,
    total_courses: 0,
    total_enrollments: 0,
    recent_students: [],
  });
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [statsData, healthData] = await Promise.allSettled([
        api.getDashboardStats(),
        api.getHealth(),
      ]);

      if (statsData.status === 'fulfilled') {
        setStats(statsData.value);
      }
      if (healthData.status === 'fulfilled') {
        setHealth(healthData.value);
      }
    } catch (err) {
      setToast({ message: 'Failed to load some dashboard metrics.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div>
      <Navbar title="Dashboard Overview" />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-body">
        {/* Welcome Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem 2.5rem',
          color: 'white',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#c7d2fe', marginBottom: '0.75rem' }}>
              Microservices Architecture
            </span>
            <h1 style={{ fontSize: '1.85rem', color: 'white', marginBottom: '0.5rem' }}>
              Student Management System
            </h1>
            <p style={{ color: '#c7d2fe', fontSize: '0.95rem', maxWidth: '600px' }}>
              Manage students, courses, and cross-database enrollments across isolated microservice databases powered by FastAPI and React.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/students" className="btn btn-primary" style={{ background: 'white', color: '#1e1b4b' }}>
              View Students
            </Link>
            <Link to="/courses" className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}>
              View Courses
            </Link>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="Fetching microservices data..." />
        ) : (
          <>
            {/* KPI Stats Grid */}
            <div className="stats-grid">
              <StatsCard
                title="Total Students"
                value={stats.total_students}
                icon="👥"
                color="indigo"
                subtitle="Student Microservice (:8002)"
              />
              <StatsCard
                title="Active Courses"
                value={stats.total_courses}
                icon="📚"
                color="cyan"
                subtitle="Course Microservice (:8003)"
              />
              <StatsCard
                title="Total Enrollments"
                value={stats.total_enrollments}
                icon="🎓"
                color="emerald"
                subtitle="Cross-Service Association"
              />
              <StatsCard
                title="Architecture Health"
                value={health?.overall_status === 'healthy' ? 'Healthy' : 'Active'}
                icon="⚡"
                color="amber"
                subtitle="API Gateway (:8000)"
              />
            </div>

            {/* Microservices Topology Indicator */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div className="card-header">
                <div>
                  <h3 style={{ fontSize: '1.1rem' }}>Microservices Topology & Status</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    All requests from this dashboard route through the centralized API Gateway.
                  </p>
                </div>
                <button onClick={fetchDashboardData} className="btn btn-secondary btn-sm">
                  Refresh Status
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>API Gateway</span>
                    <span className="badge badge-success">Port 8000</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Routes all endpoints & manages CORS</p>
                </div>

                <div style={{ padding: '1rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Auth Service</span>
                    <span className={`badge ${health?.services?.auth_service === 'online' ? 'badge-success' : 'badge-warning'}`}>
                      Port 8001
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>JWT & auth.db</p>
                </div>

                <div style={{ padding: '1rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Student Service</span>
                    <span className={`badge ${health?.services?.student_service === 'online' ? 'badge-success' : 'badge-warning'}`}>
                      Port 8002
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Student CRUD & students.db</p>
                </div>

                <div style={{ padding: '1rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Course Service</span>
                    <span className={`badge ${health?.services?.course_service === 'online' ? 'badge-success' : 'badge-warning'}`}>
                      Port 8003
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Catalog, enrollments & courses.db</p>
                </div>
              </div>
            </div>

            {/* Recent Students Section */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 style={{ fontSize: '1.1rem' }}>Recently Registered Students</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Latest entries from the Student Microservice database
                  </p>
                </div>
                <Link to="/students" className="btn btn-secondary btn-sm">
                  View All Students →
                </Link>
              </div>

              {stats.recent_students && stats.recent_students.length > 0 ? (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Course</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent_students.map((student) => (
                        <tr key={student.id}>
                          <td><strong>#{student.id}</strong></td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{student.name}</div>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{student.email}</td>
                          <td>
                            <span className="badge badge-primary">{student.department}</span>
                          </td>
                          <td>{student.course}</td>
                          <td>
                            <Link to={`/students/${student.id}`} className="btn btn-secondary btn-sm">
                              Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No student records found yet.</p>
                  <Link to="/students" className="btn btn-primary btn-sm">
                    + Add Your First Student
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
