#!/bin/bash

# Clear Service Worker and Cache - One-time fix
# Run this if you're still seeing cached content

echo "🧹 Clearing service worker and caches..."
echo ""

# Create a simple HTML page to clear everything
cat > /tmp/clear-cache.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Cache Clearer</title>
</head>
<body>
    <h1>Clearing Cache...</h1>
    <div id="status"></div>
    
    <script>
        const status = document.getElementById('status');
        
        async function clearEverything() {
            status.innerHTML = '<p>🔄 Starting cleanup...</p>';
            
            // Unregister service workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                status.innerHTML += `<p>📋 Found ${registrations.length} service worker(s)</p>`;
                
                for (let registration of registrations) {
                    await registration.unregister();
                    status.innerHTML += `<p>✅ Unregistered: ${registration.scope}</p>`;
                }
            }
            
            // Clear all caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                status.innerHTML += `<p>📋 Found ${cacheNames.length} cache(s)</p>`;
                
                for (let name of cacheNames) {
                    await caches.delete(name);
                    status.innerHTML += `<p>✅ Deleted cache: ${name}</p>`;
                }
            }
            
            // Clear localStorage
            localStorage.clear();
            status.innerHTML += '<p>✅ Cleared localStorage</p>';
            
            // Clear sessionStorage
            sessionStorage.clear();
            status.innerHTML += '<p>✅ Cleared sessionStorage</p>';
            
            status.innerHTML += '<p style="color: green; font-weight: bold; margin-top: 20px;">✨ All caches cleared!</p>';
            status.innerHTML += '<p>Close this tab and go back to your site</p>';
            status.innerHTML += '<p>Regular F5 refresh should now work</p>';
        }
        
        clearEverything().catch(err => {
            status.innerHTML += `<p style="color: red;">❌ Error: ${err.message}</p>`;
        });
    </script>
</body>
</html>
EOF

# Copy to public directory
cp /tmp/clear-cache.html /workspaces/yourtown-delivery/clear-cache.html

echo "✅ Created cache clearer page"
echo ""
echo "📋 Open this URL in your browser:"
echo "   http://localhost:3000/clear-cache.html"
echo ""
echo "🔧 This will:"
echo "   - Unregister all service workers"
echo "   - Delete all caches"
echo "   - Clear localStorage"
echo "   - Clear sessionStorage"
echo ""
echo "💡 After running:"
echo "   1. Close the clear-cache tab"
echo "   2. Go back to shop.html"
echo "   3. Do ONE Ctrl+Shift+R"
echo "   4. You should see the purple DEV MODE badge"
echo "   5. After that, regular F5 will work!"
