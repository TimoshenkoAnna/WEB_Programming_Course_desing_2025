document.addEventListener('DOMContentLoaded', () => {
    const productsContainer = document.getElementById('products-container');
    const categoryFilterContainer = document.getElementById('category-filter-container');
    const mirrorFilterContainer = document.getElementById('mirror-filter-container');
    const sortSelect = document.getElementById('sort-select');
    const resetButton = document.getElementById('del_filter');
    const paginationContainer = document.getElementById('pagination-container');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    const API_URL = 'http://localhost:3000/products';
    let currentPage = 1;
    const limit = 6;

    const state = {
        category: '',
        hasMirror: null,
        sort: '',
        order: '',
        searchQuery: ''
    };

    const fetchProducts = async () => {
        let url = new URL(API_URL);
        url.searchParams.append('_page', currentPage);
        url.searchParams.append('_limit', limit);

        if (state.searchQuery) {
            url.searchParams.append('q', state.searchQuery);
        }
        if (state.category) {
            url.searchParams.append('category', state.category);
        }
        if (state.hasMirror !== null) {
            // Эта логика требует доработки, если категории "С зеркалом" и "Без зеркала" неявные
            if(state.hasMirror) {
                url.searchParams.append('category', 'С зеркалом');
            }
        }
        if (state.sort) {
            url.searchParams.append('_sort', state.sort);
            url.searchParams.append('_order', state.order);
        }
        
        try {
            const response = await fetch(url);
            const totalCount = response.headers.get('X-Total-Count');
            const products = await response.json();
            
            renderProducts(products);
            renderPagination(totalCount);
        } catch (error) {
            console.error("Ошибка при загрузке товаров:", error);
            productsContainer.innerHTML = `<p style="width: 100%; text-align: center;">Не удалось загрузить товары. Убедитесь, что json-server запущен.</p>`;
        }
    };

    const renderProducts = (products) => {
        productsContainer.innerHTML = '';
        if (products.length === 0) {
            productsContainer.innerHTML = '<p style="width: 100%; text-align: center;">Товары не найдены.</p>';
            return;
        }
        products.forEach(product => {
            const productCard = `
                <div class="product-card">
                    <a href="#" class="product-card-top">
                        <picture>
                            <img src="${product.image}" alt="${product.name}">
                        </picture>
                        <strong>${product.name}</strong>
                    </a>
                    <div class="price-card">${product.price.toLocaleString('ru-RU')} &#8381;</div>
                </div>
            `;
            productsContainer.insertAdjacentHTML('beforeend', productCard);
        });
    };

    const createCategoryFilters = async () => {
        try {
            const response = await fetch(API_URL);
            const products = await response.json();
            const categories = [...new Set(products.map(p => p.category))];
            
            categoryFilterContainer.innerHTML = '';
            categories.forEach(category => {
                const filterHtml = `
                    <div class="filter-item-type-3">
                        <input id="cat_${category.replace(/\s+/g, '_')}" type="checkbox" class="filter_checkbox category-filter" value="${category}">
                        <label for="cat_${category.replace(/\s+/g, '_')}">
                            <strong>${category}</strong>
                        </label>
                    </div>`;
                categoryFilterContainer.insertAdjacentHTML('beforeend', filterHtml);
            });

            document.querySelectorAll('.category-filter').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    document.querySelectorAll('.category-filter').forEach(cb => {
                        if(cb !== e.target) cb.checked = false;
                    });
                    state.category = e.target.checked ? e.target.value : '';
                    currentPage = 1;
                    fetchProducts();
                });
            });

        } catch (error) {
            console.error("Ошибка при создании фильтров:", error);
        }
    };
    
    const renderPagination = (totalItems) => {
        const totalPages = Math.ceil(totalItems / limit);
        paginationContainer.innerHTML = '';
        if (totalPages <= 1) return;

        const prevButton = `<button class="pagination-btn prev" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">← Назад</button>`;
        const nextButton = `<button class="pagination-btn next" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">Вперед →</button>`;
        paginationContainer.innerHTML = prevButton + nextButton;

        document.querySelectorAll('.pagination-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                if(!e.currentTarget.disabled){
                    currentPage = parseInt(e.currentTarget.dataset.page);
                    fetchProducts();
                }
            });
        });
    };

    sortSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        if (value) {
            const [sort, order] = value.split('&_order=');
            state.sort = sort;
            state.order = order;
        } else {
            state.sort = '';
            state.order = '';
        }
        currentPage = 1;
        fetchProducts();
    });

    resetButton.addEventListener('click', () => {
        state.category = '';
        state.hasMirror = null;
        state.sort = '';
        state.order = '';
        state.searchQuery = '';
        searchInput.value = '';
        currentPage = 1;
        sortSelect.value = '';
        document.querySelectorAll('.filter_checkbox').forEach(cb => cb.checked = false);
        fetchProducts();
    });

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        state.searchQuery = searchInput.value.trim();
        currentPage = 1;
        fetchProducts();
    });

    fetchProducts();
    createCategoryFilters();
});