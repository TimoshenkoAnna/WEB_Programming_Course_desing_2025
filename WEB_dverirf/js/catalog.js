document.addEventListener('DOMContentLoaded', () => {
    // Константы и переменные
    const API_URL = 'http://localhost:3000';

    // DOM элементы каталога
    const productsContainer = document.getElementById('products-container');
    const categoryFilterContainer = document.getElementById('category-filter-container');
    const sortSelect = document.getElementById('sort-select');
    const resetButton = document.getElementById('del_filter');
    const paginationContainer = document.getElementById('pagination-container');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    // DOM элементы модальных окон
    const quickViewModal = document.getElementById('quick-view-modal');
    const addToCartModal = document.getElementById('add-to-cart-modal');
    const quickViewContent = quickViewModal.querySelector('.modal-content');
    const closeButtons = document.querySelectorAll('.modal-close-btn');
    const continueShoppingBtn = document.getElementById('continue-shopping-btn');

    // Глобальное состояние фильтров
    let currentPage = 1;
    const limit = 6;
    const state = {
        category: '',
        sort: '',
        order: '',
        searchQuery: ''
    };

    // Логика добавления в корзину
    const handleAddToCart = async (productId) => {
        const userData = localStorage.getItem('loggedInUser');
        if (!userData) {
            alert('Пожалуйста, войдите в систему, чтобы добавить товар в корзину.');
            return;
        }
        const user = JSON.parse(userData);
        const userId = user.id;

        try {
            const response = await fetch(`${API_URL}/cart?userId=${userId}`);
            const userCartArr = await response.json();

            if (userCartArr.length > 0) {
                // Обновление существующей корзины
                const cart = userCartArr[0];
                const productIndex = cart.products.findIndex(p => p.productId == productId);

                if (productIndex !== -1) {
                    cart.products[productIndex].quantity += 1;
                } else {
                    cart.products.push({ productId: parseInt(productId), quantity: 1 });
                }

                await fetch(`${API_URL}/cart/${cart.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ products: cart.products })
                });

            } else {
                // Создание новой корзины
                const newCart = {
                    userId: userId,
                    products: [{ productId: parseInt(productId), quantity: 1 }]
                };

                await fetch(`${API_URL}/cart`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newCart)
                });
            }
            openModal(addToCartModal);
        } catch (error) {
            console.error('Ошибка при добавлении в корзину:', error);
            alert('Не удалось добавить товар. Проверьте, запущен ли json-server и посмотрите консоль (F12).');
        }
    };

    // Логика каталога
    const fetchProducts = async () => {
        let url = new URL(`${API_URL}/products`);
        url.searchParams.append('_page', currentPage);
        url.searchParams.append('_limit', limit);

        if (state.searchQuery) url.searchParams.append('q', state.searchQuery);
        if (state.category) url.searchParams.append('category', state.category);
        if (state.sort) {
            url.searchParams.append('_sort', state.sort);
            url.searchParams.append('_order', state.order);
        }
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
            const productCardHTML = `
                <div class="product-card">
                    <a href="#" class="product-card-top" data-product-id="${product.id}">
                        <picture>
                            <img src="${product.image}" alt="${product.name}">
                        </picture>
                        <strong>${product.name}</strong>
                    </a>
                    <div class="product-card-bottom">
                        <div class="price-card">${product.price.toLocaleString('ru-RU')} &#8381;</div>
                        <button class="btn-add-to-cart" data-product-id="${product.id}">В корзину</button>
                    </div>
                </div>
            `;
            productsContainer.insertAdjacentHTML('beforeend', productCardHTML);
        });
    };

    const createCategoryFilters = async () => {
        try {
            const response = await fetch(`${API_URL}/products`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
    
    // Логика модальных окон
    const openModal = (modal) => {
        modal.showModal();
        document.body.style.overflow = 'hidden';
    };

    const closeModal = (modal) => {
        modal.close();
    };

    const showQuickView = async (productId) => {
        try {
            quickViewContent.innerHTML = `<p style="padding: 30px; text-align: center;">Загрузка...</p>`;
            openModal(quickViewModal);

            const response = await fetch(`${API_URL}/products/${productId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const product = await response.json();
            
            quickViewContent.innerHTML = `
                <div class="quick-view-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="quick-view-details">
                    <h2 class="quick-view-title">${product.name}</h2>
                    <p class="quick-view-description">${product.description}</p>
                    <div class="quick-view-price">${product.price.toLocaleString('ru-RU')} &#8381;</div>
                    <button class="btn-add-to-cart" data-product-id="${product.id}">Добавить в корзину</button>
                </div>
            `;
        } catch(error) {
            console.error("Ошибка при загрузке данных для быстрого просмотра:", error);
            quickViewContent.innerHTML = `<p style="padding: 30px; text-align: center; color: red;">Не удалось загрузить информацию о товаре.</p>`;
        }
    };
    
    // Обработчики событий
    sortSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        const [sort, order] = value ? value.split('&_order=') : ['', ''];
        state.sort = sort;
        state.order = order;
        currentPage = 1;
        fetchProducts();
    });

    resetButton.addEventListener('click', () => {
        Object.assign(state, { category: '', sort: '', order: '', searchQuery: '' });
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
    
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        
        // Клик по кнопке "В корзину"
        if (target.classList.contains('btn-add-to-cart')) {
            const productId = target.dataset.productId;
            if (quickViewModal.open) {
                 closeModal(quickViewModal);
            }
            handleAddToCart(productId);
        }

        // Клик для быстрого просмотра
        const quickViewTrigger = target.closest('.product-card-top');
        if (quickViewTrigger) {
            e.preventDefault();
            const productId = quickViewTrigger.dataset.productId;
            showQuickView(productId);
        }
    });
    
    closeButtons.forEach(button => {
        button.addEventListener('click', () => closeModal(button.closest('.modal')));
    });

    continueShoppingBtn.addEventListener('click', () => closeModal(addToCartModal));

    const allModals = document.querySelectorAll('.modal');
    allModals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
        modal.addEventListener('close', () => {
            const isAnyModalOpen = Array.from(allModals).some(m => m.open);
            if (!isAnyModalOpen) document.body.style.overflow = '';
        });
    });

    // Инициализация
    fetchProducts();
    createCategoryFilters();
});