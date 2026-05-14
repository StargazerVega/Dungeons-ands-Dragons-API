AOS.init();



// Video
document.addEventListener("DOMContentLoaded", () => {
    const video = document.getElementById("bgVideo");
    const videos = [
        "ASSETS/Videos/video1.mp4",
        "ASSETS/Videos/video2.mp4"
    ];
    let index = 0;

    video.src = videos[index];
    video.play();

    video.addEventListener("ended", () => {
        index = (index + 1) % videos.length;
        video.src = videos[index];
        video.play();
    });
});


const rollBtn = document.getElementById("rollBtn");
const diceImg = document.getElementById("diceImg");
const diceNumber = document.getElementById("diceNumber");
const diceResult = document.getElementById("diceResult");

rollBtn.addEventListener("click", () => {
  
  diceImg.classList.add("roll");
  
  setTimeout(() => {
    diceImg.classList.remove("roll");
    
    const result = Math.floor(Math.random() * 20) + 1;
    
    diceNumber.textContent = result;
    diceResult.textContent = "Resultado: " + result;
    
    if(result === 20) {
      diceResult.style.color = "gold";
    } else if(result === 1) {
      diceResult.style.color = "red";
    } else {
      diceResult.style.color = "white";
    }
    
  }, 800);
});

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



