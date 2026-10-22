import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import api from '../services/api';

const StudentDetailsPage = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Enroll modal
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const [studentData, coursesData, allCoursesData] = await Promise.allSettled([
        api.getStudent(studentId),
        api.getStudentCourses(studentId),
        api.getCourses(),
      ]);

      if (studentData.status === 'fulfilled') {
        setStudent(studentData.value);
      } else {
        throw new Error('Student not found.');
      }

      if (coursesData.status === 'fulfilled') {
        setEnrolledCourses(coursesData.value);
      }

      if (allCoursesData.status === 'fulfilled') {
        setAvailableCourses(allCoursesData.value);
        if (allCoursesData.value.length > 0) {
          setSelectedCourseId(allCoursesData.value[0].id);
        }
      }
    } catch (err) {
      setToast({ message: err.message || 'Error loading student details.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    setSubmitting(true);
    try {
      await api.enrollStudent(selectedCourseId, {
        student_id: parseInt(studentId, 10),
        student_name: student.name,
        student_email: student.email,
      });
      setToast({ message: 'Enrolled into course successfully!', type: 'success' });
      setIsEnrollModalOpen(false);
      fetchStudentData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to enroll student.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnenroll = async (courseId) => {
    try {
      await api.unenrollStudent(courseId, studentId);
      setToast({ message: 'Student removed from course.', type: 'success' });
      fetchStudentData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to unenroll student.', type: 'error' });
    }
  };

  return (
    <div>
      <Navbar title="Student Profile" />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-body">
        <div style={{ marginBottom: '1.25rem' }}>
          <Link to="/students" className="btn btn-secondary btn-sm">
            ← Back to All Students
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading profile and enrollments..." />
        ) : student ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {/* Student Info Card */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div 
                  className="user-avatar" 
                  style={{ width: 64, height: 64, fontSize: '1.75rem', borderRadius: 'var(--radius-lg)' }}
                >
                  {student.name[0].toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.4rem' }}>{student.name}</h2>
                  <span className="badge badge-primary">{student.department}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Student ID</label>
                  <p style={{ fontWeight: 600 }}>#{student.id}</p>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Email Address</label>
                  <p style={{ fontWeight: 500 }}>{student.email}</p>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Phone Number</label>
                  <p style={{ fontWeight: 500 }}>{student.phone_number}</p>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Enrolled Major / Degree</label>
                  <p style={{ fontWeight: 500 }}>{student.course}</p>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Registered On</label>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {new Date(student.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Enrolled Courses Card */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 style={{ fontSize: '1.15rem' }}>Active Course Enrollments</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Synced from Course Microservice (:8003)
                  </p>
                </div>
                <button onClick={() => setIsEnrollModalOpen(true)} className="btn btn-primary btn-sm">
                  + Enroll in Course
                </button>
              </div>

              {enrolledCourses.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {enrolledCourses.map((item) => (
                    <div 
                      key={item.id} 
                      style={{
                        padding: '1rem',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#f8fafc'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span className="badge badge-success">{item.course_code}</span>
                          <strong style={{ fontSize: '0.95rem' }}>{item.course_name}</strong>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Enrolled on {new Date(item.enrolled_at).toLocaleDateString()}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleUnenroll(item.course_id)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--danger)', borderColor: '#fca5a5' }}
                        title="Unenroll student"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Student is not currently enrolled in any courses.
                  </p>
                  <button onClick={() => setIsEnrollModalOpen(true)} className="btn btn-secondary btn-sm">
                    Assign a Course
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <h3>Student Not Found</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              The requested student ID #{studentId} does not exist in the Student database.
            </p>
          </div>
        )}
      </div>

      {/* Enroll in Course Modal */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title={`Enroll ${student?.name} in a Course`}
        footer={
          <>
            <button type="button" onClick={() => setIsEnrollModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              form="enroll-modal-form" 
              className="btn btn-primary"
              disabled={submitting || availableCourses.length === 0}
            >
              {submitting ? 'Enrolling...' : 'Confirm Enrollment'}
            </button>
          </>
        }
      >
        <form id="enroll-modal-form" onSubmit={handleEnrollSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="select-course">Select Course</label>
            <select
              id="select-course"
              className="form-select"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              required
            >
              {availableCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_code} - {c.course_name}
                </option>
              ))}
            </select>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            This links the student from <code>students.db</code> to the course in <code>courses.db</code> via the microservices API Gateway.
          </p>
        </form>
      </Modal>
    </div>
  );
};

export default StudentDetailsPage;
