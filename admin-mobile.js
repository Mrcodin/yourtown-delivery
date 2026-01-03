/* ===================================
   ADMIN MOBILE ENHANCEMENTS
   Hometown Delivery
   =================================== */

// Handle table scroll indicators
document.addEventListener('DOMContentLoaded', () => {
    const tables = document.querySelectorAll('.table-container');

    tables.forEach(table => {
        table.addEventListener('scroll', () => {
            if (table.scrollLeft > 10) {
                table.classList.add('scrolled');
            } else {
                table.classList.remove('scrolled');
            }
        });
    });
});

// Mobile-friendly stat cards - make them tappable
if (window.innerWidth <= 768) {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.style.minHeight = '100px';
    });
}

// Touch-friendly buttons - increase tap target size
if ('ontouchstart' in window) {
    const smallButtons = document.querySelectorAll('.table-btn, .btn-icon');
    smallButtons.forEach(btn => {
        if (btn.offsetHeight < 44) {
            btn.style.minHeight = '44px';
            btn.style.minWidth = '44px';
            btn.style.display = 'inline-flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';
        }
    });
}

// Sidebar toggle for mobile
const createMobileMenuToggle = () => {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('admin-sidebar');
        const mainContent = document.querySelector('.admin-main');

        if (sidebar && !document.getElementById('mobile-sidebar-toggle')) {
            // Create toggle button
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'mobile-sidebar-toggle';
            toggleBtn.className = 'mobile-sidebar-toggle';
            toggleBtn.innerHTML = '☰';
            toggleBtn.setAttribute('aria-label', 'Toggle Menu');

            // Insert at top of main content
            if (mainContent) {
                mainContent.insertBefore(toggleBtn, mainContent.firstChild);
            }

            // Toggle functionality
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                toggleBtn.classList.toggle('active');
            });

            // Close on outside click
            document.addEventListener('click', e => {
                if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                    sidebar.classList.remove('active');
                    toggleBtn.classList.remove('active');
                }
            });
        }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', createMobileMenuToggle);
