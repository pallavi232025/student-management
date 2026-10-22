/**
 * Centralized API Service for communicating exclusively with the API Gateway.
 * Base URL defaults to http://localhost:8000 or the VITE_API_BASE_URL environment variable.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getHeaders(isJson = true) {
    const headers = {};
    if (isJson) {
      headers['Content-Type'] = 'application/json';
    }
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...this.getHeaders(options.body !== undefined),
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized (expired or invalid token)
      if (response.status === 401) {
        this.setToken(null);
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login?expired=true';
        }
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage = data.detail || data.message || `Request failed with status ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      // Re-throw with user-friendly error message if network error
      if (!err.status) {
        err.message = 'Unable to connect to the API Gateway. Please verify the backend services are running.';
      }
      throw err;
    }
  }

  // ==========================================
  // Authentication Endpoints
  // ==========================================
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: userData,
    });
  }

  async login(credentials) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: credentials,
    });
    if (data.access_token) {
      this.setToken(data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  }

  async getMe() {
    return this.request('/auth/me', {
      method: 'GET',
    });
  }

  logout() {
    this.setToken(null);
    localStorage.removeItem('user');
  }

  // ==========================================
  // Dashboard & Health Endpoints
  // ==========================================
  async getDashboardStats() {
    return this.request('/api/dashboard/stats', {
      method: 'GET',
    });
  }

  async getHealth() {
    return this.request('/health', {
      method: 'GET',
    });
  }

  // ==========================================
  // Student Microservice Endpoints
  // ==========================================
  async getStudents(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.department) query.append('department', params.department);
    if (params.skip) query.append('skip', params.skip);
    if (params.limit) query.append('limit', params.limit);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/students${queryString}`, { method: 'GET' });
  }

  async getStudent(id) {
    return this.request(`/students/${id}`, { method: 'GET' });
  }

  async createStudent(studentData) {
    return this.request('/students', {
      method: 'POST',
      body: studentData,
    });
  }

  async updateStudent(id, studentData) {
    return this.request(`/students/${id}`, {
      method: 'PUT',
      body: studentData,
    });
  }

  async deleteStudent(id) {
    return this.request(`/students/${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // Course Microservice Endpoints
  // ==========================================
  async getCourses(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.skip) query.append('skip', params.skip);
    if (params.limit) query.append('limit', params.limit);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/courses${queryString}`, { method: 'GET' });
  }

  async getCourse(id) {
    return this.request(`/courses/${id}`, { method: 'GET' });
  }

  async createCourse(courseData) {
    return this.request('/courses', {
      method: 'POST',
      body: courseData,
    });
  }

  async updateCourse(id, courseData) {
    return this.request(`/courses/${id}`, {
      method: 'PUT',
      body: courseData,
    });
  }

  async deleteCourse(id) {
    return this.request(`/courses/${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // Enrollment Endpoints
  // ==========================================
  async enrollStudent(courseId, enrollmentData) {
    return this.request(`/courses/${courseId}/enroll`, {
      method: 'POST',
      body: enrollmentData,
    });
  }

  async getCourseStudents(courseId) {
    return this.request(`/courses/${courseId}/students`, {
      method: 'GET',
    });
  }

  async getStudentCourses(studentId) {
    return this.request(`/courses/enrollments/student/${studentId}`, {
      method: 'GET',
    });
  }

  async unenrollStudent(courseId, studentId) {
    return this.request(`/courses/${courseId}/enroll/${studentId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
export default api;
