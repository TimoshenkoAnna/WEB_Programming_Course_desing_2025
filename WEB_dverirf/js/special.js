document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const fontButtons = document.querySelectorAll('.font-size-btn');
    const colorButtons = document.querySelectorAll('.color-scheme-btn');
    const toggleImagesBtn = document.getElementById('toggle-images-btn');
    const resetBtn = document.getElementById('reset-settings-btn');
    
    function applySettings() {
        const fontSize = localStorage.getItem('fontSize');
        const colorScheme = localStorage.getItem('colorScheme');
        const imagesDisabled = localStorage.getItem('imagesDisabled');

        if (fontSize) setFontSize(fontSize);
        if (colorScheme) setColorScheme(colorScheme);
        if (imagesDisabled === 'true') toggleImages(true);
    }

    // --- Функции для управления настройками ---

    function setFontSize(size) {
        body.classList.remove('font-size-medium', 'font-size-large');
        if (size !== 'normal') {
            body.classList.add(`font-size-${size}`);
        }
        localStorage.setItem('fontSize', size);
        updateActiveButton(fontButtons, size);
    }
    
    function setColorScheme(scheme) {
        body.classList.remove('color-scheme-white-black', 'color-scheme-black-white', 'color-scheme-blue-darkblue');
        body.classList.add(`color-scheme-${scheme}`);
        localStorage.setItem('colorScheme', scheme);
        updateActiveButton(colorButtons, scheme);
    }

    function toggleImages(forceDisable) {
        const isDisabled = body.classList.toggle('images-disabled', forceDisable);
        localStorage.setItem('imagesDisabled', isDisabled);
    }

    function resetSettings() {
        localStorage.removeItem('fontSize');
        localStorage.removeItem('colorScheme');
        localStorage.removeItem('imagesDisabled');

        window.location.reload();
    }
    
    function updateActiveButton(buttons, activeValue) {
        buttons.forEach(button => {
            if (button.dataset.size === activeValue || button.dataset.scheme === activeValue) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    fontButtons.forEach(button => {
        button.addEventListener('click', () => setFontSize(button.dataset.size));
    });

    colorButtons.forEach(button => {
        button.addEventListener('click', () => setColorScheme(button.dataset.scheme));
    });

    toggleImagesBtn.addEventListener('click', () => toggleImages());
    
    resetBtn.addEventListener('click', resetSettings);

    applySettings();
});