🔑 Default Credentials
Role	Username	Password
Admin	admin	hometown123
Manager	manager	manager456
Driver	driver	driver789
📋 How to Add Auth to New Admin Pages
Add auth.js to the head:
html
<script src="auth.js"></script>
For role-restricted pages, add this at the start of your page script:
javascript
document.addEventListener('DOMContentLoaded', function() {
    // Require manager role or higher
    if (!Auth.requireRole('manager')) return;
    
    // Your page initialization code...
});
