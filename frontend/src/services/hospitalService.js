const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'An error occurred during hospital operation.');
    error.code = data.code || 'API_ERROR';
    error.status = response.status;
    throw error;
  }
  return data;
}

export const hospitalService = {
  /**
   * Get Hospital Profile & Real-time Stats
   */
  async getHospitalProfile() {
    const response = await fetch(`${API_BASE_URL}/hospital/profile`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleResponse(response);
  },

  /**
   * Update Hospital Profile Information
   */
  async updateHospitalProfile(profileData) {
    const response = await fetch(`${API_BASE_URL}/hospital/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  },

  /**
   * Create New Blood Request (Gated by isVerified)
   */
  async createBloodRequest(requestData) {
    const response = await fetch(`${API_BASE_URL}/hospital/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(requestData),
    });
    return handleResponse(response);
  },

  /**
   * Get All Requests Created by Authenticated Hospital (With Search, Filters, Sort, Pagination)
   */
  async getBloodRequests(params = {}) {
    const urlParams = new URLSearchParams();
    if (params.search) urlParams.append('search', params.search);
    if (params.status) urlParams.append('status', params.status);
    if (params.urgency) urlParams.append('urgency', params.urgency);
    if (params.bloodGroup) urlParams.append('bloodGroup', params.bloodGroup);
    if (params.sortBy) urlParams.append('sortBy', params.sortBy);
    if (params.sortOrder) urlParams.append('sortOrder', params.sortOrder);
    if (params.page) urlParams.append('page', params.page.toString());
    if (params.limit) urlParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_BASE_URL}/hospital/requests?${urlParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleResponse(response);
  },

  /**
   * Get Available Donors Across Network
   */
  async getAvailableDonors() {
    const response = await fetch(`${API_BASE_URL}/hospital/available-donors`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleResponse(response);
  },

  /**
   * Get Accepted Donors for this Hospital
   */
  async getAcceptedDonors() {
    const response = await fetch(`${API_BASE_URL}/hospital/accepted-donors`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleResponse(response);
  },

  /**
   * Get Details for a Specific Blood Request
   */
  async getBloodRequest(id) {
    const response = await fetch(`${API_BASE_URL}/hospital/requests/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleResponse(response);
  },

  /**
   * Get Smart Donor Matches for a Specific Blood Request (Stage 5)
   */
  async getBloodRequestMatches(id) {
    const response = await fetch(`${API_BASE_URL}/hospital/requests/${id}/matches`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleResponse(response);
  },

  /**
   * Record Actual Blood Received & Perform Fulfillment
   */
  async recordFulfillment(requestId, fulfillmentData) {
    const response = await fetch(`${API_BASE_URL}/hospital/requests/${requestId}/fulfill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(fulfillmentData),
    });
    return handleResponse(response);
  },

  /**
   * Update Blood Request (Fulfillment units, status, reason)
   */
  async updateBloodRequest(id, updateData) {
    const response = await fetch(`${API_BASE_URL}/hospital/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updateData),
    });
    return handleResponse(response);
  },

  /**
   * Cancel Blood Request
   */
  async cancelBloodRequest(id) {
    const response = await fetch(`${API_BASE_URL}/hospital/requests/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleResponse(response);
  },
};
