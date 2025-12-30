/* ===================================
   CUSTOMER AUTHENTICATION HELPER
   Hometown Delivery - Frontend
   =================================== */

class CustomerAuth {
    constructor() {
        this.tokenKey = 'customerAuthToken';
        this.customerKey = 'customerData';
    }

    // Get stored token
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    // Set token
    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    // Remove token
    removeToken() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.customerKey);
        localStorage.removeItem('emailVerified');
    }

    // Get customer data
    getCustomer() {
        const data = localStorage.getItem(this.customerKey);
        return data ? JSON.parse(data) : null;
    }

    // Set customer data
    setCustomer(customer) {
        localStorage.setItem(this.customerKey, JSON.stringify(customer));
    }

    // Check if logged in
    isLoggedIn() {
        return !!this.getToken();
    }

    // Register new customer
    async register(name, email, password, phone) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/customer-auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password, phone })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            // Store token and customer data
            this.setToken(data.token);
            this.setCustomer(data.customer);
            
            // Store email verification status (false for new registrations)
            localStorage.setItem('emailVerified', 'false');

            return data;
        } catch (error) {
            throw error;
        }
    }

    // Login customer
    async login(email, password) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/customer-auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Store token and customer data
            this.setToken(data.token);
            this.setCustomer(data.customer);

            // Store email verification status
            if (data.emailVerified !== undefined) {
                localStorage.setItem('emailVerified', data.emailVerified.toString());
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    // Logout customer
    async logout() {
        try {
            const token = this.getToken();
            if (token) {
                await fetch(`${API_CONFIG.BASE_URL}/customer-auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always clear local data
            this.removeToken();
            window.location.href = '/index.html';
        }
    }

    // Get customer profile
    async getProfile() {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}/customer-auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch profile');
            }

            // Update stored customer data
            this.setCustomer(data.customer);
            
            // Update email verification status from profile
            if (data.customer.isEmailVerified !== undefined) {
                localStorage.setItem('emailVerified', data.customer.isEmailVerified.toString());
            }

            return data.customer;
        } catch (error) {
            throw error;
        }
    }

    // Update customer profile
    async updateProfile(updates) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}/customer-auth/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update profile');
            }

            // Update stored customer data
            this.setCustomer(data.customer);

            return data.customer;
        } catch (error) {
            throw error;
        }
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}/customer-auth/change-password`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to change password');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    // Verify token is still valid
    async verifyToken() {
        try {
            const token = this.getToken();
            if (!token) {
                return false;
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}/customer-auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                this.removeToken();
                return false;
            }

            const data = await response.json();
            this.setCustomer(data.customer);
            return true;
        } catch (error) {
            this.removeToken();
            return false;
        }
    }

    // Require authentication (redirect to login if not logged in)
    requireAuth(redirectUrl = '/customer-login.html') {
        if (!this.isLoggedIn()) {
            // Store the intended destination
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    // Get redirect URL after login
    getRedirectUrl() {
        const redirect = sessionStorage.getItem('redirectAfterLogin');
        sessionStorage.removeItem('redirectAfterLogin');
        return redirect || '/index.html';
    }

    // Check if email is verified
    isEmailVerified() {
        // First check localStorage
        const verified = localStorage.getItem('emailVerified');
        console.log('isEmailVerified check:', { verified });
        
        if (verified !== null) {
            console.log('Using localStorage value:', verified);
            return verified === 'true';
        }
        
        // Fallback: check customer data
        const customer = this.getCustomer();
        console.log('No localStorage, checking customer data:', customer);
        
        if (customer && customer.isEmailVerified !== undefined) {
            // Update localStorage for next time
            localStorage.setItem('emailVerified', customer.isEmailVerified.toString());
            console.log('Using customer.isEmailVerified:', customer.isEmailVerified);
            return customer.isEmailVerified;
        }
        
        // Default to false if not found
        console.log('No verification data found, defaulting to false');
        return false;
    }

    // Resend verification email
    async resendVerification() {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}/customer-auth/resend-verification`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to resend verification email');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }
}

// Create global instance
const customerAuth = new CustomerAuth();
