const statusLabel = document.getElementById("status-label");
const timerDisplay = document.getElementById("timer-display");
const btnStart = document.getElementById("btn-start");
const btnPause = document.getElementById("btn-pause");
const btnReset = document.getElementById("btn-reset");

const volumeSlider = document.getElementById("volume-slider");
const volumeContainer = document.querySelector(".volume-control");
const volumeBtn = document.getElementById("volume-btn");

const audioStart = document.getElementById("audio-start");
const audioPause = document.getElementById("audio-pause");
const audioReset = document.getElementById("audio-reset");
const audioBreakPool = document.querySelectorAll(".audio-break-pool");

const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

let remainingSeconds = WORK_DURATION;
let intervalId = null;
let isWorkPhase = true;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function updateDisplay() {
  timerDisplay.textContent = formatTime(remainingSeconds);
  statusLabel.textContent = isWorkPhase ? "Work Time" : "Break Time";
  document.body.dataset.phase = isWorkPhase ? "work" : "break";
}

function playAudio(audioElement) {
  if (!audioElement) return;
  audioElement.currentTime = 0;
  audioElement
    .play()
    .catch((err) => console.log("Autoplay diblokir browser:", err));
}

function switchPhase() {
  isWorkPhase = !isWorkPhase;
  remainingSeconds = isWorkPhase ? WORK_DURATION : BREAK_DURATION;
  updateDisplay();

  // LOGIKA SAAT TIMER HABIS OTOMATIS PANDAH FASE
  if (isWorkPhase) {
    playAudio(audioStart);
  } else {
    // Kalau waktu kerja habis, kita gacha suara gembira dari pool audio break!
    const randomIndex = Math.floor(Math.random() * audioBreakPool.length);
    playAudio(audioBreakPool[randomIndex]);
  }
}

function tick() {
  if (remainingSeconds <= 0) {
    switchPhase();
    return;
  }
  remainingSeconds -= 1;
  updateDisplay();
}

function startTimer() {
  if (intervalId !== null) return;
  if (isWorkPhase) {
    playAudio(audioStart);
    btnReset.disabled = false;
  } else {
    // Kalau dia ngelanjutin break setelah sempat di-pause
    const randomIndex = Math.floor(Math.random() * audioBreakPool.length);
    playAudio(audioBreakPool[randomIndex]);
  }

  intervalId = window.setInterval(tick, 1000);
  btnStart.disabled = true;
  btnPause.disabled = false;
}

function pauseTimer() {
  if (intervalId === null) return;
  playAudio(audioPause);
  clearInterval(intervalId);
  intervalId = null;
  btnStart.disabled = false;
  btnPause.disabled = true;
}

function resetTimer() {
  playAudio(audioReset);
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  isWorkPhase = true;
  remainingSeconds = WORK_DURATION;
  updateDisplay();
  btnStart.disabled = false;
  btnPause.disabled = true;
  btnReset.disabled = true;
}

function updateVolume() {
  const currentVolume = volumeSlider.value; // Mengambil angka dari slider (0.0 sampai 1.0)

  // Set volume untuk single audio
  audioStart.volume = currentVolume;
  audioPause.volume = currentVolume;
  audioReset.volume = currentVolume;

  // Set volume untuk semua audio yang ada di dalam gacha pool (Array)
  audioBreakPool.forEach((audio) => {
    audio.volume = currentVolume;
  });
}

volumeBtn.addEventListener("click", (e) => {
  // Mencegah trigger bawaan HTML (karena label nempel ke input)
  e.preventDefault();

  // Buka atau tutup slidernya
  volumeContainer.classList.toggle("active");
});
document.addEventListener("click", (e) => {
  if (!volumeContainer.contains(e.target)) {
    volumeContainer.classList.remove("active");
  }
});
volumeSlider.addEventListener("input", updateVolume);

// Pasang Event Listener ke tombol
btnStart.addEventListener("click", startTimer);
btnPause.addEventListener("click", pauseTimer);
btnReset.addEventListener("click", resetTimer);

// Inisialisasi tampilan awal
updateDisplay();
btnPause.disabled = true;
btnReset.disabled = true;

updateVolume();
