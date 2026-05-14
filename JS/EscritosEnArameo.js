// ── AOS (scroll animations)
AOS.init();

// ── NAVBAR HAMBURGER
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
});

// Close menu when a link is clicked
mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
    });
});

// ── BACKGROUND VIDEO LOOP
const video = document.getElementById('bgVideo');
const videos = [
    'ASSETS/Videos/video1.mp4',
    'ASSETS/Videos/video2.mp4'
];
let videoIndex = 0;

video.src = videos[videoIndex];
video.play();

video.addEventListener('ended', () => {
    videoIndex = (videoIndex + 1) % videos.length;
    video.src = videos[videoIndex];
    video.play();
});

// ── D20 DICE ROLLER
const rollBtn    = document.getElementById('rollBtn');
const diceImg    = document.getElementById('diceImg');
const diceNumber = document.getElementById('diceNumber');
const diceResult = document.getElementById('diceResult');

rollBtn.addEventListener('click', () => {
    diceImg.classList.add('roll');

    setTimeout(() => {
        diceImg.classList.remove('roll');

        const result = Math.floor(Math.random() * 20) + 1;
        diceNumber.textContent = result;
        diceResult.textContent = 'Result: ' + result;

        if (result === 20) {
            diceResult.style.color = 'gold';
        } else if (result === 1) {
            diceResult.style.color = 'red';
        } else {
            diceResult.style.color = 'white';
        }
    }, 800);
});

// ── FLICKITY CAROUSEL
const carousel = document.querySelector('.main-carousel');

if (carousel) {
    new Flickity(carousel, {
        cellAlign: 'left',
        contain: true,
        wrapAround: true,
        autoPlay: 2500,
        pauseAutoPlayOnHover: true,
        imagesLoaded: true,
        pageDots: false
    });
}
