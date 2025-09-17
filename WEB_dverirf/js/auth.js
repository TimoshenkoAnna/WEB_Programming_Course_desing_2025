document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000';
    const userNavContainer = document.getElementById('user-nav-container');
    let translations = {};
    let currentLang = localStorage.getItem('language') || 'ru';

    const registerModal = document.getElementById('register-modal');
    const registerForm = document.getElementById('register-form');
    const lastNameInput = document.getElementById('reg-lastname');
    const firstNameInput = document.getElementById('reg-firstname');
    const middleNameInput = document.getElementById('reg-middlename');
    const phoneInput = document.getElementById('reg-phone');
    const emailInput = document.getElementById('reg-email');
    const dobInput = document.getElementById('reg-dob');
    const nicknameInput = document.getElementById('reg-nickname');
    const regenerateNicknameBtn = document.getElementById('regenerate-nickname-btn');
    const passwordMethodRadios = document.querySelectorAll('input[name="password-method"]');
    const manualPasswordSection = document.getElementById('manual-password-section');
    const autoPasswordSection = document.getElementById('auto-password-section');
    const passwordInput = document.getElementById('reg-password');
    const passwordConfirmInput = document.getElementById('reg-password-confirm');
    const passwordAutoInput = document.getElementById('reg-password-auto');
    const togglePasswordBtn = document.getElementById('toggle-password-btn');
    const copyPasswordBtn = document.getElementById('copy-password-btn');
    const agreementCheckbox = document.getElementById('reg-agreement');
    const registerSubmitBtn = document.getElementById('register-submit-btn');
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    
    let commonPasswords = [];
    let nicknameRegenerationCount = 0;

    const loadSettings = () => {
        const fontSize = localStorage.getItem('fontSize') || 'normal';
        const fontSizeBtn = document.querySelector(`.font-size-btn[data-size="${fontSize}"]`);
        if (fontSizeBtn) {
            fontSizeBtn.classList.add('active');
        }
        document.body.style.fontSize = `${fontSize === 'large' ? '18px' : fontSize === 'medium' ? '16px' : '14px'}`;

        const colorScheme = localStorage.getItem('colorScheme') || 'white-black';
        document.body.dataset.theme = colorScheme;
        const colorSchemeBtn = document.querySelector(`.color-scheme-btn[data-scheme="${colorScheme}"]`);
        if (colorSchemeBtn) {
            colorSchemeBtn.classList.add('active');
        }

        const imagesEnabled = localStorage.getItem('imagesEnabled') !== 'false';
        const toggleImagesBtn = document.getElementById('toggle-images-btn');
        if (toggleImagesBtn) {
            toggleImagesBtn.textContent = imagesEnabled ? 'Вкл' : 'Выкл';
        }
        document.querySelectorAll('img').forEach(img => {
            img.style.display = imagesEnabled ? '' : 'none';
        });
    };

    const updateHeaderUI = () => {
        if (Object.keys(translations).length === 0 && currentLang === 'ru') {
            translations = { ru: { authGreeting: 'Привет, %name%!', authLogout: 'Выйти', authRegister: 'Регистрация', authLogin: 'Войти', navAdminPanel: 'Админ-панель' } };
        } else if (Object.keys(translations).length === 0) {
            return;
        }

        const userData = localStorage.getItem('loggedInUser');
        userNavContainer.innerHTML = '';

        if (userData) {
            const user = JSON.parse(userData);
            const userName = user.fullName.split(' ')[1] || user.nickname;
            const greetingText = (translations[currentLang]?.authGreeting || 'Привет, %name%!').replace('%name%', userName);
            const userGreeting = document.createElement('span');
            userGreeting.className = 'nav-link greeting';
            userGreeting.textContent = greetingText;
            userNavContainer.appendChild(userGreeting);
            if (user.role === 'admin') {
                const adminLink = document.createElement('a');
                adminLink.href = 'admin.html';
                adminLink.className = 'nav-link';
                adminLink.textContent = translations[currentLang]?.navAdminPanel || 'Admin Panel';
                userNavContainer.appendChild(adminLink);
            }
            const logoutButton = document.createElement('button');
            logoutButton.id = 'logout-btn';
            logoutButton.className = 'nav-link';
            logoutButton.textContent = translations[currentLang]?.authLogout || 'Выйти';
            userNavContainer.appendChild(logoutButton);
        } else {
            const registerLink = document.createElement('a');
            registerLink.href = '#';
            registerLink.id = 'register-link';
            registerLink.className = 'nav-link';
            registerLink.textContent = translations[currentLang]?.authRegister || 'Регистрация';
            const loginLink = document.createElement('a');
            loginLink.href = '#';
            loginLink.id = 'login-link';
            loginLink.className = 'nav-link';
            loginLink.textContent = translations[currentLang]?.authLogin || 'Войти';
            userNavContainer.appendChild(registerLink);
            userNavContainer.appendChild(loginLink);
        }
    };

    document.addEventListener('languageChanged', (event) => {
        currentLang = event.detail.lang;
        translations = event.detail.translations;
        updateHeaderUI();
    });

    const getErrorText = (key, fieldName = '') => {
        if (!translations[currentLang] || !translations[currentLang][key]) {
            return 'Произошла ошибка.';
        }
        return translations[currentLang][key].replace('%fieldName%', fieldName);
    };

    const openModal = (modal) => {
        if (modal) modal.classList.add('active');
    };

    const closeModal = (modal) => {
        if (modal) modal.classList.remove('active');
    };

    const showError = (input, message) => {
        const formGroup = input.closest('.form-group, .form-group-checkbox');
        if (formGroup) {
            formGroup.classList.add('error');
            const errorMessage = formGroup.querySelector('.error-message');
            if (errorMessage) errorMessage.textContent = message;
        }
    };

    const showSuccess = (input) => {
        const formGroup = input.closest('.form-group, .form-group-checkbox');
        if (formGroup) {
            formGroup.classList.remove('error');
            const errorMessage = formGroup.querySelector('.error-message');
            if (errorMessage) errorMessage.textContent = '';
        }
    };

    const validateRequiredField = (input, fieldNameKey) => {
        if (input.value.trim() === '') {
            showError(input, getErrorText('errorFieldRequired', getErrorText(fieldNameKey)));
            return false;
        }
        showSuccess(input);
        return true;
    };

    const validatePhone = () => {
        const phoneRegex = /^\+375\s?\(?(29|33|44|25)\)?\s?\d{3}-?\d{2}-?\d{2}$/;
        if (!phoneRegex.test(phoneInput.value)) {
            showError(phoneInput, getErrorText('errorPhoneFormat'));
            return false;
        }
        showSuccess(phoneInput);
        return true;
    };

    const validateEmail = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value)) {
            showError(emailInput, getErrorText('errorEmailFormat'));
            return false;
        }
        showSuccess(emailInput);
        return true;
    };

    const validateDOB = () => {
        if (!dobInput.value) {
            showError(dobInput, getErrorText('errorDobRequired'));
            return false;
        }
        const dob = new Date(dobInput.value);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        if (age < 16) {
            showError(dobInput, getErrorText('errorAgeLimit'));
            return false;
        }
        showSuccess(dobInput);
        return true;
    };

    const validatePassword = () => {
        const password = passwordInput.value;
        if (password.length < 8 || password.length > 20) {
            showError(passwordInput, getErrorText('errorPasswordLengthRange'));
            return false;
        }
        if (!/[A-Z]/.test(password)) {
            showError(passwordInput, getErrorText('errorPasswordComplexity'));
            return false;
        }
        if (!/\d/.test(password)) {
            showError(passwordInput, getErrorText('errorPasswordComplexity'));
            return false;
        }
        if (!/[!@#$%^&*()]/.test(password)) {
            showError(passwordInput, getErrorText('errorPasswordComplexity'));
            return false;
        }
        if (commonPasswords.includes(password)) {
            showError(passwordInput, getErrorText('errorPasswordCommon'));
            return false;
        }
        showSuccess(passwordInput);
        return true;
    };

    const validatePasswordConfirm = () => {
        if (passwordConfirmInput.value !== passwordInput.value) {
            showError(passwordConfirmInput, getErrorText('errorPasswordMismatch'));
            return false;
        }
        showSuccess(passwordConfirmInput);
        return true;
    };

    const validateAgreement = () => {
        if (!agreementCheckbox.checked) {
            showError(agreementCheckbox, getErrorText('errorAgreementRequired'));
            return false;
        }
        showSuccess(agreementCheckbox);
        return true;
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        const email = loginEmailInput.value.trim();
        const password = loginPasswordInput.value;
        if (!email || !password) return;
        try {
            const response = await fetch(`${API_URL}/users?email=${email}`);
            const users = await response.json();
            if (users.length === 0) {
                showError(loginEmailInput, 'Пользователь с таким email не найден');
                return;
            }
            const user = users[0];
            if (user.password !== password) {
                showError(loginPasswordInput, 'Неверный пароль');
                return;
            }
            localStorage.setItem('loggedInUser', JSON.stringify(user));
            updateHeaderUI();
            closeModal(loginModal);
            loginForm.reset();
        } catch (error) {
            console.error("Ошибка авторизации:", error);
            alert("Произошла ошибка при попытке входа.");
        }
    };

    const getCommonPasswords = async () => {
        try {
            const response = await fetch(`${API_URL}/commonPasswords`);
            commonPasswords = await response.json();
        } catch (error) {
            console.error("Не удалось загрузить список частых паролей:", error);
        }
    };

    const handleNicknameGeneration = () => {
        if (nicknameRegenerationCount < 5) {
            const firstName = firstNameInput.value.trim();
            const lastName = lastNameInput.value.trim();
            if (firstName) {
                nicknameInput.value = `${firstName}${lastName || ''}_${Math.floor(100 + Math.random() * 900)}`;
            }
            nicknameRegenerationCount++;
        }
        if (nicknameRegenerationCount >= 5) {
            regenerateNicknameBtn.style.display = 'none';
            nicknameInput.readOnly = false;
            nicknameInput.focus();
        }
    };

    const generatePassword = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
        let password = "";
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        passwordAutoInput.value = password;
        passwordAutoInput.type = 'text';
        togglePasswordBtn.textContent = '🙈';
    };

    const checkRegisterFormValidity = () => {
        const isLastNameValid = validateRequiredField(lastNameInput, 'formLastName');
        const isFirstNameValid = validateRequiredField(firstNameInput, 'formFirstName');
        const isPhoneValid = validatePhone();
        const isEmailValid = validateEmail();
        const isDobValid = validateDOB();
        const isPasswordValid = document.querySelector('input[name="password-method"]:checked').value === 'manual' ? validatePassword() : true;
        const isPasswordConfirmValid = document.querySelector('input[name="password-method"]:checked').value === 'manual' ? validatePasswordConfirm() : true;
        const isAgreementValid = validateAgreement();
        registerSubmitBtn.disabled = !(isLastNameValid && isFirstNameValid && isPhoneValid && isEmailValid && isDobValid && isPasswordValid && isPasswordConfirmValid && isAgreementValid);
    };

    const handlePasswordMethodChange = () => {
        if (document.querySelector('input[name="password-method"]:checked').value === 'auto') {
            manualPasswordSection.style.display = 'none';
            autoPasswordSection.style.display = 'block';
            passwordInput.removeAttribute('required');
            passwordConfirmInput.removeAttribute('required');
            generatePassword();
        } else {
            manualPasswordSection.style.display = 'block';
            autoPasswordSection.style.display = 'none';
            passwordInput.setAttribute('required', '');
            passwordConfirmInput.setAttribute('required', '');
        }
        checkRegisterFormValidity();
    };

    const resetRegisterForm = () => {
        registerForm.reset();
        document.querySelectorAll('#register-form .error-message').forEach(el => el.textContent = '');
        document.querySelectorAll('#register-form .form-group.error, #register-form .form-group-checkbox.error').forEach(el => el.classList.remove('error'));
        registerSubmitBtn.disabled = true;
        manualPasswordSection.style.display = 'block';
        autoPasswordSection.style.display = 'none';
        nicknameRegenerationCount = 0;
        regenerateNicknameBtn.style.display = '';
        nicknameInput.readOnly = true;
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        checkRegisterFormValidity();
        if (registerSubmitBtn.disabled) return;

        const finalPassword = document.querySelector('input[name="password-method"]:checked').value === 'auto' 
            ? passwordAutoInput.value 
            : passwordInput.value;

        const newUser = {
            fullName: `${lastNameInput.value.trim()} ${firstNameInput.value.trim()} ${middleNameInput.value.trim()}`.trim(),
            nickname: nicknameInput.value,
            email: emailInput.value,
            phone: phoneInput.value,
            birthDate: dobInput.value,
            password: finalPassword,
            role: "customer"
        };

        try {
            const emailCheck = await fetch(`${API_URL}/users?email=${newUser.email}`);
            const existingUsers = await emailCheck.json();
            if (existingUsers.length > 0) {
                showError(emailInput, 'Пользователь с таким email уже существует.');
                return;
            }
            const response = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            if (!response.ok) throw new Error('Ошибка сервера при регистрации');
            const createdUser = await response.json();
            localStorage.setItem('loggedInUser', JSON.stringify(createdUser));
            updateHeaderUI();
            closeModal(registerModal);
        } catch (error) {
            console.error("Ошибка регистрации:", error);
            alert("Произошла ошибка при регистрации.");
        }
    };

    userNavContainer.addEventListener('click', (e) => {
        if (e.target.id === 'register-link') {
            e.preventDefault();
            resetRegisterForm();
            getCommonPasswords();
            openModal(registerModal);
        }
        if (e.target.id === 'login-link') {
            e.preventDefault();
            loginForm.reset();
            document.querySelectorAll('#login-form .error-message, #login-form .form-group.error').forEach(el => el.textContent = '');
            openModal(loginModal);
        }
        if (e.target.id === 'logout-btn') {
            e.preventDefault();
            localStorage.removeItem('loggedInUser');
            updateHeaderUI();
        }
    });

    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.closest('.modal-overlay')));
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal(overlay);
        });
    });

    if (registerForm) {
        registerForm.addEventListener('input', checkRegisterFormValidity);
        passwordConfirmInput.addEventListener('paste', e => e.preventDefault());
        passwordMethodRadios.forEach(r => r.addEventListener('change', handlePasswordMethodChange));
        regenerateNicknameBtn.addEventListener('click', handleNicknameGeneration);
        firstNameInput.addEventListener('input', () => {
            if (nicknameRegenerationCount === 0) handleNicknameGeneration();
        });
        lastNameInput.addEventListener('input', () => {
            if (nicknameRegenerationCount === 0) handleNicknameGeneration();
        });
        registerForm.addEventListener('submit', handleRegisterSubmit);

        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordAutoInput.type === 'password';
            passwordAutoInput.type = isPassword ? 'text' : 'password';
            togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
        });

        copyPasswordBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(passwordAutoInput.value).then(() => {
                const originalText = copyPasswordBtn.textContent;
                copyPasswordBtn.textContent = 'Скопировано!';
                setTimeout(() => {
                    copyPasswordBtn.textContent = originalText;
                }, 2000);
            });
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }

    const resetSettingsBtn = document.getElementById('reset-settings-btn');
    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', () => {
            localStorage.removeItem('fontSize');
            localStorage.removeItem('colorScheme');
            localStorage.removeItem('imagesEnabled');
            window.location.reload();
        });
    }

    document.querySelectorAll('.font-size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.font-size-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            localStorage.setItem('fontSize', btn.dataset.size);
            document.body.style.fontSize = `${btn.dataset.size === 'large' ? '18px' : btn.dataset.size === 'medium' ? '16px' : '14px'}`;
        });
    });

    document.querySelectorAll('.color-scheme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-scheme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            localStorage.setItem('colorScheme', btn.dataset.scheme);
            document.body.dataset.theme = btn.dataset.scheme;
        });
    });

    const toggleImagesBtn = document.getElementById('toggle-images-btn');
    if (toggleImagesBtn) {
        toggleImagesBtn.addEventListener('click', () => {
            const currentSetting = localStorage.getItem('imagesEnabled') !== 'false';
            const imagesEnabled = !currentSetting;
            localStorage.setItem('imagesEnabled', imagesEnabled);
            toggleImagesBtn.textContent = imagesEnabled ? 'Вкл' : 'Выкл';
            document.querySelectorAll('img').forEach(img => {
                img.style.display = imagesEnabled ? '' : 'none';
            });
        });
    }

    loadSettings();
    updateHeaderUI();
});