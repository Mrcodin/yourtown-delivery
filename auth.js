/* ===================================
   AUTHENTICATION MODULE
   Hometown Delivery Admin
   =================================== */

const Auth = {
    // ============ CONFIGURATION ============
    SESSION_KEY: 'adminSession',
    ACTIVITIES_KEY: 'adminActivities',
    SESSION_DURATION: 8 * 60 * 60 * 1000, // 8 hours
    
    // ============ SESSION MANAGEMENT ============
    
    /**
     * Check if user is logged in with valid session
     */
    isLoggedIn: function() {
        const session = this.getSession();
        if (!session) return false;
        
        // Check if session expired
        if (Date.now() > session.expiresAt) {
            this.logout();
            return false;
        }
        
        return true;
    },
    
    /**
     * Get current session data
     */
    getSession: function() {
        const sessionData = localStorage.getItem(this.SESSION_KEY);
        if (!sessionData) return null;
        
        try {
            return JSON.parse(sessionData);
        } catch (e) {
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
     * Logout and clear session
     */
    logout: function() {
        const session = this.getSession();
        if (session) {
            this.logActivity('logout', `${session.name} logged out`);
        }
        
        localStorage.removeItem(this.SESSION_KEY);
        window.location.href = 'admin-login.html';
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
    requireLogin: function() {
        if (!this.isLoggedIn()) {
            // Save intended destination
            localStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'admin-login.html';
            return false;
        }
        return true;
    },
    
    /**
     * Require specific role
     */
    requireRole: function(role) {
        if (!this.requireLogin()) return false;
        
        if (!this.hasRole(role)) {
            alert('You do not have permission to access this page.');
            window.location.href = 'admin.html';
            return false;
        }
        
        return true;
    },
    
    // ============ ACTIVITY LOGGING ============
    
    /**
     * Log admin activity
     */
    logActivity: function(type, message) {
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
    },
    
    /**
     * Get activity log
     */
    getActivities: function(limit = 50) {
        const activities = JSON.parse(localStorage.getItem(this.ACTIVITIES_KEY) || '[]');
        return activities.slice(0, limit);
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
            el.textContent = user.name;
        });
        
        // Update role badges
        document.querySelectorAll('.user-role').forEach(el => {
            el.textContent = user.role;
        });
        
        // Update avatar initials
        document.querySelectorAll('.user-avatar-initials').forEach(el => {
            el.textContent = this.getInitials(user.name);
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

document.addEventListener('DOMContentLoaded', function() {
    // Skip auth check on login page
    if (window.location.pathname.includes('admin-login.html')) {
        return;
    }
    
    // Skip auth check on non-admin pages
    if (!window.location.pathname.includes('admin')) {
        return;
    }
    
    // Require login for all admin pages
    if (!Auth.requireLogin()) {
        return;
    }
    
    // Update UI with user info
    Auth.updateUserUI();
    
    // Extend session on activity
    document.addEventListener('click', () => Auth.extendSession());
    document.addEventListener('keypress', () => Auth.extendSession());
    
    // Check session every minute
    setInterval(() => {
        if (!Auth.isLoggedIn()) {
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
