import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import api from '../services/api';

const CourseDetailsPage = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Enroll Modal
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      const [courseData, studentsData, allStudentsData] = await Promise.allSettled([
        api.getCourse(courseId),
        api.getCourseStudents(courseId),
        api.getStudents(),
      ]);

      if (courseData.status === 'fulfilled') {
        setCourse(courseData.value);
      } else {
        throw new Error('Course not found.');
      }

      if (studentsData.status === 'fulfilled') {
        setEnrolledStudents(studentsData.value);
      }

      if (allStudentsData.status === 'fulfilled') {
        setAllStudents(allStudentsData.value);
        if (allStudentsData.value.length > 0) {
          setSelectedStudentId(allStudentsData.value[0].id);
        }
      }
    } catch (err) {
      setToast({ message: err.message || 'Error loading course details.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    const studentObj = allStudents.find((s) => s.id === parseInt(selectedStudentId, 10));

    setSubmitting(true);
    try {
      await api.enrollStudent(courseId, {
        student_id: parseInt(selectedStudentId, 10),
        student_name: studentObj ? studentObj.name : undefined,
        student_email: studentObj ? studentObj.email : undefined,
      });
      setToast({ message: 'Student successfully enrolled!', type: 'success' });
      setIsEnrollModalOpen(false);
      fetchCourseData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to enroll student.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    try {
      await api.unenrollStudent(courseId, studentId);
      setToast({ message: 'Student removed from this course.', type: 'success' });
      fetchCourseData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to remove student.', type: 'error' });
    }
  };

  // Filter out students who are already enrolled
  const enrolledStudentIds = new Set(enrolledStudents.map((s) => s.student_id));
  const availableToEnroll = allStudents.filter((s) => !enrolledStudentIds.has(s.id));

  return (
    <div>
      <Navbar title="Course Details & Roster" />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-body">
        <div style={{ marginBottom: '1.25rem' }}>
          <Link to="/courses" className="btn btn-secondary btn-sm">
            ← Back to All Courses
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading course roster and details..." />
        ) : course ? (
          <div>
            {/* Course Header Banner */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.9rem' }}>
                      {course.course_code}
                    </span>
                    <span className="badge badge-success">
                      {enrolledStudents.length} Students Enrolled
                    </span>
                  </div>
                  <h1 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>
                    {course.course_name}
                  </h1>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '700px', lineHeight: 1.6 }}>
                    {course.description || 'No detailed syllabus or description provided.'}
                  </p>
                </div>

                <button onClick={() => setIsEnrollModalOpen(true)} className="btn btn-primary">
                  + Enroll Student in Course
                </button>
              </div>
            </div>

            {/* Enrolled Students Table */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 style={{ fontSize: '1.15rem' }}>Enrolled Students Roster</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Cross-database association managed in Course Microservice (courses.db)
                  </p>
                </div>
              </div>

              {enrolledStudents.length > 0 ? (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Enrollment #</th>
                        <th>Student ID</th>
                        <th>Student Name</th>
                        <th>Student Email</th>
                        <th>Enrolled Date</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrolledStudents.map((item) => (
                        <tr key={item.enrollment_id}>
                          <td>#{item.enrollment_id}</td>
                          <td>
                            <strong>#{item.student_id}</strong>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{item.student_name || 'N/A'}</div>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{item.student_email || 'N/A'}</td>
                          <td>{new Date(item.enrolled_at).toLocaleDateString()}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                              <Link to={`/students/${item.student_id}`} className="btn btn-secondary btn-sm">
                                Profile
                              </Link>
                              <button
                                onClick={() => handleRemoveStudent(item.student_id)}
                                className="btn btn-danger btn-sm"
                                title="Remove student from course"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    No students are currently enrolled in this course.
                  </p>
                  <button onClick={() => setIsEnrollModalOpen(true)} className="btn btn-primary btn-sm">
                    Enroll First Student
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <h3>Course Not Found</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              The requested course ID #{courseId} was not found.
            </p>
          </div>
        )}
      </div>

      {/* Enroll Modal */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title={`Enroll Student into ${course?.course_code}`}
        footer={
          <>
            <button type="button" onClick={() => setIsEnrollModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              form="course-enroll-form"
              className="btn btn-primary"
              disabled={submitting || availableToEnroll.length === 0}
            >
              {submitting ? 'Enrolling...' : 'Enroll Student'}
            </button>
          </>
        }
      >
        {availableToEnroll.length > 0 ? (
          <form id="course-enroll-form" onSubmit={handleEnrollSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="student-picker">Select Student to Enroll</label>
              <select
                id="student-picker"
                className="form-select"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                required
              >
                {availableToEnroll.map((s) => (
                  <option key={s.id} value={s.id}>
                    #{s.id} - {s.name} ({s.email})
                  </option>
                ))}
              </select>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Note: Only students from the Student Microservice database not yet in this course are listed.
            </p>
          </form>
        ) : (
          <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>
            All currently registered students are already enrolled in this course, or no students have been registered yet.
          </p>
        )}
      </Modal>
    </div>
  );
};

export default CourseDetailsPage;
