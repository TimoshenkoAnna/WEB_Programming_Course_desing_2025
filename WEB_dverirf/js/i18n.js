document.addEventListener('DOMContentLoaded', () => {
    const translateBtn = document.getElementById('translate-btn');
    let translations = {};

    async function initTranslations() {
        if (Object.keys(translations).length > 0) return;
        try {
            const response = await fetch('locales.json');
            if (!response.ok) throw new Error('Network response was not ok');
            translations = await response.json();
        } catch (error) {
            console.error('Ошибка загрузки переводов:', error);
        }
    }

    function applyLanguage(lang) {
        if (!translations[lang]) {
            console.warn(`Язык ${lang} не найден`);
            return;
        }

        document.documentElement.lang = lang;
        localStorage.setItem('language', lang);

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const keys = key.split('.');
            let value = translations[lang];
            for (let k of keys) {
                value = value?.[k];
                if (!value) {
                    console.warn(`Перевод для ключа ${key} не найден в языке ${lang}`);
                    break;
                }
            }
            if (value) {
                el.innerHTML = value;
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.dataset.i18nPlaceholder;
            const keys = key.split('.');
            let value = translations[lang];
            for (let k of keys) {
                value = value?.[k];
                if (!value) {
                    console.warn(`Перевод для placeholder ${key} не найден в языке ${lang}`);
                    break;
                }
            }
            if (value) {
                el.placeholder = value;
            }
        });

        document.querySelectorAll('[data-i18n-alt]').forEach(el => {
            const key = el.dataset.i18nAlt;
            const keys = key.split('.');
            let value = translations[lang];
            for (let k of keys) {
                value = value?.[k];
                if (!value) {
                    console.warn(`Перевод для alt ${key} не найден в языке ${lang}`);
                    break;
                }
            }
            if (value) {
                el.alt = value;
            }
        });

        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            const options = [
                { value: "", key: "catalogPage.sortDefault" },
                { value: "price&_order=desc", key: "catalogPage.sortPriceDesc" },
                { value: "price&_order=asc", key: "catalogPage.sortPriceAsc" },
                { value: "name&_order=asc", key: "catalogPage.sortNameAsc" }
            ];
            sortSelect.innerHTML = '';
            options.forEach(opt => {
                const keys = opt.key.split('.');
                let text = translations[lang];
                for (let k of keys) {
                    text = text?.[k];
                    if (!text) {
                        console.warn(`Перевод для опции ${opt.key} не найден в языке ${lang}`);
                        break;
                    }
                }
                if (text) {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = text;
                    sortSelect.appendChild(option);
                }
            });
        }

        document.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { 
                lang: lang, 
                translations: translations 
            } 
        }));
    }

    translateBtn.addEventListener('click', () => {
        const newLang = (localStorage.getItem('language') || 'ru') === 'ru' ? 'en' : 'ru';
        applyLanguage(newLang);
    });

    async function main() {
        await initTranslations();
        applyLanguage(localStorage.getItem('language') || 'ru');
    }
    
    main();
});