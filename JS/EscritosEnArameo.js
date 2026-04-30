document.addEventListener("DOMContentLoaded", () => {
    const video = document.getElementById("bgVideo");

    const videos = [
        "ASSETS/Videos/video1.mp4",
        "ASSETS/Videos/video2.mp4"
    ];

    let index = 0;

    // cargar primer video
    video.src = videos[index];
    video.play();

    video.addEventListener("ended", () => {
        index = (index + 1) % videos.length;
        video.src = videos[index];
        video.play();
    });
});