/* ===================================
   FILTERS MODULE
   Handles product filtering and search
   =================================== */

// Sort products
function sortProducts() {
    const sortValue = document.getElementById('sort-select')?.value;
    if (!sortValue) return;

    let sortedGroceries = [...groceries];

    switch (sortValue) {
        case 'name-asc':
            sortedGroceries.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            sortedGroceries.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'price-asc':
            sortedGroceries.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            sortedGroceries.sort((a, b) => b.price - a.price);
            break;
        case 'default':
        default:
            break;
    }

    applyFilters(sortedGroceries);
}

// Apply all filters
function applyFilters(productsToFilter) {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase().trim();
    const priceFilter = document.getElementById('price-filter')?.value || 'all';
    const inStockOnly = document.getElementById('in-stock-filter')?.checked;
    const activeCategory = document.querySelector('.category-btn.active')?.textContent.trim();

    let filtered = productsToFilter || [...groceries];

    // Apply category filter
    if (activeCategory && !activeCategory.includes('All Items')) {
        const categoryMap = {
            '🥬 Produce': 'produce',
            '🥛 Dairy & Eggs': 'dairy',
            '🍞 Bakery': 'bakery',
            '🥩 Meat': 'meat',
            '🥫 Pantry': 'pantry',
            '🧊 Frozen': 'frozen',
            '🥤 Beverages': 'beverages',
        };
        const category = categoryMap[activeCategory];
        if (category) {
            filtered = filtered.filter(item => item.category === category);
        }
    }

    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(
            item =>
                item.name.toLowerCase().includes(searchTerm) ||
                item.category.toLowerCase().includes(searchTerm)
        );
    }

    // Apply price filter
    if (priceFilter !== 'all') {
        const [min, max] = priceFilter.split('-').map(Number);
        filtered = filtered.filter(item => item.price >= min && item.price <= max);
    }

    // Apply stock filter (ready for future implementation)
    if (inStockOnly) {
        // filtered = filtered.filter(item => item.inStock !== false);
    }

    renderGroceryGrid(filtered);
}

// Clear all filters
function clearFilters() {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = 'default';

    const priceFilter = document.getElementById('price-filter');
    if (priceFilter) priceFilter.value = 'all';

    const stockFilter = document.getElementById('in-stock-filter');
    if (stockFilter) stockFilter.checked = false;

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    const allButton = document.querySelector('.category-btn');
    if (allButton) {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        allButton.classList.add('active');
    }

    renderGroceryGrid(groceries);
}

// Filter by category
function filterCategory(category, btn) {
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    applyFilters();
}

// Search items
function searchItems() {
    applyFilters();
}

// Search Autocomplete
let searchTimeout;
function setupSearchAutocomplete() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    const autocompleteContainer = document.createElement('div');
    autocompleteContainer.id = 'search-autocomplete';
    autocompleteContainer.className = 'search-autocomplete';
    searchInput.parentNode.style.position = 'relative';
    searchInput.parentNode.appendChild(autocompleteContainer);

    searchInput.addEventListener('input', e => {
        clearTimeout(searchTimeout);
        const query = e.target.value.toLowerCase().trim();

        if (query.length < 2) {
            autocompleteContainer.innerHTML = '';
            autocompleteContainer.style.display = 'none';
            return;
        }

        searchTimeout = setTimeout(() => {
            const matches = groceries
                .filter(
                    item =>
                        item.name.toLowerCase().includes(query) ||
                        item.category.toLowerCase().includes(query)
                )
                .slice(0, 5);

            if (matches.length === 0) {
                autocompleteContainer.innerHTML = '';
                autocompleteContainer.style.display = 'none';
                return;
            }

            autocompleteContainer.innerHTML = matches
                .map(item => {
                    const imageHtml = item.imageUrl
                        ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 8px;">`
                        : `<span style="font-size: 32px;">${item.emoji}</span>`;

                    return `
                    <div class="autocomplete-item" onclick="selectSearchItem('${item.id}', '${item.name.replace(/'/g, "\\'")}')">
                        <div class="autocomplete-image">${imageHtml}</div>
                        <div class="autocomplete-details">
                            <div class="autocomplete-name">${highlightMatch(item.name, query)}</div>
                            <div class="autocomplete-meta">${item.category} • $${item.price.toFixed(2)}</div>
                        </div>
                        <button class="autocomplete-add" onclick="event.stopPropagation(); addToCart('${item.id}'); closeAutocomplete();">+</button>
                    </div>
                `;
                })
                .join('');

            autocompleteContainer.style.display = 'block';
        }, 300);
    });

    document.addEventListener('click', e => {
        if (!searchInput.contains(e.target) && !autocompleteContainer.contains(e.target)) {
            autocompleteContainer.style.display = 'none';
        }
    });
}

function highlightMatch(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>');
}

function selectSearchItem(itemId, itemName) {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = itemName;
        applyFilters();
        closeAutocomplete();
    }
}

function closeAutocomplete() {
    const autocomplete = document.getElementById('search-autocomplete');
    if (autocomplete) {
        autocomplete.style.display = 'none';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sortProducts,
        applyFilters,
        clearFilters,
        filterCategory,
        searchItems,
        setupSearchAutocomplete,
    };
}
