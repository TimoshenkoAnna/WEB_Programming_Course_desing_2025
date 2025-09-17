document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000';
    const usersTableBody = document.querySelector('#users-table tbody');
    const productsTableBody = document.querySelector('#products-table tbody');
    const addProductBtn = document.getElementById('add-product-btn');
    const productModal = document.getElementById('product-modal');
    const productForm = document.getElementById('product-form');
    const modalTitle = document.getElementById('modal-title');
    const productIdInput = document.getElementById('product-id');

    // Проверка прав администратора
    const checkAdminRole = () => {
        const userData = localStorage.getItem('loggedInUser');
        if (!userData) {
            window.location.href = 'index.html';
            return;
        }
        const user = JSON.parse(userData);
        if (user.role !== 'admin') {
            window.location.href = 'index.html';
        }
    };

    // Получение списка пользователей
    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_URL}/users`);
            if (!response.ok) throw new Error('Ошибка при загрузке пользователей');
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    };

    // Отрисовка пользователей
    const renderUsers = (users) => {
        usersTableBody.innerHTML = '';
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.fullName}</td>
                <td>${user.nickname}</td>
                <td>${user.email}</td>
                <td>${user.phone}</td>
                <td>${user.birthDate}</td>
                <td>${user.role}</td>
            `;
            usersTableBody.appendChild(row);
        });
    };

    // Получение списка товаров
    const fetchProducts = async () => {
        try {
            const response = await fetch(`${API_URL}/products`);
            if (!response.ok) throw new Error('Ошибка при загрузке товаров');
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    };

    // Отрисовка товаров
    const renderProducts = (products) => {
        productsTableBody.innerHTML = '';
        products.forEach(product => {
            const row = document.createElement('tr');
            row.dataset.productId = product.id;
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${product.name.ru}</td>
                <td>${product.price}</td>
                <td>${product.category}</td>
                <td>${product.in_stock ? 'Да' : 'Нет'}</td>
                <td>${product.has_mirror ? 'Да' : 'Нет'}</td>
                <td>
                    <button class="action-btn edit" data-id="${product.id}">Ред.</button>
                    <button class="action-btn delete" data-id="${product.id}">Удл.</button>
                </td>
            `;
            productsTableBody.appendChild(row);
        });
    };

    // Открытие модального окна
    const openModal = (title, product = null) => {
        modalTitle.textContent = title;
        productForm.reset();
        productIdInput.value = '';

        if (product) {
            productIdInput.value = product.id;
            document.getElementById('product-name-ru').value = product.name.ru;
            document.getElementById('product-name-en').value = product.name.en;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-image').value = product.image;
            document.getElementById('product-description-ru').value = product.description.ru;
            document.getElementById('product-description-en').value = product.description.en;
            document.getElementById('product-in-stock').checked = product.in_stock;
            document.getElementById('product-has-mirror').checked = product.has_mirror;
        }
        
        productModal.classList.add('active');
    };

    // Закрытие модального окна
    const closeModal = () => {
        productModal.classList.remove('active');
    };

    // Обработка отправки формы
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const id = productIdInput.value;
        const productData = {
            name: {
                ru: document.getElementById('product-name-ru').value,
                en: document.getElementById('product-name-en').value,
            },
            price: parseFloat(document.getElementById('product-price').value),
            category: document.getElementById('product-category').value,
            image: document.getElementById('product-image').value,
            description: {
                ru: document.getElementById('product-description-ru').value,
                en: document.getElementById('product-description-en').value,
            },
            in_stock: document.getElementById('product-in-stock').checked,
            has_mirror: document.getElementById('product-has-mirror').checked,
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData),
            });
            if (!response.ok) throw new Error('Ошибка при сохранении товара');
            
            closeModal();
            const products = await fetchProducts();
            renderProducts(products);
        } catch (error) {
            console.error(error);
        }
    };

    // Обработка кликов по таблице товаров
    const handleTableClick = async (e) => {
        const target = e.target;
        const productId = target.dataset.id;

        if (target.classList.contains('edit')) {
            const response = await fetch(`${API_URL}/products/${productId}`);
            const product = await response.json();
            openModal('Редактировать товар', product);
        }

        if (target.classList.contains('delete')) {
            if (confirm('Вы уверены, что хотите удалить этот товар?')) {
                try {
                    const response = await fetch(`${API_URL}/products/${productId}`, {
                        method: 'DELETE',
                    });
                    if (!response.ok) throw new Error('Ошибка при удалении товара');
                    
                    const products = await fetchProducts();
                    renderProducts(products);
                } catch (error) {
                    console.error(error);
                }
            }
        }
    };

    // Инициализация и обработчики событий
    const init = async () => {
        checkAdminRole();

        const users = await fetchUsers();
        renderUsers(users);

        const products = await fetchProducts();
        renderProducts(products);
    };

    addProductBtn.addEventListener('click', () => openModal('Добавить товар'));
    productForm.addEventListener('submit', handleFormSubmit);
    productsTableBody.addEventListener('click', handleTableClick);

    productModal.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay') || e.target.hasAttribute('data-close-modal')) {
            closeModal();
        }
    });

    init();
});