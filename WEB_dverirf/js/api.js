const API_URL = 'http://localhost:3000'; 

async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) {
            throw new Error('Не удалось загрузить товары');
        }
        const products = await response.json();
        return products;
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
        const users = await response.json();
        return users;
    } catch (error) {
        console.error(error);
        return [];
    }
}
