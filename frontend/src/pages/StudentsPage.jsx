import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import api from '../services/api';

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [toast, setToast] = useState(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    department: 'Computer Science',
    course: 'B.Tech Computer Science',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const departments = [
    'Computer Science',
    'Information Technology',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Civil Engineering',
    'Business Administration',
  ];

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await api.getStudents({
        search: search || undefined,
        department: departmentFilter || undefined,
      });
      setStudents(data);
    } catch (err) {
      setToast({ message: err.message || 'Failed to fetch students.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [departmentFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      email: '',
      phone_number: '',
      department: 'Computer Science',
      course: 'B.Tech Computer Science',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (student) => {
    setCurrentStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      phone_number: student.phone_number,
      department: student.department,
      course: student.course,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (student) => {
    setCurrentStudent(student);
    setIsDeleteModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      await api.createStudent(formData);
      setToast({ message: 'Student created successfully!', type: 'success' });
      setIsAddModalOpen(false);
      fetchStudents();
    } catch (err) {
      setToast({ message: err.message || 'Error creating student.', type: 'error' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!currentStudent) return;
    setFormSubmitting(true);
    try {
      await api.updateStudent(currentStudent.id, formData);
      setToast({ message: 'Student updated successfully!', type: 'success' });
      setIsEditModalOpen(false);
      fetchStudents();
    } catch (err) {
      setToast({ message: err.message || 'Error updating student.', type: 'error' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentStudent) return;
    setFormSubmitting(true);
    try {
      await api.deleteStudent(currentStudent.id);
      setToast({ message: 'Student deleted successfully!', type: 'success' });
      setIsDeleteModalOpen(false);
      fetchStudents();
    } catch (err) {
      setToast({ message: err.message || 'Error deleting student.', type: 'error' });
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div>
      <Navbar title="Student Directory" />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-body">
        {/* Controls Bar */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Search form */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '280px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search by name, email, or course..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary">
                Search
              </button>
            </form>

            {/* Department filter */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <select
                className="form-select"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                style={{ minWidth: '180px' }}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <button onClick={handleOpenAddModal} className="btn btn-primary">
                + Add Student
              </button>
            </div>
          </div>
        </div>

        {/* Student Table */}
        {loading ? (
          <LoadingSpinner text="Loading student records..." />
        ) : students.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student Info</th>
                  <th>Contact Details</th>
                  <th>Department</th>
                  <th>Enrolled Program</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                        #{student.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{student.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{student.email}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.875rem' }}>{student.phone_number}</span>
                    </td>
                    <td>
                      <span className="badge badge-primary">{student.department}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{student.course}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <Link to={`/students/${student.id}`} className="btn btn-secondary btn-sm" title="View Profile">
                          View
                        </Link>
                        <button onClick={() => handleOpenEditModal(student)} className="btn btn-secondary btn-sm" title="Edit Student">
                          Edit
                        </button>
                        <button onClick={() => handleOpenDeleteModal(student)} className="btn btn-danger btn-sm" title="Delete Student">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>No Students Found</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              {search || departmentFilter ? 'No student records matched your filter criteria.' : 'Start by adding your first student to the system.'}
            </p>
            <button onClick={handleOpenAddModal} className="btn btn-primary">
              + Add First Student
            </button>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Student"
        footer={
          <>
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" form="add-student-form" className="btn btn-primary" disabled={formSubmitting}>
              {formSubmitting ? 'Creating...' : 'Save Student'}
            </button>
          </>
        }
      >
        <form id="add-student-form" onSubmit={handleAddSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder="e.g. Alice Johnson"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="studentEmail">Email Address</label>
            <input
              id="studentEmail"
              type="email"
              className="form-input"
              placeholder="e.g. alice.johnson@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="text"
              className="form-input"
              placeholder="e.g. +1-555-0199"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="department">Department</label>
            <select
              id="department"
              className="form-select"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              required
            >
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="course">Major / Program</label>
            <input
              id="course"
              type="text"
              className="form-input"
              placeholder="e.g. B.Tech Computer Science"
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Student #${currentStudent?.id}`}
        footer={
          <>
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" form="edit-student-form" className="btn btn-primary" disabled={formSubmitting}>
              {formSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form id="edit-student-form" onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-name">Full Name</label>
            <input
              id="edit-name"
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-email">Email Address</label>
            <input
              id="edit-email"
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-phone">Phone Number</label>
            <input
              id="edit-phone"
              type="text"
              className="form-input"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-department">Department</label>
            <select
              id="edit-department"
              className="form-select"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              required
            >
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-course">Major / Program</label>
            <input
              id="edit-course"
              type="text"
              className="form-input"
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Student Deletion"
        footer={
          <>
            <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="button" onClick={handleDeleteConfirm} className="btn btn-danger" disabled={formSubmitting}>
              {formSubmitting ? 'Deleting...' : 'Delete Student'}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>
          Are you sure you want to delete student <strong>{currentStudent?.name}</strong> (ID #{currentStudent?.id})?
        </p>
        <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          This will permanently remove their record from the Student Microservice database.
        </p>
      </Modal>
    </div>
  );
};

export default StudentsPage;
