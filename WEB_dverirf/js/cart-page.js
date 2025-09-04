document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000';
    const cartContainer = document.getElementById('cart-container');
    let userCart = null;

    const renderCart = (items) => {
        if (!items || items.length === 0) {
            cartContainer.innerHTML = '<p class="cart-empty-message">Ваша корзина пуста.</p>';
            return;
        }

        let totalCost = 0;
        cartContainer.innerHTML = '';

        items.forEach(item => {
            const itemTotal = item.product.price * item.quantity;
            totalCost += itemTotal;

            const cartItemHTML = `
                <div class="cart-item" data-product-id="${item.product.id}">
                    <img src="${item.product.image}" alt="${item.product.name}" class="cart-item-img">
                    <div class="cart-item-details">
                        <a href="#">${item.product.name}</a>
                        <p class="cart-item-price">${item.product.price.toLocaleString('ru-RU')} ₽ / шт.</p>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn decrease-btn" ${item.quantity === 1 ? 'disabled' : ''}>–</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn increase-btn">+</button>
                    </div>
                    <div class="cart-item-total">${itemTotal.toLocaleString('ru-RU')} ₽</div>
                    <button class="remove-item-btn">×</button>
                </div>
            `;
            cartContainer.insertAdjacentHTML('beforeend', cartItemHTML);
        });

        const cartSummaryHTML = `
            <div class="cart-summary">
                <p class="summary-total">Итого: ${totalCost.toLocaleString('ru-RU')} ₽</p>
                <button class="checkout-btn">Оформить заказ</button>
            </div>
        `;
        cartContainer.insertAdjacentHTML('beforeend', cartSummaryHTML);
    };
    
    const updateCartOnServer = async () => {
        try {
            await fetch(`${API_URL}/cart/${userCart.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ products: userCart.products })
            });
        } catch (error) {
            console.error('Ошибка обновления корзины на сервере:', error);
            alert('Не удалось обновить корзину. Пожалуйста, перезагрузите страницу.');
        }
    };
    
    const loadCart = async () => {
        const userData = localStorage.getItem('loggedInUser');
        if (!userData) {
            cartContainer.innerHTML = '<p class="cart-auth-message">Пожалуйста, войдите в систему, чтобы просмотреть корзину.</p>';
            return;
        }
        const user = JSON.parse(userData);

        try {
            const cartResponse = await fetch(`${API_URL}/cart?userId=${user.id}`);
            const userCartArr = await cartResponse.json();

            if (userCartArr.length === 0 || userCartArr[0].products.length === 0) {
                renderCart([]);
                return;
            }
            
            userCart = userCartArr[0];
            const productsInCart = userCart.products;

            const productIdsParams = productsInCart.map(p => `id=${p.productId}`).join('&');
            const productsResponse = await fetch(`${API_URL}/products?${productIdsParams}`);
            const productsDetails = await productsResponse.json();

            const cartItems = productsInCart.map(cartProduct => {
                const productDetail = productsDetails.find(p => p.id === cartProduct.productId);
                return { product: productDetail, quantity: cartProduct.quantity };
            }).filter(item => item.product);

            renderCart(cartItems);

        } catch (error) {
            console.error('Ошибка загрузки корзины:', error);
            cartContainer.innerHTML = '<p class="cart-empty-message">Не удалось загрузить корзину. Попробуйте снова.</p>';
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

    loadCart();
});