document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');

    // Устанавливаем тему
    function setTheme(theme) {
        document.body.classList.toggle('theme-dark', theme === 'dark');
        localStorage.setItem('theme', theme);
    }

    // Обработчик клика
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = localStorage.getItem('theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    });

    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
});