function initSlider() {
    const sliderTrack = document.querySelector('.slider-track');
    const nextButton = document.querySelector('.slider-next');
    const prevButton = document.querySelector('.slider-prev');

    if (!sliderTrack || !nextButton || !prevButton) {
        return;
    }
    
    const slides = Array.from(sliderTrack.children);
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
}

window.initSlider = initSlider;

document.addEventListener('DOMContentLoaded', initSlider);