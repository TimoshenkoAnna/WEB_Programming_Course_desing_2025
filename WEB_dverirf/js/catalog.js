document.addEventListener('DOMContentLoaded', () => {
    const productsContainer = document.getElementById('products-container');
    if (!productsContainer) return;

    const API_URL = 'http://localhost:3000';
    const categoryFilterContainer = document.getElementById('category-filter-container');
    const mirrorFilterContainer = document.getElementById('mirror-filter-container');
    const sortSelect = document.getElementById('sort-select');
    const resetButton = document.getElementById('del_filter');
    const paginationContainer = document.getElementById('pagination-container');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const quickViewModal = document.getElementById('quick-view-modal');
    const addToCartModal = document.getElementById('add-to-cart-modal');
    const quickViewContent = quickViewModal ? quickViewModal.querySelector('.modal-content') : null;
    const continueShoppingBtn = document.getElementById('continue-shopping-btn');
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');

    let allProducts = [];
    let translations = {};
    let currentLang = localStorage.getItem('language') || 'ru';
    let currentPage = 1;
    const limit = 6;
    let state = { category: '', has_mirror: null, sort: '', order: '', searchQuery: '' };

    const fetchData = async () => {
        try {
            const [productsResponse, localesResponse] = await Promise.all([
                fetch(`${API_URL}/products`),
                fetch('locales.json')
            ]);
            if (!productsResponse.ok || !localesResponse.ok) throw new Error('Network error');
            allProducts = await productsResponse.json();
            translations = await localesResponse.json();
            rerenderComponent();
        } catch (error) {
            productsContainer.innerHTML = `<p>${translations[currentLang]?.catalogPage?.loadingError || 'Ошибка загрузки'}</p>`;
        }
    };

    const rerenderComponent = () => {
        let productsToRender = [...allProducts];
        if (state.searchQuery) {
            productsToRender = productsToRender.filter(p =>
                p.name[currentLang].toLowerCase().includes(state.searchQuery.toLowerCase())
            );
        }
        if (state.category) {
            productsToRender = productsToRender.filter(p => p.category === state.category);
        }
        if (state.has_mirror !== null) {
            productsToRender = productsToRender.filter(p => p.has_mirror === state.has_mirror);
        }
        if (state.sort) {
            productsToRender.sort((a, b) => {
                let valA, valB;
                if (state.sort === 'price') {
                    valA = a.price;
                    valB = b.price;
                } else {
                    valA = a.name[currentLang];
                    valB = b.name[currentLang];
                }
                return state.order === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
            });
        }
        const totalItems = productsToRender.length;
        const paginatedProducts = productsToRender.slice((currentPage - 1) * limit, currentPage * limit);
        renderProducts(paginatedProducts);
        renderPagination(totalItems);
        createFilters();
    };

    const renderProducts = (products) => {
        productsContainer.innerHTML = '';
        if (products.length === 0) {
            productsContainer.innerHTML = `<p>${translations[currentLang]?.catalogPage?.productsNotFound || 'Товары не найдены'}</p>`;
            return;
        }
        products.forEach(product => {
            const name = product.name[currentLang];
            const addToCartText = translations[currentLang]?.catalogPage?.addToCart || 'В корзину';
            const productCardHTML = `
                <div class="product-card">
                    <a href="#" class="product-card-top" data-product-id="${product.id}">
                        <picture><img src="${product.image}" alt="${name}"></picture>
                        <strong>${name}</strong>
                    </a>
                    <div class="product-card-bottom">
                        <div class="price-card">${product.price.toLocaleString('ru-RU')} ₽</div>
                        <button class="btn-add-to-cart" data-product-id="${product.id}">${addToCartText}</button>
                    </div>
                </div>`;
            productsContainer.insertAdjacentHTML('beforeend', productCardHTML);
        });
        document.querySelectorAll('.btn-add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = button.getAttribute('data-product-id');
                handleAddToCart(productId);
            });
        });
    };

    const handleAddToCart = async (productId) => {
        const userData = localStorage.getItem('loggedInUser');
        if (!userData) {
            if (loginModal) {
                loginModal.classList.add('active');
                let switchToRegister = loginModal.querySelector('#switch-to-register');
                if (!switchToRegister) {
                    switchToRegister = document.createElement('a');
                    switchToRegister.id = 'switch-to-register';
                    switchToRegister.href = '#';
                    switchToRegister.textContent = translations[currentLang]?.authRegister || 'Зарегистрироваться';
                    switchToRegister.addEventListener('click', (e) => {
                        e.preventDefault();
                        loginModal.classList.remove('active');
                        if (registerModal) registerModal.classList.add('active');
                    });
                    loginModal.querySelector('.modal-content').appendChild(switchToRegister);
                }
            } else {
                alert(translations[currentLang]?.catalogPage?.authRequired || 'Необходима авторизация');
            }
            return;
        }
        const user = JSON.parse(userData);
        try {
            let cartResponse = await fetch(`${API_URL}/cart?userId=${user.id}`);
            let userCart = await cartResponse.json();
            if (userCart.length === 0) {
                const newCartResponse = await fetch(`${API_URL}/cart`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, products: [] })
                });
                userCart = [await newCartResponse.json()];
            }
            const cart = userCart[0];
            const existingProduct = cart.products.find(p => p.productId === parseInt(productId));
            if (existingProduct) {
                existingProduct.quantity += 1;
            } else {
                cart.products.push({ productId: parseInt(productId), quantity: 1 });
            }
            await fetch(`${API_URL}/cart/${cart.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ products: cart.products })
            });
            if (addToCartModal) {
                if (typeof addToCartModal.showModal === 'function') {
                    addToCartModal.showModal();
                } else {
                    addToCartModal.classList.add('active');
                }
            }
        } catch (error) {
            alert('Не удалось добавить товар в корзину. Попробуйте позже.');
        }
    };

    const createFilters = () => {
        const categories = [...new Map(allProducts.map(p => [p.category, p.category])).values()];
        categoryFilterContainer.innerHTML = '';
        categories.forEach(category => {
            const translatedCategory = translations[currentLang]?.categories?.[category] || category;
            const filterHtml = `
                <div class="filter-item-type-3">
                    <input id="cat_${category.replace(/\s+/g, '_')}" type="checkbox" class="category-filter" value="${category}" ${state.category === category ? 'checked' : ''}>
                    <label for="cat_${category.replace(/\s+/g, '_')}">
                        <strong>${translatedCategory}</strong>
                    </label>
                </div>`;
            categoryFilterContainer.insertAdjacentHTML('beforeend', filterHtml);
        });
        mirrorFilterContainer.innerHTML = `
            <div class="filter-item-type-3">
                <input id="mirror_yes" type="checkbox" class="mirror-filter" value="true" ${state.has_mirror === true ? 'checked' : ''}>
                <label for="mirror_yes"><strong>${translations[currentLang]?.catalogPage?.filterMirror || 'С зеркалом'}</strong></label>
            </div>
        `;
    };

    const renderPagination = (totalItems) => {
        const totalPages = Math.ceil(totalItems / limit);
        paginationContainer.innerHTML = '';
        if (totalPages <= 1) return;
        const prevText = translations[currentLang]?.catalogPage?.paginationPrev || '← Назад';
        const nextText = translations[currentLang]?.catalogPage?.paginationNext || 'Вперед →';
        const buttons = `
            <button class="pagination-btn prev" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">${prevText}</button>
            <button class="pagination-btn next" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">${nextText}</button>`;
        paginationContainer.innerHTML = buttons;
    };

    document.addEventListener('languageChanged', (event) => {
        currentLang = event.detail.lang;
        translations = event.detail.translations;
        rerenderComponent();
    });

    sortSelect.addEventListener('change', (e) => {
        const [sort, order] = e.target.value ? e.target.value.split('&_order=') : ['', ''];
        state.sort = sort;
        state.order = order;
        currentPage = 1;
        rerenderComponent();
    });

    resetButton.addEventListener('click', () => {
        state = { category: '', has_mirror: null, sort: '', order: '', searchQuery: '' };
        searchInput.value = '';
        sortSelect.value = '';
        currentPage = 1;
        rerenderComponent();
    });

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        state.searchQuery = searchInput.value.trim();
        currentPage = 1;
        rerenderComponent();
    });

    categoryFilterContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('category-filter')) {
            document.querySelectorAll('.category-filter').forEach(cb => { if (cb !== e.target) cb.checked = false; });
            state.category = e.target.checked ? e.target.value : '';
            currentPage = 1;
            rerenderComponent();
        }
    });

    mirrorFilterContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('mirror-filter')) {
            state.has_mirror = e.target.checked ? true : null;
            currentPage = 1;
            rerenderComponent();
        }
    });

    paginationContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('pagination-btn') && !e.target.disabled) {
            currentPage = parseInt(e.target.dataset.page);
            rerenderComponent();
        }
    });

    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', () => {
            if (typeof addToCartModal.close === 'function') addToCartModal.close();
            else addToCartModal.classList.remove('active');
        });
    }

    fetchData();
});
