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

Correct Script Loading Order
Make sure your admin pages load scripts in this order:

html
<head>
    <!-- ... other head content ... -->
</head>
<body>
    <!-- ... page content ... -->
    
    <!-- Scripts in correct order -->
    <script src="main.js"></script>
    <script src="auth.js"></script>
    <script src="admin.js"></script>
</body>
