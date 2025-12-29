/* ===================================
   AUTHENTICATION MODULE - FIXED
   Hometown Delivery Admin
   =================================== */

const Auth = {
    // ============ CONFIGURATION ============
    SESSION_KEY: 'adminSession',
    ACTIVITIES_KEY: 'adminActivities',
    REMEMBERED_USER_KEY: 'rememberedUser',
    SESSION_DURATION: 8 * 60 * 60 * 1000, // 8 hours
    
    // ============ SESSION MANAGEMENT ============
    
    /**
     * Check if user is logged in with valid session
     */
    isLoggedIn: async function() {
        const token = api.getToken();
        
        // No token exists
        if (!token) {
            // console.log('Auth: No token found');
            return false;
        }
        
        try {
            // Verify token with API
            const response = await api.verifyToken();
            
            if (response.success && response.user) {
                // console.log('Auth: Valid token for', response.user.username);
                return true;
            } else {
                // console.log('Auth: Token verification failed');
                this.clearSession();
                return false;
            }
        } catch (error) {
            console.error('Auth: Error verifying token', error);
            this.clearSession();
            return false;
        }
    },
    
    /**
     * Get current session data
     */
    getSession: function() {
        try {
            const sessionData = localStorage.getItem(this.SESSION_KEY);
            if (!sessionData) return null;
            return JSON.parse(sessionData);
        } catch (e) {
            console.error('Auth: Error parsing session', e);
            return null;
        }
    },
    
    /**
     * Get current user info
     */
    getCurrentUser: function() {
        const session = this.getSession();
        if (!session) return null;
        
        return {
            username: session.username,
            name: session.name,
            role: session.role
        };
    },
    
    /**
     * Clear all session data - FIXED
     */
    clearSession: function() {
        // console.log('Auth: Clearing session');
        localStorage.removeItem(this.SESSION_KEY);
        api.clearToken(); // Clear API token
        // Don't clear rememberedUser - that's for convenience
    },
    
    /**
     * Full logout - clears everything and redirects
     */
    logout: async function() {
        // Log activity before clearing session
        const session = this.getSession();
        if (session) {
            this.logActivity('logout', `${session.name || session.username} logged out`);
        }
        
        try {
            // Call API logout
            await api.logout();
        } catch (error) {
            console.error('Auth: Logout API error', error);
        }
        
        // Clear the session
        this.clearSession();
        
        // console.log('Auth: Logout complete, redirecting to login');
        
        // Force redirect to login page
        window.location.replace('admin-login.html');
    },
    
    /**
     * Extend session (for activity)
     */
    extendSession: function() {
        const session = this.getSession();
        if (session) {
            session.expiresAt = Date.now() + this.SESSION_DURATION;
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        }
    },
    
    // ============ AUTHORIZATION ============
    
    /**
     * Check if user has required role
     */
    hasRole: function(requiredRole) {
        const session = this.getSession();
        if (!session) return false;
        
        const roleHierarchy = {
            'admin': 3,
            'manager': 2,
            'driver': 1
        };
        
        const userLevel = roleHierarchy[session.role] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;
        
        return userLevel >= requiredLevel;
    },
    
    /**
     * Require login - redirect if not logged in
     */
    requireLogin: async function() {
        const loggedIn = await this.isLoggedIn();
        if (!loggedIn) {
            // console.log('Auth: Login required, redirecting');
            // Save intended destination
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.replace('admin-login.html');
            return false;
        }
        return true;
    },
    
    /**
     * Require specific role
     */
    requireRole: async function(role) {
        const loginCheck = await this.requireLogin();
        if (!loginCheck) return false;
        
        if (!this.hasRole(role)) {
            alert('You do not have permission to access this page.');
            window.location.replace('admin.html');
            return false;
        }
        
        return true;
    },
    
    // ============ ACTIVITY LOGGING ============
    
    /**
     * Log admin activity
     */
    logActivity: function(type, message) {
        try {
            const activities = JSON.parse(localStorage.getItem(this.ACTIVITIES_KEY) || '[]');
            const session = this.getSession();
            
            activities.unshift({
                type: type,
                message: message,
                user: session?.username || 'unknown',
                timestamp: Date.now()
            });
            
            // Keep last 100 activities
            if (activities.length > 100) {
                activities.length = 100;
            }
            
            localStorage.setItem(this.ACTIVITIES_KEY, JSON.stringify(activities));
        } catch (e) {
            console.error('Auth: Error logging activity', e);
        }
    },
    
    /**
     * Get activity log
     */
    getActivities: function(limit = 50) {
        try {
            const activities = JSON.parse(localStorage.getItem(this.ACTIVITIES_KEY) || '[]');
            return activities.slice(0, limit);
        } catch (e) {
            return [];
        }
    },
    
    // ============ UI HELPERS ============
    
    /**
     * Update UI with user info
     */
    updateUserUI: function() {
        const user = this.getCurrentUser();
        if (!user) return;
        
        // Update user name displays
        document.querySelectorAll('.user-name').forEach(el => {
            el.textContent = user.name || user.username;
        });
        
        // Update role badges
        document.querySelectorAll('.user-role').forEach(el => {
            el.textContent = user.role;
        });
        
        // Update avatar initials
        document.querySelectorAll('.user-avatar-initials').forEach(el => {
            el.textContent = this.getInitials(user.name || user.username);
        });
    },
    
    /**
     * Get initials from name
     */
    getInitials: function(name) {
        if (!name) return '??';
        return name.split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }
};

// ============ AUTO-CHECK ON PAGE LOAD ============

document.addEventListener('DOMContentLoaded', async function() {
    const currentPage = window.location.pathname;
    
    // console.log('Auth: Page loaded -', currentPage);
    
    // Skip auth check on login page
    if (currentPage.includes('admin-login')) {
        // console.log('Auth: On login page, skipping auth check');
        return;
    }
    
    // Skip auth check on non-admin pages
    if (!currentPage.includes('admin')) {
        // console.log('Auth: Not an admin page, skipping auth check');
        return;
    }
    
    // Require login for all admin pages
    // console.log('Auth: Checking login status for admin page');
    const loginCheck = await Auth.requireLogin();
    if (!loginCheck) {
        return;
    }
    
    // Update UI with user info
    Auth.updateUserUI();
    
    // Extend session on activity
    let activityTimeout;
    const extendOnActivity = () => {
        clearTimeout(activityTimeout);
        activityTimeout = setTimeout(() => {
            Auth.extendSession();
        }, 1000);
    };
    
    document.addEventListener('click', extendOnActivity);
    document.addEventListener('keypress', extendOnActivity);
    document.addEventListener('scroll', extendOnActivity);
    
    // Check session every minute
    setInterval(async () => {
        const loggedIn = await Auth.isLoggedIn();
        if (!loggedIn) {
            alert('Your session has expired. Please login again.');
            Auth.logout();
        }
    }, 60000);
});

// ============ GLOBAL LOGOUT FUNCTION ============

function adminLogout() {
    if (confirm('Are you sure you want to logout?')) {
        Auth.logout();
    }
}
