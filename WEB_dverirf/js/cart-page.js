document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000';
    const cartContainer = document.getElementById('cart-container');
    let userCart = null;
    let translations = {};
    let currentLang = localStorage.getItem('language') || 'ru';

    const fetchTranslations = async () => {
        try {
            const response = await fetch('locales.json');
            if (!response.ok) {
                throw new Error(`Ошибка загрузки локализаций: ${response.statusText}`);
            }
            translations = await response.json();
        } catch (error) {
            console.error('Ошибка загрузки локализаций:', error);
            translations[currentLang] = translations[currentLang] || {};
        }
    };

    const renderCart = (items) => {
        if (!items || items.length === 0) {
            const emptyMessage = translations[currentLang]?.cartPage?.emptyCart || 'Ваша корзина пуста.';
            cartContainer.innerHTML = `<p class="cart-empty-message">${emptyMessage}</p>`;
            return;
        }

        let totalCost = 0;
        cartContainer.innerHTML = '';

        items.forEach(item => {
            const itemTotal = item.product.price * item.quantity;
            totalCost += itemTotal;

            const productName = item.product.name[currentLang] || item.product.name['ru'] || 'Unnamed Product';
            const pricePerUnitText = translations[currentLang]?.cartPage?.pricePerUnit || '₽ / шт.';
            const cartItemHTML = `
                <div class="cart-item" data-product-id="${item.product.id}">
                    <img src="${item.product.image}" alt="${productName}" class="cart-item-img">
                    <div class="cart-item-details">
                        <a href="#">${productName}</a>
                        <p class="cart-item-price">${item.product.price.toLocaleString('ru-RU')} ${pricePerUnitText}</p>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn decrease-btn" ${item.quantity === 1 ? 'disabled' : ''}>–</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn increase-btn">+</button>
                    </div>
                    <div class="cart-item-total">${itemTotal.toLocaleString('ru-RU')} ₽</div>
                    <button class="remove-item-btn" title="${translations[currentLang]?.cartPage?.removeItem || 'Удалить'}">×</button>
                </div>
            `;
            cartContainer.insertAdjacentHTML('beforeend', cartItemHTML);
        });

        const summaryTotalText = translations[currentLang]?.cartPage?.total || 'Итого';
        const checkoutButtonText = translations[currentLang]?.cartPage?.checkout || 'Оформить заказ';
        const cartSummaryHTML = `
            <div class="cart-summary">
                <p class="summary-total">${summaryTotalText}: ${totalCost.toLocaleString('ru-RU')} ₽</p>
                <button class="checkout-btn">${checkoutButtonText}</button>
            </div>
        `;
        cartContainer.insertAdjacentHTML('beforeend', cartSummaryHTML);
    };

    const updateCartOnServer = async () => {
        try {
            const response = await fetch(`${API_URL}/cart/${userCart.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ products: userCart.products })
            });
            if (!response.ok) {
                throw new Error(`Ошибка обновления корзины: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Ошибка обновления корзины на сервере:', error);
            const errorMessage = translations[currentLang]?.cartPage?.errorUpdatingCart || 'Не удалось обновить корзину. Пожалуйста, перезагрузите страницу.';
            alert(errorMessage);
        }
    };

    const loadCart = async () => {
        const userData = localStorage.getItem('loggedInUser');
        if (!userData) {
            const authMessage = translations[currentLang]?.cartPage?.authRequired || 'Пожалуйста, войдите в систему, чтобы просмотреть корзину.';
            cartContainer.innerHTML = `<p class="cart-auth-message">${authMessage}</p>`;
            return;
        }
        const user = JSON.parse(userData);

        try {
            const cartResponse = await fetch(`${API_URL}/cart?userId=${user.id}`);
            if (!cartResponse.ok) {
                throw new Error(`Ошибка загрузки корзины: ${cartResponse.statusText}`);
            }
            const userCartArr = await cartResponse.json();

            if (userCartArr.length === 0 || !userCartArr[0].products || userCartArr[0].products.length === 0) {
                const emptyMessage = translations[currentLang]?.cartPage?.emptyCart || 'Ваша корзина пуста.';
                cartContainer.innerHTML = `<p class="cart-empty-message">${emptyMessage}</p>`;
                return;
            }

            userCart = userCartArr[0];
            const productsInCart = userCart.products;

            const productIdsParams = productsInCart.map(p => `id=${p.productId}`).join('&');
            const productsResponse = await fetch(`${API_URL}/products?${productIdsParams}`);
            if (!productsResponse.ok) {
                throw new Error(`Ошибка загрузки продуктов: ${productsResponse.statusText}`);
            }
            const productsDetails = await productsResponse.json();

            const cartItems = productsInCart.map(cartProduct => {
                const productDetail = productsDetails.find(p => p.id === cartProduct.productId);
                if (!productDetail) {
                    console.warn(`Продукт с id ${cartProduct.productId} не найден`);
                    return null;
                }
                return { product: productDetail, quantity: cartProduct.quantity };
            }).filter(item => item !== null);

            renderCart(cartItems);

        } catch (error) {
            console.error('Ошибка загрузки корзины:', error);
            const errorMessage = translations[currentLang]?.cartPage?.errorLoadingCart || 'Не удалось загрузить корзину. Попробуйте снова.';
            cartContainer.innerHTML = `<p class="cart-empty-message">${errorMessage}</p>`;
        }
    };

    cartContainer.addEventListener('click', async (event) => {
        const target = event.target;

        const cartItemElement = target.closest('.cart-item');
        if (!cartItemElement) return;

        const productId = parseInt(cartItemElement.dataset.productId);
        const productInCart = userCart.products.find(p => p.productId === productId);
        if (!productInCart) return;

        if (target.classList.contains('increase-btn')) {
            productInCart.quantity++;
        } else if (target.classList.contains('decrease-btn')) {
            if (productInCart.quantity > 1) {
                productInCart.quantity--;
            }
        } else if (target.classList.contains('remove-item-btn')) {
            userCart.products = userCart.products.filter(p => p.productId !== productId);
        } else {
            return;
        }

        await updateCartOnServer();
        await loadCart();
    });

    document.addEventListener('languageChanged', async (event) => {
        currentLang = event.detail.lang;
        translations = event.detail.translations;
        await loadCart();
    });

    (async () => {
        await fetchTranslations();
        await loadCart();
    })();
});