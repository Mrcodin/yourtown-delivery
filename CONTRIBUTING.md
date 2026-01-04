# Contributing to Yourtown Delivery

Thank you for your interest in contributing to Yourtown Delivery! This document provides guidelines and information for contributors.

## 🎯 Ways to Contribute

- **Bug Reports**: Report bugs via GitHub Issues
- **Feature Requests**: Suggest new features or improvements
- **Code Contributions**: Submit pull requests for bug fixes or features
- **Documentation**: Improve or add documentation
- **Testing**: Help test new features and report issues

## 🚀 Getting Started

### 1. Fork & Clone
```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR-USERNAME/yourtown-delivery.git
cd yourtown-delivery
```

### 2. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 3. Set Up Development Environment
```bash
# Install backend dependencies
cd server
npm install

# Configure environment
cp .env.example .env
# Edit .env with development credentials

# Seed development database
npm run seed
```

### 4. Make Changes
- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation if needed

### 5. Test Your Changes
```bash
# Run backend tests
cd server
npm test

# Test API endpoints
curl http://localhost:3000/api/health

# Manual testing checklist:
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test on mobile (responsive)
- [ ] Test with slow network (throttling)
```

### 6. Commit Changes
```bash
git add .
git commit -m "feat: add your feature description"
# or
git commit -m "fix: fix your bug description"
```

**Commit Message Format:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### 7. Push & Create Pull Request
```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## 📝 Pull Request Guidelines

### PR Title Format
- Use clear, descriptive titles
- Start with type: `feat:`, `fix:`, `docs:`, etc.
- Example: `feat: add loyalty points system`

### PR Description
Include:
- **What**: What does this PR do?
- **Why**: Why is this change needed?
- **How**: How does it work?
- **Testing**: How was it tested?
- **Screenshots**: If UI changes, add before/after screenshots

### PR Checklist
- [ ] Code follows project style
- [ ] Changes are tested
- [ ] Documentation updated
- [ ] No console.log statements (unless intentional)
- [ ] No commented-out code
- [ ] Branch is up to date with main

## 🎨 Code Style Guidelines

### JavaScript
```javascript
// Use const/let, not var
const MAX_ITEMS = 100;
let currentCount = 0;

// Use arrow functions for callbacks
items.map(item => item.price);

// Use template literals
const message = `Hello, ${userName}!`;

// Add JSDoc comments for functions
/**
 * Calculate order total with tax
 * @param {Array} items - Cart items
 * @param {number} taxRate - Tax rate (0-1)
 * @returns {number} Total amount
 */
function calculateTotal(items, taxRate) {
    // Implementation
}
```

### HTML
```html
<!-- Use semantic HTML -->
<main>
    <section class="products">
        <article class="product-card">
            <!-- Content -->
        </article>
    </section>
</main>

<!-- Use descriptive class names -->
<button class="btn btn-primary btn-large">
    Add to Cart
</button>
```

### CSS
```css
/* Use CSS custom properties */
:root {
    --primary-color: #2563eb;
    --spacing-md: 1rem;
}

/* Use BEM-like naming */
.product-card {}
.product-card__title {}
.product-card__price {}
.product-card--featured {}

/* Group related properties */
.element {
    /* Positioning */
    position: relative;
    top: 0;
    left: 0;
    
    /* Box model */
    display: flex;
    width: 100%;
    padding: 1rem;
    
    /* Typography */
    font-size: 1rem;
    color: var(--text);
    
    /* Visual */
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

## 🧪 Testing Guidelines

### Manual Testing
1. Test all modified features
2. Test on multiple browsers
3. Test responsive design
4. Test with slow network
5. Test edge cases

### API Testing
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"test123"}'

# Test products endpoint
curl http://localhost:3000/api/products
```

## 📚 Documentation Guidelines

### Code Comments
```javascript
// Good: Explains WHY, not WHAT
// Calculate discount after 50% off promo code applied
const discount = price * 0.5;

// Bad: Explains obvious WHAT
// Multiply price by 0.5
const discount = price * 0.5;
```

### README Updates
- Update README.md if adding new features
- Update relevant documentation in docs/
- Keep documentation in sync with code

## 🐛 Bug Report Guidelines

When reporting bugs, include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**:
   ```
   1. Go to shop page
   2. Add item to cart
   3. Click checkout
   4. Error appears
   ```
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**:
   - Browser: Chrome 120
   - OS: Windows 11
   - Node version: 18.17.0
6. **Screenshots**: If applicable
7. **Console Errors**: Copy any error messages

## 💡 Feature Request Guidelines

When requesting features, include:

1. **Problem**: What problem does this solve?
2. **Solution**: Proposed solution
3. **Alternatives**: Other solutions considered
4. **Use Case**: Real-world scenario
5. **Priority**: How important is this?

## 🔍 Code Review Process

1. Maintainers review all PRs
2. Reviews focus on:
   - Code quality
   - Security
   - Performance
   - Documentation
   - Testing
3. Address review feedback
4. PR is merged after approval

## 🎓 Learning Resources

### Project-Specific
- [API Documentation](docs/api/API_INTEGRATION_COMPLETE.md)
- [Frontend Guide](docs/api/FRONTEND_INTEGRATION_GUIDE.md)
- [Security Guide](docs/guides/SECURITY_GUIDE.md)

### General
- [MDN Web Docs](https://developer.mozilla.org/)
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Socket.io Documentation](https://socket.io/docs/)

## 📧 Questions?

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and help
- **Email**: support@yourbusiness.com

## 📜 Code of Conduct

### Our Pledge
We pledge to make participation in our project a harassment-free experience for everyone.

### Our Standards
- Be respectful and inclusive
- Welcome newcomers
- Give constructive feedback
- Focus on what's best for the community

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or insulting comments
- Publishing others' private information
- Other unprofessional conduct

## 🙏 Thank You!

Your contributions make this project better. Thank you for taking the time to contribute!

---

**Questions about contributing?** Open an issue or discussion on GitHub!
