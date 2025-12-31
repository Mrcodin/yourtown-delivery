/**
 * Enhanced Form Validation Manager
 * Provides live validation feedback and helpful error messages
 */

class FormValidator {
    constructor(formElement, options = {}) {
        this.form = formElement;
        this.options = {
            validateOnInput: true,
            validateOnBlur: true,
            showPasswordStrength: true,
            showRequirements: true,
            ...options
        };
        this.validators = {};
        this.init();
    }

    init() {
        // Add validation icons and message containers to form groups
        this.form.querySelectorAll('.form-group').forEach(group => {
            const input = group.querySelector('input, textarea, select');
            if (!input) return;

            // Add validation icon if not exists
            if (!group.querySelector('.validation-icon')) {
                const icon = document.createElement('span');
                icon.className = 'validation-icon';
                icon.setAttribute('aria-hidden', 'true');
                group.appendChild(icon);
            }

            // Add validation message if not exists
            if (!group.querySelector('.validation-message')) {
                const message = document.createElement('span');
                message.className = 'validation-message';
                message.setAttribute('role', 'alert');
                message.setAttribute('aria-live', 'polite');
                group.appendChild(message);
            }

            // Set up event listeners
            if (this.options.validateOnInput) {
                input.addEventListener('input', () => this.validateField(input));
            }
            if (this.options.validateOnBlur) {
                input.addEventListener('blur', () => this.validateField(input));
            }

            // Password strength meter
            if (input.type === 'password' && input.id === 'password' && this.options.showPasswordStrength) {
                this.addPasswordStrengthMeter(group, input);
            }
        });

        // Form submit validation
        this.form.addEventListener('submit', (e) => {
            if (!this.validateForm()) {
                e.preventDefault();
                this.focusFirstError();
            }
        });
    }

    // Add custom validator for a field
    addValidator(fieldName, validatorFn, errorMessage) {
        if (!this.validators[fieldName]) {
            this.validators[fieldName] = [];
        }
        this.validators[fieldName].push({ fn: validatorFn, message: errorMessage });
    }

    // Validate single field
    validateField(input) {
        const group = input.closest('.form-group');
        if (!group) return true;

        const message = group.querySelector('.validation-message');
        const value = input.value.trim();
        const type = input.type;
        const required = input.hasAttribute('required');

        // Clear previous state
        group.classList.remove('valid', 'invalid', 'warning', 'validating');
        if (message) message.textContent = '';

        // Don't validate empty optional fields
        if (!required && !value) {
            return true;
        }

        // Check required
        if (required && !value) {
            this.setInvalid(group, 'This field is required');
            return false;
        }

        // Custom validators
        if (this.validators[input.name]) {
            for (const validator of this.validators[input.name]) {
                if (!validator.fn(value, input)) {
                    this.setInvalid(group, validator.message);
                    return false;
                }
            }
        }

        // Built-in validators
        let isValid = true;
        let errorMsg = '';

        switch (type) {
            case 'email':
                if (!this.isValidEmail(value)) {
                    errorMsg = 'Please enter a valid email address';
                    isValid = false;
                } else {
                    this.checkEmailTypo(value, group);
                }
                break;

            case 'tel':
                if (!this.isValidPhone(value)) {
                    errorMsg = 'Please enter a valid phone number';
                    isValid = false;
                }
                break;

            case 'password':
                const strength = this.getPasswordStrength(value);
                if (input.id === 'password' && strength === 'weak') {
                    this.setWarning(group, 'Consider using a stronger password');
                    return true; // Don't block, just warn
                }
                break;

            case 'text':
                // Name validation
                if (input.name === 'name' || input.id === 'name') {
                    if (value.length < 2) {
                        errorMsg = 'Name must be at least 2 characters';
                        isValid = false;
                    }
                }
                // Zip code validation
                if (input.name === 'zipCode' || input.id === 'zipCode') {
                    if (!this.isValidZipCode(value)) {
                        errorMsg = 'Please enter a valid ZIP code';
                        isValid = false;
                    }
                }
                break;
        }

        // Check min/max length
        if (input.minLength && value.length < input.minLength) {
            errorMsg = `Must be at least ${input.minLength} characters`;
            isValid = false;
        }
        if (input.maxLength && value.length > input.maxLength) {
            errorMsg = `Must be no more than ${input.maxLength} characters`;
            isValid = false;
        }

        // Check pattern
        if (input.pattern && !new RegExp(input.pattern).test(value)) {
            errorMsg = input.getAttribute('title') || 'Invalid format';
            isValid = false;
        }

        if (isValid) {
            this.setValid(group, 'Looks good!');
        } else {
            this.setInvalid(group, errorMsg);
        }

        return isValid;
    }

    // Validate entire form
    validateForm() {
        let isValid = true;
        const inputs = this.form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    // Email validation
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Phone validation (flexible format)
    isValidPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10;
    }

    // ZIP code validation
    isValidZipCode(zip) {
        return /^\d{5}(-\d{4})?$/.test(zip);
    }

    // Password strength calculator
    getPasswordStrength(password) {
        let strength = 0;
        
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        if (strength <= 2) return 'weak';
        if (strength <= 4) return 'medium';
        return 'strong';
    }

    // Add password strength meter
    addPasswordStrengthMeter(group, input) {
        const meter = document.createElement('div');
        meter.className = 'password-strength';
        meter.innerHTML = `
            <div class="password-strength-bar"></div>
            <div class="password-strength-text"></div>
        `;
        group.appendChild(meter);

        input.addEventListener('input', () => {
            const value = input.value;
            const text = meter.querySelector('.password-strength-text');
            
            if (!value) {
                meter.classList.remove('active');
                return;
            }

            meter.classList.add('active');
            const strength = this.getPasswordStrength(value);
            meter.setAttribute('data-strength', strength);
            
            const messages = {
                weak: '⚠️ Weak password - consider adding more characters',
                medium: '💪 Medium strength - good!',
                strong: '🔒 Strong password - excellent!'
            };
            text.textContent = messages[strength];
        });
    }

    // Check for common email typos
    checkEmailTypo(email, group) {
        const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
        const parts = email.split('@');
        if (parts.length !== 2) return;

        const [, domain] = parts;
        const suggestion = this.findClosestDomain(domain, commonDomains);

        if (suggestion && suggestion !== domain) {
            const existingSuggestion = group.querySelector('.email-suggestion');
            if (existingSuggestion) {
                existingSuggestion.remove();
            }

            const suggestionEl = document.createElement('div');
            suggestionEl.className = 'email-suggestion';
            suggestionEl.innerHTML = `Did you mean <strong>${parts[0]}@${suggestion}</strong>?`;
            suggestionEl.onclick = () => {
                const input = group.querySelector('input');
                input.value = `${parts[0]}@${suggestion}`;
                suggestionEl.remove();
                this.validateField(input);
            };
            group.appendChild(suggestionEl);
        }
    }

    // Find closest domain match
    findClosestDomain(domain, domains) {
        let minDistance = Infinity;
        let closest = null;

        domains.forEach(d => {
            const distance = this.levenshteinDistance(domain.toLowerCase(), d.toLowerCase());
            if (distance < minDistance && distance <= 2) {
                minDistance = distance;
                closest = d;
            }
        });

        return closest;
    }

    // Levenshtein distance algorithm
    levenshteinDistance(a, b) {
        const matrix = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    // Set field state
    setValid(group, message) {
        group.classList.remove('invalid', 'warning', 'validating');
        group.classList.add('valid');
        const messageEl = group.querySelector('.validation-message');
        if (messageEl) messageEl.textContent = message;
    }

    setInvalid(group, message) {
        group.classList.remove('valid', 'warning', 'validating');
        group.classList.add('invalid');
        const messageEl = group.querySelector('.validation-message');
        if (messageEl) messageEl.textContent = message;
    }

    setWarning(group, message) {
        group.classList.remove('valid', 'invalid', 'validating');
        group.classList.add('warning');
        const messageEl = group.querySelector('.validation-message');
        if (messageEl) messageEl.textContent = message;
    }

    // Focus first error field
    focusFirstError() {
        const firstError = this.form.querySelector('.form-group.invalid input, .form-group.invalid textarea, .form-group.invalid select');
        if (firstError) {
            firstError.focus();
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Reset form validation
    reset() {
        this.form.querySelectorAll('.form-group').forEach(group => {
            group.classList.remove('valid', 'invalid', 'warning', 'validating');
            const message = group.querySelector('.validation-message');
            if (message) message.textContent = '';
        });
    }
}

// Auto-initialize forms with data-validate attribute
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('form[data-validate]').forEach(form => {
        new FormValidator(form);
    });
});

// Make it globally available
window.FormValidator = FormValidator;
