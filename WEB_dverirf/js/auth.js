document.addEventListener('DOMContentLoaded', () => {
    // --- КОНСТАНТЫ И ПЕРЕМЕННЫЕ ---
    const API_URL = 'http://localhost:3000';
    let commonPasswords = [];
    let nicknameRegenerationCount = 0;

    // --- ЭЛЕМЕНТЫ DOM (ОБЩИЕ) ---
    const userNavContainer = document.getElementById('user-nav-container');

    // --- ЭЛЕМЕНТЫ DOM (РЕГИСТРАЦИЯ) ---
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
    const passwordInput = document.getElementById('reg-password');
    const passwordConfirmInput = document.getElementById('reg-password-confirm');
    const agreementCheckbox = document.getElementById('reg-agreement');
    const registerSubmitBtn = document.getElementById('register-submit-btn');

    // --- ЭЛЕМЕНТЫ DOM (АВТОРИЗАЦИЯ) ---
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');

    // --- УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ (UI) ---
    const updateHeaderUI = () => {
        const userData = localStorage.getItem('loggedInUser');
        userNavContainer.innerHTML = '';

        if (userData) {
            const user = JSON.parse(userData);
            const userGreeting = document.createElement('span');
            userGreeting.textContent = `Здравствуйте, ${user.fullName.split(' ')[1] || user.nickname}!`;
            
            if (user.role === 'admin') {
                const adminLink = document.createElement('a');
                adminLink.href = "/admin.html";
                adminLink.textContent = "Админ-панель";
                userNavContainer.appendChild(adminLink);
            }

            const logoutButton = document.createElement('button');
            logoutButton.id = 'logout-btn';
            logoutButton.className = 'nav-link';
            logoutButton.textContent = 'Выйти';
            
            userNavContainer.appendChild(userGreeting);
            userNavContainer.appendChild(logoutButton);
        } else {
            const registerLink = document.createElement('a');
            registerLink.href = '#';
            registerLink.id = 'register-link';
            registerLink.className = 'nav-link';
            registerLink.textContent = 'Регистрация';

            const loginLink = document.createElement('a');
            loginLink.href = '#';
            loginLink.id = 'login-link';
            loginLink.className = 'nav-link';
            loginLink.textContent = 'Авторизация';

            userNavContainer.appendChild(registerLink);
            userNavContainer.appendChild(loginLink);
        }
    };

    // --- УПРАВЛЕНИЕ МОДАЛЬНЫМИ ОКНАМИ ---
    const openModal = (modal) => modal.classList.add('active');
    const closeModal = (modal) => modal.classList.remove('active');

    // --- ОБЩИЕ ФУНКЦИИ ВАЛИДАЦИИ ---
    const showError = (input, message) => {
        const formGroup = input.closest('.form-group, .form-group-checkbox');
        const error = formGroup.querySelector('.error-message');
        if (input.type !== 'checkbox') {
            input.classList.add('invalid');
            input.classList.remove('valid');
        }
        if (error) error.textContent = message;
    };

    const showSuccess = (input) => {
        const formGroup = input.closest('.form-group, .form-group-checkbox');
        const error = formGroup.querySelector('.error-message');
        if (input.type !== 'checkbox') {
            input.classList.add('valid');
            input.classList.remove('invalid');
        }
        if (error) error.textContent = '';
    };
    
    // --- ЛОГИКА АВТОРИЗАЦИИ ---
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        const email = loginEmailInput.value.trim();
        const password = loginPasswordInput.value;

        showSuccess(loginEmailInput);
        showSuccess(loginPasswordInput);

        if (!email || !password) {
            showError(loginPasswordInput.closest('form').querySelector('input'), 'Все поля обязательны для заполнения.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/users?email=${email}`);
            const users = await response.json();

            if (users.length === 0) {
                showError(loginEmailInput, 'Пользователь с таким email не найден.');
                return;
            }

            const user = users[0];
            if (user.password !== password) {
                showError(loginPasswordInput, 'Неверный пароль.');
                return;
            }

            localStorage.setItem('loggedInUser', JSON.stringify(user));
            updateHeaderUI();
            closeModal(loginModal);
            loginForm.reset();

        } catch (error) {
            console.error("Ошибка авторизации:", error);
            showError(loginPasswordInput, 'Произошла ошибка. Попробуйте позже.');
        }
    };

    // --- ЛОГИКА РЕГИСТРАЦИИ ---
    const getCommonPasswords = async () => {
        if (commonPasswords.length > 0) return;
        try {
            const response = await fetch(`${API_URL}/commonPasswords`);
            commonPasswords = await response.json();
        } catch (error) {
            console.error("Не удалось загрузить список паролей:", error);
        }
    };

    const validateRequiredField = (input, fieldName) => {
        if (input.value.trim() === '') {
            showError(input, `Поле "${fieldName}" обязательно`);
            return false;
        }
        showSuccess(input);
        return true;
    };

    const validatePhone = () => {
        const phoneRegex = /^\+375\s\(\d{2}\)\s\d{3}-\d{2}-\d{2}$/;
        if (!phoneRegex.test(phoneInput.value)) {
            showError(phoneInput, 'Формат: +375 (XX) XXX-XX-XX');
            return false;
        }
        showSuccess(phoneInput);
        return true;
    };

    const validateEmail = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value)) {
            showError(emailInput, 'Введите корректный email');
            return false;
        }
        showSuccess(emailInput);
        return true;
    };

    const validateDOB = () => {
        const dob = new Date(dobInput.value);
        if (isNaN(dob.getTime())) {
            showError(dobInput, 'Выберите вашу дату рождения');
            return false;
        }
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        if (age < 16) {
            showError(dobInput, 'Регистрация доступна только с 16 лет');
            return false;
        }
        showSuccess(dobInput);
        return true;
    };

    const validatePassword = () => {
        const p = passwordInput.value;
        if (p.length < 8 || p.length > 20) {
            showError(passwordInput, 'Пароль должен содержать от 8 до 20 символов');
            return false;
        }
        if (!/[A-Z]/.test(p) || !/[a-z]/.test(p) || !/\d/.test(p) || !/[!@#$%^&*()]/.test(p)) {
            showError(passwordInput, 'Нужны: заглавная, строчная, цифра и спецсимвол');
            return false;
        }
        if (commonPasswords.includes(p)) {
            showError(passwordInput, 'Этот пароль слишком простой, придумайте другой');
            return false;
        }
        showSuccess(passwordInput);
        return true;
    };

    const validatePasswordConfirm = () => {
        if (passwordConfirmInput.value !== passwordInput.value || passwordConfirmInput.value === '') {
            showError(passwordConfirmInput, 'Пароли не совпадают');
            return false;
        }
        showSuccess(passwordConfirmInput);
        return true;
    };

    const validateAgreement = () => {
        if (!agreementCheckbox.checked) {
            showError(agreementCheckbox, 'Необходимо принять пользовательское соглашение');
            return false;
        }
        showSuccess(agreementCheckbox);
        return true;
    };

    const generateNickname = () => {
        if (nicknameRegenerationCount >= 5) {
            nicknameInput.readOnly = false;
            nicknameInput.focus();
            showError(nicknameInput, 'Лимит исчерпан. Введите никнейм вручную.');
            return;
        }
        const fName = firstNameInput.value.trim();
        const lName = lastNameInput.value.trim();
        let base = '';
        const translit = (text) => {
            const map = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
            return text.toLowerCase().split('').map(char => map[char] || char).join('');
        };
        if (fName && lName) {
            const tFirstName = translit(fName);
            const tLastName = translit(lName);
            base = (tFirstName[0] || '').toUpperCase() + tFirstName.slice(1) + (tLastName[0] || '').toUpperCase() + tLastName.slice(1);
        } else {
            const a = ["Надежный", "Крепкий", "Стальной", "Искусный"];
            const n = ["Мастер", "Страж", "Профи", "Замок"];
            base = `${a[Math.floor(Math.random() * a.length)]}_${n[Math.floor(Math.random() * n.length)]}`;
        }
        nicknameInput.value = `${base}_${Math.floor(100 + Math.random() * 900)}`;
        showSuccess(nicknameInput);
        nicknameRegenerationCount++;
    };

    const generatePassword = () => {
        const len = 12;
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
        let pass = Array.from({length: len}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        if (!/[A-Z]/.test(pass)) pass += "Q";
        if (!/[a-z]/.test(pass)) pass += "w";
        if (!/\d/.test(pass)) pass += "1";
        if (!/[!@#$%^&*()]/.test(pass)) pass += "!";
        return pass.slice(0, len).split('').sort(() => 0.5 - Math.random()).join('');
    };

    const checkRegisterFormValidity = () => {
        const isManual = document.querySelector('input[name="password-method"]:checked').value === 'manual';
        
        const fieldsValid = [
            validateRequiredField(lastNameInput, 'Фамилия'),
            validateRequiredField(firstNameInput, 'Имя'),
            validatePhone(),
            validateEmail(),
            validateDOB(),
            validateAgreement()
        ].every(Boolean);

        const passwordValid = isManual ? (validatePassword() && validatePasswordConfirm()) : true;

        registerSubmitBtn.disabled = !(fieldsValid && passwordValid);
    };

    const handlePasswordMethodChange = () => {
        if (document.querySelector('input[name="password-method"]:checked').value === 'auto') {
            manualPasswordSection.style.display = 'none';
            const p = generatePassword();
            passwordInput.value = p;
            passwordConfirmInput.value = p;
            showSuccess(passwordInput);
            showSuccess(passwordConfirmInput);
        } else {
            manualPasswordSection.style.display = 'block';
            passwordInput.value = '';
            passwordConfirmInput.value = '';
        }
        checkRegisterFormValidity();
    };

    const resetRegisterForm = () => {
        registerForm.reset();
        document.querySelectorAll('#register-form .form-group input').forEach(i => {
            i.classList.remove('valid', 'invalid');
        });
        document.querySelectorAll('#register-form .error-message').forEach(e => {
            e.textContent = '';
        });
        nicknameRegenerationCount = 0;
        nicknameInput.readOnly = true;
        handlePasswordMethodChange();
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        checkRegisterFormValidity();
        if (registerSubmitBtn.disabled) return;
        
        const newUser = {
            fullName: `${lastNameInput.value.trim()} ${firstNameInput.value.trim()} ${middleNameInput.value.trim()}`.trim(),
            nickname: nicknameInput.value,
            email: emailInput.value,
            phone: phoneInput.value,
            birthDate: dobInput.value,
            password: passwordInput.value,
            role: "customer"
        };
        
        try {
            const response = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            if (!response.ok) throw new Error('Ошибка на сервере');
            
            const createdUser = await response.json();
            localStorage.setItem('loggedInUser', JSON.stringify(createdUser));
            updateHeaderUI();
            closeModal(registerModal);
            
        } catch(error) {
            console.error("Ошибка регистрации:", error);
            showError(registerSubmitBtn, 'Регистрация не удалась. Возможно, email уже занят.');
        }
    };

    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
    userNavContainer.addEventListener('click', (e) => {
        if (e.target.id === 'register-link') {
            e.preventDefault();
            resetRegisterForm();
            getCommonPasswords();
            generateNickname();
            openModal(registerModal);
        }
        if (e.target.id === 'login-link') {
            e.preventDefault();
            loginForm.reset();
            loginForm.querySelectorAll('.error-message').forEach(el => el.textContent = '');
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
            if (e.target === overlay) {
                closeModal(overlay);
            }
        });
    });
    
    if (registerForm) {
        registerForm.addEventListener('input', checkRegisterFormValidity);
        passwordConfirmInput.addEventListener('paste', e => e.preventDefault());
        passwordMethodRadios.forEach(r => r.addEventListener('change', handlePasswordMethodChange));
        regenerateNicknameBtn.addEventListener('click', generateNickname);
        registerForm.addEventListener('submit', handleRegisterSubmit);
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }

    // --- ИНИЦИАЛИЗАЦИЯ ---
    updateHeaderUI();
});