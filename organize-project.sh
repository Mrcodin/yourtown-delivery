#!/bin/bash
##############################################################################
# PROJECT ORGANIZATION SCRIPT
# Cleans up and organizes the Yourtown Delivery project for production
##############################################################################

echo "🧹 Organizing Yourtown Delivery Project..."
echo "=========================================="
echo ""

cd /workspaces/yourtown-delivery

# Create directory structure
mkdir -p docs/{setup,guides,api,performance,archive}
mkdir -p test-files

# Move setup/configuration guides
echo "📁 Moving setup guides..."
mv CDN_SETUP_GUIDE.md docs/setup/ 2>/dev/null
mv EMAIL_SETUP_GUIDE.md docs/setup/ 2>/dev/null  
mv STRIPE_SETUP_GUIDE.md docs/setup/ 2>/dev/null
mv CLOUDINARY_SETUP.md docs/setup/ 2>/dev/null
mv DEPLOYMENT_GUIDE.md docs/setup/ 2>/dev/null
mv RENDER_DEPLOYMENT.md docs/setup/ 2>/dev/null

# Move API documentation
echo "📁 Moving API docs..."
mv API_INTEGRATION_COMPLETE.md docs/api/ 2>/dev/null
mv ADMIN_API_INTEGRATION.md docs/api/ 2>/dev/null
mv FRONTEND_INTEGRATION_GUIDE.md docs/api/ 2>/dev/null
mv SWAGGER_COMPLETE.md docs/api/ 2>/dev/null

# Move general guides
echo "📁 Moving general guides..."
mv CUSTOMIZATION_GUIDE.md docs/guides/ 2>/dev/null
mv FEATURE_GUIDE.md docs/guides/ 2>/dev/null
mv SECURITY_GUIDE.md docs/guides/ 2>/dev/null
mv SECURITY_QUICK_REF.md docs/guides/ 2>/dev/null
mv EMAIL_QUICK_REFERENCE.md docs/guides/ 2>/dev/null
mv QUICK_START.md docs/guides/ 2>/dev/null
mv TROUBLESHOOTING.md docs/guides/ 2>/dev/null
mv TESTING_GUIDE.md docs/guides/ 2>/dev/null

# Move completion/implementation docs to archive
echo "📁 Archiving completion docs..."
mv CUSTOMER_ACCOUNT_COMPLETE.md docs/archive/ 2>/dev/null
mv DRIVER_SYSTEM_COMPLETE.md docs/archive/ 2>/dev/null
mv EMAIL_NOTIFICATIONS_COMPLETE.md docs/archive/ 2>/dev/null
mv EMAIL_VERIFICATION_PASSWORD_RESET_COMPLETE.md docs/archive/ 2>/dev/null
mv LOADING_STATES_COMPLETE.md docs/archive/ 2>/dev/null
mv ORDER_MANAGEMENT_COMPLETE.md docs/archive/ 2>/dev/null
mv STRIPE_INTEGRATION_COMPLETE.md docs/archive/ 2>/dev/null
mv CODE_SPLITTING_COMPLETE.md docs/archive/ 2>/dev/null
mv ANALYTICS_COMPLETE.md docs/archive/ 2>/dev/null
mv COMPLETE.md docs/archive/ 2>/dev/null
mv IMPLEMENTATION_SUMMARY.md docs/archive/ 2>/dev/null

# Move fix/update logs to archive
echo "📁 Archiving fix logs..."
mv CHECKOUT_BUG_FIX.md docs/archive/ 2>/dev/null
mv PROMO_CODE_FIX.md docs/archive/ 2>/dev/null
mv PROMO_CODE_IMPLEMENTATION.md docs/archive/ 2>/dev/null
mv TAX_IMPLEMENTATION.md docs/archive/ 2>/dev/null
mv SECURITY_UPDATE.md docs/archive/ 2>/dev/null
mv MODULE_MIGRATION.md docs/archive/ 2>/dev/null
mv UI_UX_IMPROVEMENTS.md docs/archive/ 2>/dev/null
mv SESSION_SUMMARY_*.md docs/archive/ 2>/dev/null
mv RECENT_*.md docs/archive/ 2>/dev/null
mv REVIEW_AND_RECOMMENDATIONS.md docs/archive/ 2>/dev/null
mv TEST_*.md docs/archive/ 2>/dev/null
mv ANALYTICS_TEST_RESULTS.md docs/archive/ 2>/dev/null

# Test files are already moved
echo "✅ Test files already in test-files/"

# Clean up empty or redundant files
echo "🗑️  Cleaning up..."
rm -f nohup.out 2>/dev/null
rm -f PROJECT_README.md 2>/dev/null  # Duplicate of README.md

# Remove old demo/test HTML files
mv toast-demo.html test-files/ 2>/dev/null
mv dev-tools.html test-files/ 2>/dev/null
mv clear-cache.html test-files/ 2>/dev/null
mv order-receipt.html test-files/ 2>/dev/null  # If not used in production

echo ""
echo "✅ Organization complete!"
echo ""
echo "📊 Summary:"
echo "  - docs/setup/        Setup & deployment guides"
echo "  - docs/api/          API documentation"  
echo "  - docs/guides/       User & developer guides"
echo "  - docs/performance/  Performance optimization docs"
echo "  - docs/archive/      Historical completion logs"
echo "  - test-files/        Test files and debug tools"
echo ""
