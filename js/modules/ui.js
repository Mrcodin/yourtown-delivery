/* ===================================
   UI MODULE
   Handles UI interactions and accessibility
   =================================== */

// Toast notifications
function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Show error message
function showError(message) {
    showToast(message, 'error');
}

// Accessibility
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

// Mobile menu
function toggleMobileMenu() {
    const nav = document.getElementById('main-nav');
    if (nav) {
        nav.classList.toggle('active');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showToast,
        showError,
        toggleLargeText,
        toggleContrast,
        speakPage,
        toggleMobileMenu,
    };
}
