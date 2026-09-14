/**
 * API client helper to interact with the backend
 */
const BASE_URL = window.location.origin;

export const api = {
  async getProfile() {
    try {
      const res = await fetch(`${BASE_URL}/api/profile`);
      if (!res.ok) throw new Error('Failed to load profile');
      return await res.json();
    } catch (err) {
      console.warn('Falling back to local cache or defaults', err);
      return null;
    }
  },

  async getProjects() {
    try {
      const res = await fetch(`${BASE_URL}/api/projects`);
      if (!res.ok) throw new Error('Failed to load projects');
      return await res.json();
    } catch (err) {
      console.warn('Falling back to local cache or defaults', err);
      return [];
    }
  },

  async submitContact(data) {
    const res = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Failed to send message');
    }
    return result;
  }
};
