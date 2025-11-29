// index.js
// Tranmarket Kingdom — ROOM V19.0
// Frontend clean build

(function () {
  const BACKEND_URL = "http://localhost:5000"; // chỉnh nếu anh dùng domain khác

  const state = {
    audio: null,
    isPlaying: false,
    focusOn: false,
    focusScrollTimer: null,
    scrollSpeed: 1, // 1.0 = mặc định
    backendHealthy: false,
    piReady: false,
  };

  // ===== Utils =====
  function $(selector) {
    return document.querySelector(selector);
  }

  function formatTime(secondsRaw) {
    if (isNaN(secondsRaw)) return "0:00";
    const total = Math.floor(secondsRaw);
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // ===== Player =====
  function initPlayer() {
    const audio = $("#audio");
    const playToggle = $("#play-toggle");
    const playIcon = $("#play-icon");
    const playLabel = $("#play-label");
    const timeCurrent = $("#time-current");
    const timeTotal = $("#time-total");
    const progressBar = $("#progress-bar");
    const rewind5 = $("#rewind-5");
    const forward5 = $("#forward-5");

    if (!audio || !playToggle || !progressBar) {
      console.warn("Player elements missing, skip initPlayer");
      return;
    }

    state.audio = audio;

    audio.addEventListener("loadedmetadata", () => {
      setText("time-total", formatTime(audio.duration));
    });

    audio.addEventListener("timeupdate", () => {
      setText("time-current", formatTime(audio.currentTime));
      const ratio = audio.duration ? audio.currentTime / audio.duration : 0;
      progressBar.style.width = `${Math.min(100, ratio * 100)}%`;
    });

    audio.addEventListener("ended", () => {
      state.isPlaying = false;
      playIcon.textContent = "▶";
      playLabel.textContent = "Play";
    });

    playToggle.addEventListener("click", () => {
      if (!state.audio) return;
      if (state.isPlaying) {
        state.audio.pause();
        state.isPlaying = false;
        playIcon.textContent = "▶";
        playLabel.textContent = "Play";
      } else {
        state.audio
          .play()
          .then(() => {
            state.isPlaying = true;
            playIcon.textContent = "⏸";
            playLabel.textContent = "Pause";
          })
          .catch((err) => {
            console.error("Play error:", err);
            alert("Không play được demo audio. Kiểm tra lại file audio/demo.mp3.");
          });
      }
    });

    if (rewind5) {
      rewind5.addEventListener("click", () => {
        if (!state.audio) return;
        state.audio.currentTime = Math.max(0, state.audio.currentTime - 5);
      });
    }

    if (forward5) {
      forward5.addEventListener("click", () => {
        if (!state.audio) return;
        const dur = state.audio.duration || 0;
        state.audio.currentTime = Math.min(dur, state.audio.currentTime + 5);
      });
    }

    // Space = play/pause
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" && !["INPUT", "TEXTAREA"].includes(e.target.tagName)) {
        e.preventDefault();
        playToggle.click();
      }
    });
  }

  // ===== Focus mode + auto scroll =====
  function updateFocusUI() {
    const body = document.body;
    const focusDot = $("#focus-status-dot");
    const focusText = $("#focus-status-text");
    const badge = $("#focus-indicator");
    const footerStatus = $("#chord-footer-status");

    if (state.focusOn) {
      body.classList.add("focus-on");
      if (focusDot) focusDot.classList.add("focus-active");
      if (focusText) focusText.textContent = "Bật · Chord sẽ tự cuộn nhẹ";
      if (badge) badge.textContent = "Focus: ON";
      if (footerStatus) footerStatus.textContent = "Focus mode · Auto scroll đang chạy";
    } else {
      body.classList.remove("focus-on");
      if (focusDot) focusDot.classList.remove("focus-active");
      if (focusText) focusText.textContent = "Tắt · Chord sẽ không tự cuộn";
      if (badge) badge.textContent = "Focus: OFF";
      if (footerStatus) footerStatus.textContent = "Ready · Focus đã tắt";
    }
  }

  function startAutoScroll() {
    const container = $("#chord-scroll");
    if (!container) return;

    stopAutoScroll();

    const baseSpeed = 0.35; // pixel mỗi tick ở speed=1
    const tickMs = 40;
    const delta = baseSpeed * state.scrollSpeed;

    state.focusScrollTimer = setInterval(() => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (container.scrollTop >= maxScroll) return;
      container.scrollTop = Math.min(maxScroll, container.scrollTop + delta);
    }, tickMs);
  }

  function stopAutoScroll() {
    if (state.focusScrollTimer) {
      clearInterval(state.focusScrollTimer);
      state.focusScrollTimer = null;
    }
  }

  function toggleFocusMode() {
    state.focusOn = !state.focusOn;
    if (state.focusOn) {
      startAutoScroll();
    } else {
      stopAutoScroll();
    }
    updateFocusUI();
  }

  function initFocusMode() {
    const btn = $("#focus-toggle");
    const slower = $("#scroll-slower");
    const faster = $("#scroll-faster");
    const label = $("#scroll-speed-label");
    const scrollContainer = $("#chord-scroll");

    if (!btn || !scrollContainer || !label) {
      console.warn("Focus elements missing, skip initFocusMode");
      return;
    }

    // Nút
    btn.addEventListener("click", () => toggleFocusMode());

    // Phím F bật/tắt focus
    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "f" && !["INPUT", "TEXTAREA"].includes(e.target.tagName)) {
        e.preventDefault();
        toggleFocusMode();
      }
    });

    // Tăng/giảm tốc độ
    function applySpeed() {
      label.textContent = `Scroll: x${state.scrollSpeed.toFixed(1)}`;
      if (state.focusOn) {
        startAutoScroll();
      }
    }

    if (slower) {
      slower.addEventListener("click", () => {
        state.scrollSpeed = Math.max(0.4, state.scrollSpeed - 0.2);
        applySpeed();
      });
    }
    if (faster) {
      faster.addEventListener("click", () => {
        state.scrollSpeed = Math.min(3.0, state.scrollSpeed + 0.2);
        applySpeed();
      });
    }

    // Mũi tên / PageUp / PageDown vẫn dùng cuộn tay
    if (scrollContainer) {
      scrollContainer.addEventListener("wheel", () => {
        if (state.focusOn) {
          // Người dùng cuộn tay thì giữ, không reset gì
        }
      });
    }

    updateFocusUI();
  }

  // ===== Backend =====
  async function checkBackend() {
    const statusText = $("#backend-status-text");
    const versionInfo = $("#version-info");
    try {
      if (statusText) statusText.textContent = "Backend: checking…";
      const res = await fetch(`${BACKEND_URL}/api/health`);
      if (!res.ok) throw new Error("Non-200");
      const data = await res.json();
      state.backendHealthy = true;
      if (statusText) statusText.textContent = "Backend: online";
      if (versionInfo) {
        versionInfo.textContent = `Index.js v19.0 · Backend: ${data.app || "OK"}`;
      }
    } catch (err) {
      console.warn("Backend health error:", err.message);
      state.backendHealthy = false;
      if (statusText) statusText.textContent = "Backend: offline";
      if (versionInfo) {
        versionInfo.textContent = "Index.js v19.0 · Backend offline";
      }
    }
  }

  async function saveSession() {
    const statusText = $("#session-status-text");
    if (statusText) {
      statusText.textContent = "Đang gửi session lên backend…";
    }

    if (!state.backendHealthy) {
      if (statusText) {
        statusText.textContent = "Backend offline · Session chỉ lưu tạm trên máy";
      }
      alert("Backend chưa online. Hãy chạy server.js và load lại trang.");
      return;
    }

    const payload = {
      focusOn: state.focusOn,
      scrollSpeed: state.scrollSpeed,
      trackTitle: $("#song-title")?.textContent || "Unknown",
      createdFrom: "TranmarketKingdom ROOM V19.0",
      ts: new Date().toISOString(),
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error("Save failed");
      if (statusText) {
        statusText.textContent = "Đã lưu session lên backend ✔";
      }
    } catch (err) {
      console.error("Save session error:", err);
      if (statusText) {
        statusText.textContent = "Lỗi khi lưu session lên backend";
      }
      alert("Không lưu được session. Kiểm tra lại backend hoặc BACKEND_URL.");
    }
  }

  function initBackendButtons() {
    const saveBtn = $("#save-session-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        saveSession();
      });
    }
  }

  // ===== Pi SDK =====
  function initPi() {
    const piBtn = $("#pi-login-btn");
    const piStatus = $("#pi-status-text");

    if (piStatus) {
      piStatus.textContent = "Đang kiểm tra Pi SDK…";
    }

    if (typeof window.Pi === "undefined") {
      if (piStatus) {
        piStatus.textContent = "Không tìm thấy Pi SDK · Chỉ chạy đầy đủ trong Pi Browser";
      }
      if (piBtn) {
        piBtn.addEventListener("click", () => {
          alert("Pi SDK chưa sẵn. Thử mở app này trong Pi Browser để login.");
        });
      }
      return;
    }

    // Pi SDK có tồn tại
    state.piReady = true;

    if (piStatus) {
      piStatus.textContent = "Pi SDK tìm thấy · Sẵn sàng thử login sandbox";
    }

    if (!piBtn) return;

    piBtn.addEventListener("click", async () => {
      if (!window.Pi) {
        alert("Pi SDK mất kết nối. Thử load lại trang trong Pi Browser.");
        return;
      }

      try {
        // Nhớ thay "YOUR_API_KEY_HERE" bằng key app thực tế trong môi trường Pi
        window.Pi.init({
          version: "2.0",
          sandbox: true,
        });

        const scopes = ["username", "payments"];
        const authPromise = window.Pi.authenticate(scopes, onIncompletePaymentFound);

        const auth = await authPromise;
        console.log("Pi auth result:", auth);

        if (piStatus) {
          piStatus.textContent = `Đăng nhập Pi: ${auth.user.username}`;
        }
      } catch (err) {
        console.error("Pi login error:", err);
        if (piStatus) {
          piStatus.textContent = "Lỗi Pi login (sandbox)";
        }
        alert("Pi login sandbox lỗi. Xem console để debug chi tiết.");
      }
    });
  }

  function onIncompletePaymentFound(payment) {
    console.log("Incomplete Pi payment found:", payment);
    // Chỗ này sau anh nối backend để complete/cancel payment
  }

  // ===== Init tổng =====
  function initApp() {
    initPlayer();
    initFocusMode();
    initBackendButtons();
    checkBackend();
    initPi();
  }

  // Run
  window.addEventListener("DOMContentLoaded", initApp);
})();
