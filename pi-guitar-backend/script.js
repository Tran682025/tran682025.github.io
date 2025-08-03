let audio;

document.getElementById("startButton").addEventListener("click", function () {
    if (!audio) {
        audio = new Audio("piano_mid.wav");
        audio.loop = true;
        audio.volume = 1.0;
    }

    audio.play().then(() => {
        document.getElementById("statusText").textContent = "🎶 Đang phát Bolero nền...";
    }).catch(err => {
        console.error("Không thể phát:", err);
        document.getElementById("statusText").textContent = "⚠️ Không thể phát nhạc, thử lại!";
    });
});
