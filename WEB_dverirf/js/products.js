document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000';
    const sliderTrack = document.querySelector('.products-tab .slider-track');

    const createProductCard = (product) => {
        const slide = document.createElement('div');
        slide.className = 'slide';

        slide.innerHTML = `
            <div class="product-card">
                <a class="product-link" href="#">
                    <picture>
                        <img src="${product.image}" alt="${product.name}">
                    </picture>
                    <strong>${product.name}</strong>
                </a>
                <div class="product-card-bottom">
                    <div class="price">${product.price.toLocaleString('ru-RU')} &#8381;</div>
                    <button class="btn-add-to-cart" data-product-id="${product.id}">В корзину</button>
                </div>
            </div>
        `;
        return slide;
    };

    const loadProducts = async () => {
        if (!sliderTrack) {
            console.log('Элемент для слайдера не найден на этой странице.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/products?_limit=8`);
            if (!response.ok) {
                throw new Error('Не удалось получить данные о товарах.');
            }
            const products = await response.json();

            sliderTrack.innerHTML = '';

            products.forEach(product => {
                const productCard = createProductCard(product);
                sliderTrack.appendChild(productCard);
            });

            if (typeof initSlider === 'function') {
                initSlider();
            } else {
                console.error('Функция initSlider не найдена. Убедитесь, что скрипт slider.js подключен и содержит эту функцию.');
            }

        } catch (error) {
            console.error('Ошибка при загрузке товаров:', error);
            sliderTrack.innerHTML = '<p>Не удалось загрузить товары. Попробуйте позже.</p>';
        }
    };

    loadProducts();
});