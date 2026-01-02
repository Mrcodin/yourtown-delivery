// ============================================
// UI-HELPERS.JS - UI Utilities
// ============================================
// Accessibility, mobile menu, toast notifications,
// and tip handling

// ============ ACCESSIBILITY ============

function toggleLargeText() {
    document.body.classList.toggle('large-text');
    const btn = document.getElementById('text-size-btn');
    if (btn) {
        btn.textContent = document.body.classList.contains('large-text') 
            ? '🔤 Normal Text' 
            : '🔤 Larger Text';
    }
    localStorage.setItem('largeText', document.body.classList.contains('large-text'));
}

function toggleContrast() {
    document.body.classList.toggle('high-contrast');
    localStorage.setItem('highContrast', document.body.classList.contains('high-contrast'));
}

function speakPage() {
    if (!('speechSynthesis' in window)) {
        showToast('Text-to-speech not supported in your browser', 'error');
        return;
    }
    
    speechSynthesis.cancel();
    
    const mainContent = document.querySelector('main') || document.body;
    const text = mainContent.innerText;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    speechSynthesis.speak(utterance);
    showToast('🔊 Reading page aloud...', 'success');
}

// ============ MOBILE MENU ============

function toggleMobileMenu() {
    const nav = document.getElementById('main-nav');
    if (nav) {
        nav.classList.toggle('active');
    }
}

// ============ TOAST NOTIFICATIONS ============

function showToast(message, type = 'success') {
    try {
        // Remove existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // Create new toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Hide toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    } catch (error) {
        if (typeof ErrorTracker !== 'undefined') {
            ErrorTracker.captureError(error, {
                context: 'UI',
                action: 'showToast',
                message: message
            });
        }
        console.error('Error showing toast:', error);
    }
}

// ============ TIP HANDLING ============

function selectTip(amount) {
    // Update custom tip input
    const customTipInput = document.getElementById('custom-tip');
    if (customTipInput) {
        customTipInput.value = amount;
    }
    
    // Update button states
    document.querySelectorAll('.tip-btn').forEach(btn => {
        if (parseInt(btn.dataset.tip) === amount) {
            btn.style.background = '#f59e0b';
            btn.style.color = 'white';
            btn.style.borderColor = '#d97706';
        } else {
            btn.style.background = 'white';
            btn.style.color = '#713f12';
            btn.style.borderColor = '#d97706';
        }
    });
    
    // Update tip display
    updateTipDisplay(amount);
    
    // Update order total
    if (typeof updateOrderSummary !== 'undefined') {
        updateOrderSummary();
    }
}

function selectCustomTip() {
    const customTipInput = document.getElementById('custom-tip');
    const amount = parseFloat(customTipInput.value) || 0;
    
    // Reset preset buttons
    document.querySelectorAll('.tip-btn').forEach(btn => {
        btn.style.background = 'white';
        btn.style.color = '#713f12';
        btn.style.borderColor = '#d97706';
    });
    
    // Update tip display
    updateTipDisplay(amount);
    
    // Update order total
    if (typeof updateOrderSummary !== 'undefined') {
        updateOrderSummary();
    }
}

function updateTipDisplay(amount) {
    const tipDisplay = document.getElementById('tip-display');
    const tipAmount = document.getElementById('selected-tip-amount');
    
    if (tipDisplay && tipAmount) {
        if (amount > 0) {
            tipAmount.textContent = amount.toFixed(2);
            tipDisplay.style.display = 'block';
        } else {
            tipDisplay.style.display = 'none';
        }
    }
}

// ============ INITIALIZATION ============

document.addEventListener('DOMContentLoaded', function() {
    // Load accessibility preferences
    if (localStorage.getItem('largeText') === 'true') {
        document.body.classList.add('large-text');
        const btn = document.getElementById('text-size-btn');
        if (btn) btn.textContent = '🔤 Normal Text';
    }
    
    if (localStorage.getItem('highContrast') === 'true') {
        document.body.classList.add('high-contrast');
    }
});

// ============ EXPORTS ============

// Expose functions globally for onclick handlers
window.toggleLargeText = toggleLargeText;
window.toggleContrast = toggleContrast;
window.speakPage = speakPage;
window.toggleMobileMenu = toggleMobileMenu;
window.showToast = showToast;
window.selectTip = selectTip;
window.selectCustomTip = selectCustomTip;
window.updateTipDisplay = updateTipDisplay;
