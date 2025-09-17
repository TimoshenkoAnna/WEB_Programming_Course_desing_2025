const API_URL = 'http://localhost:3000';

async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) {
            throw new Error('Не удалось загрузить товары');
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

async function fetchUsers() {
    try {
        const response = await fetch(`${API_URL}/users`);
        if (!response.ok) {
            throw new Error('Не удалось загрузить пользователей');
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}