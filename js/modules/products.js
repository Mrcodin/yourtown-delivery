/* ===================================
   PRODUCTS MODULE
   Handles product loading and display
   =================================== */

// Product data
let groceries = [];
let USUAL_ORDER_IDS = [];

// Load products from API
async function loadProducts() {
    const gridContainer = document.getElementById('grocery-grid');
    const emptyState = document.getElementById('empty-state');

    // Show skeleton loading if on shop page
    if (gridContainer) {
        loading.showSkeleton(gridContainer, 'product', 6);
    }

    try {
        const response = await api.getProducts({ showLoading: false });

        if (response.success && response.products) {
            groceries = response.products.map(p => ({
                id: p._id,
                name: p.name,
                price: p.price,
                category: p.category,
                emoji: p.emoji || '📦',
                imageUrl: p.imageUrl || null,
                isTaxable: p.isTaxable || false,
            }));

            USUAL_ORDER_IDS = groceries.slice(0, 6).map(p => p.id);

            if (gridContainer) {
                if (groceries.length === 0) {
                    gridContainer.innerHTML = '';
                    emptyState && emptyState.removeAttribute('style');
                } else {
                    emptyState && (emptyState.style.display = 'none');
                    renderGroceryGrid();
                }
            }
        } else {
            console.error('Failed to load products:', response);
            if (gridContainer) {
                gridContainer.innerHTML = '';
            }
            message.showError(
                'Unable to load products from the server. Please refresh the page to try again.',
                'Failed to Load Products',
                gridContainer
            );
        }
    } catch (error) {
        console.error('Error loading products:', error);
        if (gridContainer) {
            gridContainer.innerHTML = '';
        }
        message.showError(message.getUserFriendlyError(error), 'Connection Error', gridContainer);
    }
}

// Render product grid
function renderGroceryGrid(items = groceries) {
    const grid = document.getElementById('grocery-grid');
    const emptyState = document.getElementById('empty-state');
    const resultsInfo = document.getElementById('results-count');

    if (!grid) return;

    if (items.length === 0) {
        grid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    if (resultsInfo) {
        resultsInfo.textContent = `Showing ${items.length} item${items.length !== 1 ? 's' : ''}`;
    }

    grid.innerHTML = items
        .map(item => {
            const imageHtml = item.imageUrl
                ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">`
                : item.emoji;

            return `
        <div class="grocery-item" data-category="${item.category}">
            <div class="item-image" onclick="openQuickView('${item.id}')" style="cursor: pointer;">${imageHtml}</div>
            <div class="item-content">
                <h3 class="item-name">${item.name}</h3>
                <div class="item-price">$${item.price.toFixed(2)}</div>
                <div style="display: flex; gap: 8px;">
                    <button class="add-btn" onclick="addToCart('${item.id}')" style="flex: 1;">
                        Add to Cart
                    </button>
                    <button class="btn btn-secondary" onclick="openQuickView('${item.id}')" style="padding: 12px; width: 44px;" title="Quick View">
                        👁️
                    </button>
                </div>
            </div>
        </div>
        `;
        })
        .join('');
}

// Quick View Modal
function openQuickView(itemId) {
    try {
        const item = groceries.find(g => g.id === itemId);
        if (!item) {
            console.error('Product not found:', itemId);
            return;
        }

        const modal = document.getElementById('quick-view-modal');
        if (!modal) {
            console.error('Quick view modal not found.');
            showToast('⚠️ Quick view not available on this page', 'error');
            return;
        }

        const imageHtml = item.imageUrl
            ? `<img src="${item.imageUrl}" alt="${item.name}">`
            : item.emoji;

        document.getElementById('qv-image').innerHTML = imageHtml;
        document.getElementById('qv-name').textContent = item.name;
        document.getElementById('qv-price').textContent = `$${item.price.toFixed(2)}`;
        document.getElementById('qv-category').textContent = item.category;
        document.getElementById('qv-quantity').value = 1;

        const addBtn = document.getElementById('qv-add-btn');
        addBtn.onclick = () => {
            const quantity = parseInt(document.getElementById('qv-quantity').value);
            for (let i = 0; i < quantity; i++) {
                addToCart(itemId);
            }
            closeQuickView();
            showToast(`✅ Added ${quantity} ${item.name} to cart!`, 'success');
        };

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        const escHandler = e => {
            if (e.key === 'Escape') {
                closeQuickView();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        modal.onclick = e => {
            if (e.target === modal) {
                closeQuickView();
            }
        };
    } catch (error) {
        console.error('Error opening quick view:', error);
        showToast('⚠️ Unable to open quick view', 'error');
        document.body.style.overflow = 'auto';
    }
}

function closeQuickView() {
    const modal = document.getElementById('quick-view-modal');
    if (modal) {
        modal.classList.remove('active');
    }
    document.body.style.overflow = 'auto';
}

function adjustQvQuantity(delta) {
    const input = document.getElementById('qv-quantity');
    const current = parseInt(input.value);
    const newValue = Math.max(1, Math.min(99, current + delta));
    input.value = newValue;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { groceries, loadProducts, renderGroceryGrid, openQuickView, closeQuickView };
}
