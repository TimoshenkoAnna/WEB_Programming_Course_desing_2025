function initSlider() {
    const sliderTrack = document.querySelector('.slider-track');
    if (!sliderTrack) {
        console.warn('Элемент .slider-track не найден.');
        return;
    }
    
    const slides = Array.from(sliderTrack.children);
    if (slides.length === 0) {
        console.warn('Слайды для инициализации слайдера не найдены.');
        const nextButtonHidden = document.querySelector('.slider-next');
        const prevButtonHidden = document.querySelector('.slider-prev');
        if(nextButtonHidden) nextButtonHidden.style.display = 'none';
        if(prevButtonHidden) prevButtonHidden.style.display = 'none';
        return;
    }

    const nextButton = document.querySelector('.slider-next');
    const prevButton = document.querySelector('.slider-prev');

    let currentIndex = 0;
    const slidesToShow = 3; 
    const slidesToScroll = 1;

    const maxIndex = slides.length - slidesToShow;

    const updateSliderPosition = () => {
        const slideWidth = slides[0].offsetWidth;
        const gap = parseInt(window.getComputedStyle(sliderTrack).gap, 10) || 16;
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
    updateSliderPosition(); 
}