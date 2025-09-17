document.addEventListener('DOMContentLoaded', () => {
    const productsContainer = document.getElementById('products-container');
    const sliderTrack = document.querySelector('.slider-track');
    const categoryFilterContainer = document.getElementById('category-filter-container');
    const mirrorFilterContainer = document.getElementById('mirror-filter-container');
    const sortSelect = document.getElementById('sort-select');
    const resetButton = document.getElementById('del_filter');
    const paginationContainer = document.getElementById('pagination-container');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    let allProducts = [];
    let translations = {};
    let currentLang = localStorage.getItem('language') || 'ru';
    let currentPage = 1;
    const limit = 6;
    const sliderLimit = 10;
    let state = { category: '', has_mirror: null, sort: '', order: '', searchQuery: '' };

    const fetchData = async () => {
        try {
            const [productsResponse, localesResponse] = await Promise.all([
                fetch('http://localhost:3000/products'),
                fetch('locales.json')
            ]);
            if (!productsResponse.ok) throw new Error(`Error fetching products: ${productsResponse.statusText}`);
            if (!localesResponse.ok) throw new Error(`Error fetching locales: ${localesResponse.statusText}`);

            allProducts = await productsResponse.json();
            translations = await localesResponse.json();
            rerenderComponent();
        } catch (error) {
            const errorMessage = translations[currentLang]?.catalogPage?.loadingError || 'Failed to load products.';
            if (productsContainer) productsContainer.innerHTML = `<p>${errorMessage}</p>`;
            else if (sliderTrack) sliderTrack.innerHTML = `<p>${errorMessage}</p>`;
        }
    };

    const rerenderComponent = () => {
        let productsToRender = [...allProducts];

        if (productsContainer) {
            if (state.searchQuery) {
                productsToRender = productsToRender.filter(p => 
                    p.name[currentLang]?.toLowerCase().includes(state.searchQuery.toLowerCase())
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
                        valA = a.price || 0;
                        valB = b.price || 0;
                    } else {
                        valA = a.name[currentLang] || '';
                        valB = b.name[currentLang] || '';
                    }
                    return state.order === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
                });
            }
            
            const totalItems = productsToRender.length;
            const paginatedProducts = productsToRender.slice((currentPage - 1) * limit, currentPage * limit);

            renderProducts(paginatedProducts, productsContainer);
            renderPagination(totalItems);
            createFilters();
        } else if (sliderTrack) {
            renderProducts(productsToRender.slice(0, sliderLimit), sliderTrack);
            setTimeout(() => {
                if (typeof window.initSlider === 'function') {
                    window.initSlider();
                }
            }, 100);
        }
    };
    
    const renderProducts = (products, container) => {
        container.innerHTML = '';
        if (!products || products.length === 0) {
            container.innerHTML = `<p>${translations[currentLang]?.catalogPage?.productsNotFound || 'No products found.'}</p>`;
            return;
        }
        products.forEach(product => {
            const name = product.name[currentLang] || product.name['ru'] || 'Unnamed Product';
            const addToCartText = translations[currentLang]?.catalogPage?.addToCart || 'Add to Cart';
            const productCardHTML = `
                <div class="product-card">
                    <a href="#" class="product-card-top" data-product-id="${product.id || ''}">
                        <picture><img src="${product.image || 'img/placeholder.png'}" alt="${name}" data-i18n-alt="product.name"></picture>
                        <strong>${name}</strong>
                    </a>
                    <div class="product-card-bottom">
                        <div class="price-card">${(product.price || 0).toLocaleString('ru-RU')} ₽</div>
                        <button class="btn-add-to-cart" data-product-id="${product.id || ''}">${addToCartText}</button>
                    </div>
                </div>`;
            container.insertAdjacentHTML('beforeend', productCardHTML);
        });
    };

    const createFilters = () => {
        if (!categoryFilterContainer || !mirrorFilterContainer) return;
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

        const mirrorText = translations[currentLang]?.catalogPage?.filterMirror || 'With Mirror';
        mirrorFilterContainer.innerHTML = `
            <div class="filter-item-type-3">
                <input id="mirror_yes" type="checkbox" class="mirror-filter" value="true" ${state.has_mirror === true ? 'checked' : ''}>
                <label for="mirror_yes"><strong>${mirrorText}</strong></label>
            </div>
        `;
    };
    
    const renderPagination = (totalItems) => {
        if (!paginationContainer) return;
        const totalPages = Math.ceil(totalItems / limit);
        paginationContainer.innerHTML = '';
        if (totalPages <= 1) return;
        const prevText = translations[currentLang]?.catalogPage?.paginationPrev || '← Back';
        const nextText = translations[currentLang]?.catalogPage?.paginationNext || 'Next →';
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

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            const [sort, order] = e.target.value ? e.target.value.split('&_order=') : ['', ''];
            state.sort = sort;
            state.order = order;
            currentPage = 1;
            rerenderComponent();
        });
    }

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            state = { category: '', has_mirror: null, sort: '', order: '', searchQuery: '' };
            if (searchInput) searchInput.value = '';
            if (sortSelect) sortSelect.value = '';
            currentPage = 1;
            rerenderComponent();
        });
    }

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            state.searchQuery = searchInput.value.trim();
            currentPage = 1;
            rerenderComponent();
        });
    }
    
    if (categoryFilterContainer) {
        categoryFilterContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('category-filter')) {
                document.querySelectorAll('.category-filter').forEach(cb => { if (cb !== e.target) cb.checked = false; });
                state.category = e.target.checked ? e.target.value : '';
                currentPage = 1;
                rerenderComponent();
            }
        });
    }

    if (mirrorFilterContainer) {
        mirrorFilterContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('mirror-filter')) {
                state.has_mirror = e.target.checked ? true : null;
                currentPage = 1;
                rerenderComponent();
            }
        });
    }

    if (paginationContainer) {
        paginationContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('pagination-btn') && !e.target.disabled) {
                currentPage = parseInt(e.target.dataset.page);
                rerenderComponent();
            }
        });
    }

    fetchData();
});