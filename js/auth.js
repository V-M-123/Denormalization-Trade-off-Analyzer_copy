/**
 * Authentication & User Session Manager
 * Coordinates registration, login, session tokens, and auth UI state.
 */

const API_BASE = 'http://localhost:4000/api/v1';

class AuthManager {
  constructor() {
    this.token = localStorage.getItem('denorm_token') || null;
    this.user = null;
    try {
      const stored = localStorage.getItem('denorm_user');
      if (stored) this.user = JSON.parse(stored);
    } catch {
      this.user = null;
    }
  }

  isAuthenticated() {
    return Boolean(this.token && this.user);
  }

  getUser() {
    return this.user;
  }

  getToken() {
    return this.token;
  }

  getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  setSession(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('denorm_token', token);
    localStorage.setItem('denorm_user', JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('auth:change', { detail: { user, isAuthenticated: true } }));
  }

  clearSession() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('denorm_token');
    localStorage.removeItem('denorm_user');
    window.dispatchEvent(new CustomEvent('auth:change', { detail: { user: null, isAuthenticated: false } }));
  }

  async login(email, password) {
    let res;
    try {
      res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
    } catch {
      throw new Error('Backend server is offline. Please start it by running: npm run server');
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed.');
    }

    this.setSession(data.token, data.user);
    return data.user;
  }

  async register(email, password, name) {
    let res;
    try {
      res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
    } catch {
      throw new Error('Backend server is offline. Please start it by running: npm run server');
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed.');
    }

    this.setSession(data.token, data.user);
    return data.user;
  }

  async fetchCurrentUser() {
    if (!this.token) return null;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        this.user = data.user;
        localStorage.setItem('denorm_user', JSON.stringify(data.user));
        return data.user;
      } else {
        this.clearSession();
        return null;
      }
    } catch {
      return this.user;
    }
  }

  logout() {
    this.clearSession();
  }
}

export const auth = new AuthManager();

/**
 * Initializes the Auth Modal and Header profile controls
 */
export function setupAuthUI() {
  const authModal = document.getElementById('auth-modal');
  const authBtn = document.getElementById('header-auth-btn');
  const userPill = document.getElementById('header-user-pill');
  const userEmailSpan = document.getElementById('header-user-email');
  const logoutBtn = document.getElementById('header-logout-btn');
  const closeAuthModalBtn = document.getElementById('close-auth-modal');

  const authTabLogin = document.getElementById('auth-tab-login');
  const authTabRegister = document.getElementById('auth-tab-register');
  const authFormLogin = document.getElementById('auth-form-login');
  const authFormRegister = document.getElementById('auth-form-register');
  const authFeedback = document.getElementById('auth-feedback');

  function updateHeader() {
    if (auth.isAuthenticated()) {
      const user = auth.getUser();
      if (authBtn) authBtn.style.display = 'none';
      if (userPill) userPill.style.display = 'inline-flex';
      if (userEmailSpan) userEmailSpan.textContent = user.name || user.email;
    } else {
      if (authBtn) authBtn.style.display = 'inline-flex';
      if (userPill) userPill.style.display = 'none';
    }
  }

  // Check current session on load
  auth.fetchCurrentUser().then(() => updateHeader());
  window.addEventListener('auth:change', () => updateHeader());

  // Header buttons
  if (authBtn) {
    authBtn.addEventListener('click', () => {
      if (authFeedback) authFeedback.style.display = 'none';
      if (authModal) authModal.style.display = 'flex';
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.logout();
    });
  }

  if (closeAuthModalBtn && authModal) {
    closeAuthModalBtn.addEventListener('click', () => {
      authModal.style.display = 'none';
    });
  }

  // Tab switching inside auth modal
  if (authTabLogin && authTabRegister && authFormLogin && authFormRegister) {
    authTabLogin.addEventListener('click', () => {
      authTabLogin.classList.add('active');
      authTabRegister.classList.remove('active');
      authFormLogin.style.display = 'flex';
      authFormRegister.style.display = 'none';
      if (authFeedback) authFeedback.style.display = 'none';
    });

    authTabRegister.addEventListener('click', () => {
      authTabRegister.classList.add('active');
      authTabLogin.classList.remove('active');
      authFormRegister.style.display = 'flex';
      authFormLogin.style.display = 'none';
      if (authFeedback) authFeedback.style.display = 'none';
    });
  }

  // Handle Login submission
  if (authFormLogin) {
    authFormLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const submitBtn = authFormLogin.querySelector('button[type="submit"]');

      try {
        if (submitBtn) submitBtn.disabled = true;
        if (authFeedback) authFeedback.style.display = 'none';

        await auth.login(email, password);
        if (authModal) authModal.style.display = 'none';
      } catch (err) {
        if (authFeedback) {
          authFeedback.textContent = err.message;
          authFeedback.style.display = 'block';
          authFeedback.style.background = 'rgba(239, 68, 68, 0.12)';
          authFeedback.style.color = '#ef4444';
          authFeedback.style.border = '1px solid rgba(239, 68, 68, 0.3)';
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // Handle Register submission
  if (authFormRegister) {
    authFormRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value;
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;
      const submitBtn = authFormRegister.querySelector('button[type="submit"]');

      try {
        if (submitBtn) submitBtn.disabled = true;
        if (authFeedback) authFeedback.style.display = 'none';

        await auth.register(email, password, name);
        if (authModal) authModal.style.display = 'none';
      } catch (err) {
        if (authFeedback) {
          authFeedback.textContent = err.message;
          authFeedback.style.display = 'block';
          authFeedback.style.background = 'rgba(239, 68, 68, 0.12)';
          authFeedback.style.color = '#ef4444';
          authFeedback.style.border = '1px solid rgba(239, 68, 68, 0.3)';
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // Password visibility toggle (eye symbol)
  document.querySelectorAll('.btn-toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      const eyeIcon = btn.querySelector('.icon-eye');
      const eyeOffIcon = btn.querySelector('.icon-eye-off');
      const isPassword = input.type === 'password';

      input.type = isPassword ? 'text' : 'password';

      if (eyeIcon) eyeIcon.style.display = isPassword ? 'none' : 'block';
      if (eyeOffIcon) eyeOffIcon.style.display = isPassword ? 'block' : 'none';

      btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      btn.style.color = isPassword ? 'var(--accent)' : 'var(--text-muted)';
    });
  });
}
