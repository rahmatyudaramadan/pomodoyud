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
let waktuTargetSelesai;
let isRunning = false;
let wakeLock = null;

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

  if (isWorkPhase) {
    playAudio(audioStart);
  } else {
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
  if (isRunning) return;
  isRunning = true;

  playAudio(audioStart);
  aktifkanLayarTerus();

  // Hitung target waktu sejak tombol diklik
  waktuTargetSelesai = Date.now() + remainingSeconds * 1000;

  timerInterval = setInterval(() => {
    const waktuSekarang = Date.now();
    let selisihMiliDetik = waktuTargetSelesai - waktuSekarang;

    // JIKA WAKTU HABIS (Bisa Work habis, atau Break habis)
    if (selisihMiliDetik <= 0) {
      // 1. Ganti fase dulu (kalau tadinya Work berubah jadi Break, dan sebaliknya)
      switchPhase();

      // 2. KUNCI AUTO-LOOP: Hitung TARGET WAKTU BARU untuk fase berikutnya saat itu juga!
      waktuTargetSelesai = Date.now() + remainingSeconds * 1000;
      selisihMiliDetik = waktuTargetSelesai - waktuSekarang;

      // Jangan di-clearInterval! Biarkan intervalnya tetap hidup menggelinding
    }

    // Update sisa detik dan perbarui layar
    remainingSeconds = Math.ceil(selisihMiliDetik / 1000);
    updateDisplay();
  }, 200);

  // Atur status tombol
  btnStart.disabled = true;
  btnPause.disabled = false;
  btnReset.disabled = false;
}

function pauseTimer() {
  if (!isRunning) return;
  isRunning = false;

  playAudio(audioPause);
  lepasKunciLayar();

  // Matikan interval agar waktu berhenti mendetak
  clearInterval(timerInterval);

  btnStart.disabled = false;
  btnPause.disabled = true;
}

// === GANTI RE-LOGIC TICK ===
function tick() {
  // Fungsi ini sudah tidak dipakai karena digantikan logika setInterval di atas,
  // tapi kita biarkan kosong agar tidak memicu eror di tempat lain.
}

function resetTimer() {
  playAudio(audioReset);
  // FIX: Clear the correct interval variable
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  isRunning = false;
  isWorkPhase = true;
  remainingSeconds = WORK_DURATION;

  // FIX: Make sure the screen lock releases on reset
  lepasKunciLayar();

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

// Fungsi buat maksa layar HP tetep nyala
async function aktifkanLayarTerus() {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
      console.log("Layar dikunci agar tetep nyala!");
    }
  } catch (err) {
    console.log(`Gagal mengunci layar: ${err.message}`);
  }
}

// Fungsi buat ngelepas kunci (biar HP bisa mati lagi pas timer distop/selesai)
function lepasKunciLayar() {
  if (wakeLock !== null) {
    wakeLock.release();
    wakeLock = null;
    console.log("Kunci layar dilepas.");
  }
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
