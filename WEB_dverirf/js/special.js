document.addEventListener('DOMContentLoaded', () => {
    const fontSizeButtons = document.querySelectorAll('.font-size-btn');
    const colorSchemeButtons = document.querySelectorAll('.color-scheme-btn');
    const toggleImagesBtn = document.getElementById('toggle-images-btn');
    const resetSettingsBtn = document.getElementById('reset-settings-btn');

    const FONT_SETTINGS = {
        normal: { base: 16 },
        medium: { base: 20 },
        large: { base: 24 }
    };

    const applyAllAccessibilitySettings = () => {
        const savedFontSize = localStorage.getItem('accessibility-font-size') || 'normal';
        const savedColorScheme = localStorage.getItem('accessibility-color-scheme') || 'white-black';
        const imagesEnabled = localStorage.getItem('accessibility-images-enabled') !== 'false';

        updateFontSizeAndSpacing(savedFontSize);
        updateColorScheme(savedColorScheme);
        updateImageVisibility(imagesEnabled);
        updateActiveButtons();
    };

    const updateFontSizeAndSpacing = (size) => {
        const settings = FONT_SETTINGS[size];
        if (!settings) return;

        document.body.classList.remove('font-size-normal', 'font-size-medium', 'font-size-large');
        document.body.classList.add(`font-size-${size}`);
    };

    const updateColorScheme = (scheme) => {
        const schemes = ['white-black', 'black-white', 'blue-darkblue', 'black-green', 'beige-brown'];
        schemes.forEach(s => document.body.classList.remove(`color-scheme-${s}`));
        
        document.body.classList.add(`color-scheme-${scheme}`);
    };

    const updateImageVisibility = (enabled) => {
        const images = document.querySelectorAll('img');

        images.forEach(img => {
            const parent = img.parentElement;
            let altTextSpan = parent.querySelector('.image-alt-text[data-alt-for="' + img.src + '"]');

            if (enabled) {
                img.style.display = '';
                if (altTextSpan) altTextSpan.style.display = 'none';
            } else {
                img.style.display = 'none';
                
                if (img.alt) {
                    if (!altTextSpan) {
                        altTextSpan = document.createElement('span');
                        altTextSpan.className = 'image-alt-text';
                        altTextSpan.textContent = `[Image: ${img.alt}]`;
                        altTextSpan.dataset.altFor = img.src;
                        parent.insertBefore(altTextSpan, img.nextSibling);
                    }
                    altTextSpan.style.display = 'flex';
                }
            }
        });
        
        if (toggleImagesBtn) {
            const currentLang = localStorage.getItem('language') || 'ru';
            const onText = currentLang === 'ru' ? 'Вкл' : 'On';
            const offText = currentLang === 'ru' ? 'Выкл' : 'Off';
            toggleImagesBtn.textContent = enabled ? onText : offText;
        }
    };

    const resetAllAccessibilitySettings = () => {
        localStorage.removeItem('accessibility-font-size');
        localStorage.removeItem('accessibility-color-scheme');
        localStorage.removeItem('accessibility-images-enabled');
        
        window.location.reload();
    };

    const updateActiveButtons = () => {
        const currentSize = localStorage.getItem('accessibility-font-size') || 'normal';
        fontSizeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.size === currentSize);
        });

        const currentScheme = localStorage.getItem('accessibility-color-scheme') || 'white-black';
        colorSchemeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.scheme === currentScheme);
        });
    };

    fontSizeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const size = button.dataset.size;
            localStorage.setItem('accessibility-font-size', size);
            updateFontSizeAndSpacing(size);
            updateActiveButtons();
        });
    });

    colorSchemeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const scheme = button.dataset.scheme;
            localStorage.setItem('accessibility-color-scheme', scheme);
            updateColorScheme(scheme);
            updateActiveButtons();
        });
    });

    if (toggleImagesBtn) {
        toggleImagesBtn.addEventListener('click', () => {
            const areImagesEnabled = localStorage.getItem('accessibility-images-enabled') !== 'false';
            localStorage.setItem('accessibility-images-enabled', !areImagesEnabled);
            updateImageVisibility(!areImagesEnabled);
        });
    }

    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', resetAllAccessibilitySettings);
    }
    
    document.addEventListener('languageChanged', applyAllAccessibilitySettings);

    applyAllAccessibilitySettings();
});