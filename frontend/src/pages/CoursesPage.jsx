import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import api from '../services/api';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    course_name: '',
    course_code: '',
    description: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await api.getCourses({
        search: search || undefined,
      });
      setCourses(data);
    } catch (err) {
      setToast({ message: err.message || 'Failed to load courses.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCourses();
  };

  const handleOpenAddModal = () => {
    setFormData({ course_name: '', course_code: '', description: '' });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (course) => {
    setCurrentCourse(course);
    setFormData({
      course_name: course.course_name,
      course_code: course.course_code,
      description: course.description || '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (course) => {
    setCurrentCourse(course);
    setIsDeleteModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      await api.createCourse(formData);
      setToast({ message: 'Course created successfully!', type: 'success' });
      setIsAddModalOpen(false);
      fetchCourses();
    } catch (err) {
      setToast({ message: err.message || 'Error creating course.', type: 'error' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!currentCourse) return;
    setFormSubmitting(true);
    try {
      await api.updateCourse(currentCourse.id, formData);
      setToast({ message: 'Course updated successfully!', type: 'success' });
      setIsEditModalOpen(false);
      fetchCourses();
    } catch (err) {
      setToast({ message: err.message || 'Error updating course.', type: 'error' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentCourse) return;
    setFormSubmitting(true);
    try {
      await api.deleteCourse(currentCourse.id);
      setToast({ message: 'Course and enrollments deleted safely.', type: 'success' });
      setIsDeleteModalOpen(false);
      fetchCourses();
    } catch (err) {
      setToast({ message: err.message || 'Error deleting course.', type: 'error' });
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div>
      <Navbar title="Course Catalog" />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-body">
        {/* Controls Bar */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '280px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search by course name or code (e.g. CS101)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary">
                Search
              </button>
            </form>

            <button onClick={handleOpenAddModal} className="btn btn-primary">
              + Add New Course
            </button>
          </div>
        </div>

        {/* Courses List */}
        {loading ? (
          <LoadingSpinner text="Loading courses..." />
        ) : courses.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {courses.map((course) => (
              <div key={course.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.85rem' }}>
                      {course.course_code}
                    </span>
                    <span className="badge badge-success" title="Students currently enrolled">
                      {course.enrolled_count || 0} Enrolled
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                    {course.course_name}
                  </h3>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', minHeight: '40px', lineHeight: 1.5 }}>
                    {course.description || 'No description provided.'}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Link to={`/courses/${course.id}`} className="btn btn-primary btn-sm">
                    View Enrolled Students →
                  </Link>

                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button onClick={() => handleOpenEditModal(course)} className="btn btn-secondary btn-sm" title="Edit Course">
                      Edit
                    </button>
                    <button onClick={() => handleOpenDeleteModal(course)} className="btn btn-danger btn-sm" title="Delete Course">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>No Courses Found</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              {search ? 'No courses match your search criteria.' : 'No courses are currently available in the Course Microservice.'}
            </p>
            <button onClick={handleOpenAddModal} className="btn btn-primary">
              + Create First Course
            </button>
          </div>
        )}
      </div>

      {/* Add Course Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Course"
        footer={
          <>
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" form="add-course-form" className="btn btn-primary" disabled={formSubmitting}>
              {formSubmitting ? 'Creating...' : 'Save Course'}
            </button>
          </>
        }
      >
        <form id="add-course-form" onSubmit={handleAddSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="course_name">Course Name</label>
            <input
              id="course_name"
              type="text"
              className="form-input"
              placeholder="e.g. Data Structures and Algorithms"
              value={formData.course_name}
              onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="course_code">Course Code (Unique)</label>
            <input
              id="course_code"
              type="text"
              className="form-input"
              placeholder="e.g. CS201"
              value={formData.course_code}
              onChange={(e) => setFormData({ ...formData, course_code: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              className="form-textarea"
              rows="3"
              placeholder="Brief course overview and curriculum..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>
        </form>
      </Modal>

      {/* Edit Course Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Course ${currentCourse?.course_code}`}
        footer={
          <>
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" form="edit-course-form" className="btn btn-primary" disabled={formSubmitting}>
              {formSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form id="edit-course-form" onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-course_name">Course Name</label>
            <input
              id="edit-course_name"
              type="text"
              className="form-input"
              value={formData.course_name}
              onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-course_code">Course Code</label>
            <input
              id="edit-course_code"
              type="text"
              className="form-input"
              value={formData.course_code}
              onChange={(e) => setFormData({ ...formData, course_code: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-description">Description</label>
            <textarea
              id="edit-description"
              className="form-textarea"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>
        </form>
      </Modal>

      {/* Delete Course Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Course Deletion"
        footer={
          <>
            <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="button" onClick={handleDeleteConfirm} className="btn btn-danger" disabled={formSubmitting}>
              {formSubmitting ? 'Deleting...' : 'Delete Course'}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>
          Are you sure you want to delete course <strong>{currentCourse?.course_name} ({currentCourse?.course_code})</strong>?
        </p>
        <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Warning: This course currently has {currentCourse?.enrolled_count || 0} student enrollment(s).
          All associated enrollment links in <code>courses.db</code> will also be deleted.
        </p>
      </Modal>
    </div>
  );
};

export default CoursesPage;
