(() => {
    // Бургер-меню
    const mobileMenu = document.querySelector('.mobile-menu');
    const headerNav = document.querySelector('.header-nav');
    const navDropdown = document.querySelector('.nav-dropdown');

    if (mobileMenu && headerNav) {
        mobileMenu.addEventListener('click', () => {
            mobileMenu.classList.toggle('nav-active');
            headerNav.classList.toggle('nav-active');
        });
    }

    if (navDropdown) {
        navDropdown.addEventListener('click', (e) => {
            if (window.innerWidth <= 1000) {
                e.preventDefault();
                navDropdown.classList.toggle('nav-active');
            }
        });
    }

    // Слайдер
    const sliderTrack = document.querySelector('.slider-track');
    const slides = Array.from(sliderTrack.children);
    const nextButton = document.querySelector('.slider-next');
    const prevButton = document.querySelector('.slider-prev');

    if (!sliderTrack) {
        return;
    }

    let currentIndex = 0;
    const slidesToShow = 3;
    const slidesToScroll = 1;

    const maxIndex = slides.length - slidesToShow;

    const updateSliderPosition = () => {
        const slideWidth = slides[0].offsetWidth;
        const gap = parseInt(window.getComputedStyle(sliderTrack).gap, 10);
        const offset = -currentIndex * (slideWidth + gap);
        sliderTrack.style.transform = `translateX(${offset}px)`;
    };

    const updateButtonsState = () => {
        prevButton.disabled = currentIndex === 0;
        nextButton.disabled = currentIndex >= maxIndex;
    };

    nextButton.addEventListener('click', () => {
        currentIndex = Math.min(currentIndex + slidesToScroll, maxIndex);
        updateSliderPosition();
        updateButtonsState();
    });

    prevButton.addEventListener('click', () => {
        currentIndex = Math.max(currentIndex - slidesToScroll, 0);
        updateSliderPosition();
        updateButtonsState();
    });

    window.addEventListener('resize', updateSliderPosition);
    
    updateButtonsState();
})();