import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import api from '../services/api';

const EnrollmentsPage = () => {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // New Enrollment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter
  const [filterCourseId, setFilterCourseId] = useState('');

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [coursesList, studentsList] = await Promise.all([
        api.getCourses(),
        api.getStudents(),
      ]);

      setCourses(coursesList);
      setStudents(studentsList);

      if (coursesList.length > 0) {
        setSelectedCourseId(coursesList[0].id);
      }
      if (studentsList.length > 0) {
        setSelectedStudentId(studentsList[0].id);
      }

      // Collect enrollments for all courses
      const enrollmentPromises = coursesList.map(async (c) => {
        try {
          const list = await api.getCourseStudents(c.id);
          return list.map((item) => ({
            ...item,
            course_id: c.id,
            course_code: c.course_code,
            course_name: c.course_name,
          }));
        } catch (e) {
          return [];
        }
      });

      const results = await Promise.all(enrollmentPromises);
      setAllEnrollments(results.flat());
    } catch (err) {
      setToast({ message: err.message || 'Failed to load enrollment data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedStudentId) return;

    const studentObj = students.find((s) => s.id === parseInt(selectedStudentId, 10));

    setSubmitting(true);
    try {
      await api.enrollStudent(selectedCourseId, {
        student_id: parseInt(selectedStudentId, 10),
        student_name: studentObj ? studentObj.name : undefined,
        student_email: studentObj ? studentObj.email : undefined,
      });
      setToast({ message: 'Enrollment completed successfully!', type: 'success' });
      setIsModalOpen(false);
      loadAllData();
    } catch (err) {
      setToast({ message: err.message || 'Enrollment failed.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (courseId, studentId) => {
    try {
      await api.unenrollStudent(courseId, studentId);
      setToast({ message: 'Enrollment removed.', type: 'success' });
      loadAllData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to remove enrollment.', type: 'error' });
    }
  };

  const displayedEnrollments = filterCourseId
    ? allEnrollments.filter((e) => e.course_id === parseInt(filterCourseId, 10))
    : allEnrollments;

  return (
    <div>
      <Navbar title="Enrollment Management" />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-body">
        {/* Controls */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Filter by Course:</label>
              <select
                className="form-select"
                value={filterCourseId}
                onChange={(e) => setFilterCourseId(e.target.value)}
                style={{ minWidth: '220px' }}
              >
                <option value="">All Courses ({allEnrollments.length} total enrollments)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.course_code} - {c.course_name}
                  </option>
                ))}
              </select>
            </div>

            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              + New Course Enrollment
            </button>
          </div>
        </div>

        {/* Enrollments List */}
        {loading ? (
          <LoadingSpinner text="Aggregating enrollment records across databases..." />
        ) : displayedEnrollments.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Enrollment ID</th>
                  <th>Course</th>
                  <th>Student Info</th>
                  <th>Email</th>
                  <th>Enrollment Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedEnrollments.map((item) => (
                  <tr key={`${item.course_id}-${item.student_id}`}>
                    <td>
                      <span className="badge" style={{ background: '#f1f5f9' }}>
                        #{item.enrollment_id}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge badge-primary">{item.course_code}</span>
                        <strong style={{ fontSize: '0.9rem' }}>{item.course_name}</strong>
                      </div>
                    </td>
                    <td>
                      <Link to={`/students/${item.student_id}`} style={{ fontWeight: 600 }}>
                        {item.student_name || `Student #${item.student_id}`}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.student_email || '—'}</td>
                    <td>{new Date(item.enrolled_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleRemove(item.course_id, item.student_id)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--danger)', borderColor: '#fca5a5' }}
                        title="Remove enrollment"
                      >
                        Unenroll
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>No Enrollments Found</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Assign students to courses to create cross-service relationships.
            </p>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              + Create First Enrollment
            </button>
          </div>
        )}
      </div>

      {/* New Enrollment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Assign Student to Course"
        footer={
          <>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              form="enroll-student-form"
              className="btn btn-primary"
              disabled={submitting || courses.length === 0 || students.length === 0}
            >
              {submitting ? 'Assigning...' : 'Assign Course'}
            </button>
          </>
        }
      >
        <form id="enroll-student-form" onSubmit={handleEnrollSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="enroll-course-select">Select Course</label>
            <select
              id="enroll-course-select"
              className="form-select"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              required
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_code} - {c.course_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="enroll-student-select">Select Student</label>
            <select
              id="enroll-student-select"
              className="form-select"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              required
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  #{s.id} - {s.name} ({s.department})
                </option>
              ))}
            </select>
          </div>

          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            The API Gateway will link the student record from <code>students.db</code> with the course in <code>courses.db</code>.
          </p>
        </form>
      </Modal>
    </div>
  );
};

export default EnrollmentsPage;
