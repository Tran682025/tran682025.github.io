// FYKINGDOM v0.4 + Tran682025 Pi Login/Payment panel

// === Backend URL cho Pi Payment (tùy chọn) ===
const BACKEND_URL = "https://d6a3c212fcc1.ngrok-free.app";

// Để trống nếu chỉ muốn test client.
// Nếu có backend: ví dụ "https://curvy-parts-flash.loca.lt"

// ====== PHẦN 1: FYKINGDOM (audio, pattern, rec, help) ======

let mediaRecorder = null;
let recordedChunks = [];
let userRecordingUrl = null;

document.addEventListener("DOMContentLoaded", () => {
  // DOM refs cho FYKINGDOM
  const audioPlayer = document.getElementById("audioPlayer");
  const playBtn = document.getElementById("playBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const stopBtn = document.getElementById("stopBtn");
  const speedSlider = document.getElementById("speedSlider");
  const speedLabel = document.getElementById("speedLabel");
  const volumeSlider = document.getElementById("volumeSlider");

  const lyricsInput = document.getElementById("lyricsInput");
  const patternInput = document.getElementById("patternInput");
  const applyPatternBtn = document.getElementById("applyPatternBtn");
  const autoFillPatternBtn = document.getElementById("autoFillPatternBtn");
  const lyricsWithChordsOutput = document.getElementById("lyricsWithChordsOutput");
  const keyInput = document.getElementById("keyInput");
  const mp3FileInput = document.getElementById("mp3FileInput");
  const lyricsPreview = document.getElementById("lyricsPreview");

  const startRecBtn = document.getElementById("startRecBtn");
  const stopRecBtn = document.getElementById("stopRecBtn");
  const userRecordingAudio = document.getElementById("userRecordingAudio");
  const recStatusText = document.getElementById("recText");
  const recDot = document.getElementById("recDot");

  const helpModal = document.getElementById("helpModal");
  const openHelpBtn = document.getElementById("openHelpBtn");
  const closeHelpBtn = document.getElementById("closeHelpBtn");
  const tabButtons = document.querySelectorAll(".tab");
  const chipPresets = document.querySelectorAll(".btn-soft[data-preset]");

  // 1. Audio player basic behaviour
  if (audioPlayer) {
    audioPlayer.volume = parseFloat(volumeSlider.value);

    playBtn.addEventListener("click", () => {
      if (!audioPlayer.src) {
        const file = mp3FileInput.files && mp3FileInput.files[0];
        if (file) {
          const url = URL.createObjectURL(file);
          audioPlayer.src = url;
        }
      }
      audioPlayer.play().catch(() => {});
    });

    pauseBtn.addEventListener("click", () => {
      audioPlayer.pause();
    });

    stopBtn.addEventListener("click", () => {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
    });

    speedSlider.addEventListener("input", () => {
      const val = parseFloat(speedSlider.value);
      audioPlayer.playbackRate = val;
      speedLabel.textContent = val.toFixed(2) + "×";
    });

    volumeSlider.addEventListener("input", () => {
      audioPlayer.volume = parseFloat(volumeSlider.value);
    });

    mp3FileInput.addEventListener("change", () => {
      const file = mp3FileInput.files && mp3FileInput.files[0];
      if (!file) return;
      if (audioPlayer.src) URL.revokeObjectURL(audioPlayer.src);
      const url = URL.createObjectURL(file);
      audioPlayer.src = url;
    });
  }

  // 2. Pattern helpers
  chipPresets.forEach(chip => {
    chip.addEventListener("click", () => {
      patternInput.value = chip.dataset.preset || "";
      patternInput.focus();
    });
  });

  if (autoFillPatternBtn) {
    autoFillPatternBtn.addEventListener("click", () => {
      const key = (keyInput.value || "").trim().toUpperCase();
      let pattern = "";

      if (key === "G") pattern = "G D Em C";
      else if (key === "C") pattern = "C G Am F";
      else if (key === "D") pattern = "D A Bm G";
      else if (key === "E") pattern = "E B C#m A";
      else if (key === "A") pattern = "A E F#m D";
      else pattern = "C G Am F";

      patternInput.value = pattern;
    });
  }

  if (applyPatternBtn) {
    applyPatternBtn.addEventListener("click", () => {
      const rawLyrics = lyricsInput.value;
      const rawPattern = patternInput.value;

      const pattern = parsePattern(rawPattern);
      if (!pattern.length) {
        lyricsWithChordsOutput.textContent =
          "[lỗi] Chưa có pattern hợp âm. Hãy nhập ví dụ: C G Am F";
        return;
      }

      const result = applyPatternToLyrics(rawLyrics, pattern);
      lyricsWithChordsOutput.textContent = result || "[trống] Chưa có dòng hợp lệ.";
      lyricsPreview.textContent = result || lyricsPreview.textContent;
    });
  }

  // 3. Recording
  if (startRecBtn && stopRecBtn) {
    startRecBtn.addEventListener("click", startRecording);
    stopRecBtn.addEventListener("click", stopRecording);
  }

  async function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Trình duyệt không hỗ trợ ghi âm (MediaRecorder).");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunks = [];
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: "audio/webm" });
        if (userRecordingUrl) URL.revokeObjectURL(userRecordingUrl);
        userRecordingUrl = URL.createObjectURL(blob);
        userRecordingAudio.src = userRecordingUrl;
        userRecordingAudio.play().catch(() => {});
        if (recDot) recDot.style.display = "none";
        if (recStatusText) recStatusText.textContent = "Đã thu xong · có thể phát lại";
      };

      mediaRecorder.start();
      if (recDot) recDot.style.display = "inline-block";
      if (recStatusText) recStatusText.textContent = "Đang thu… nói hoặc hát vào mic";

      if (audioPlayer && audioPlayer.paused) {
        audioPlayer.play().catch(() => {});
      }
    } catch (err) {
      console.error("startRecording error", err);
      alert("Không thể truy cập micro: " + err.message);
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    } else {
      if (recDot) recDot.style.display = "none";
      if (recStatusText) recStatusText.textContent = "Idle";
    }
  }

  // 4. Help modal
  if (openHelpBtn && helpModal) {
    openHelpBtn.addEventListener("click", () => {
      helpModal.style.display = "flex";
    });
  }
  if (closeHelpBtn && helpModal) {
    closeHelpBtn.addEventListener("click", () => {
      helpModal.style.display = "none";
    });
    helpModal.addEventListener("click", (e) => {
      if (e.target === helpModal) helpModal.style.display = "none";
    });
  }

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.helpTab;
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll("[data-help-content]").forEach(el => {
        el.style.display = el.dataset.helpContent === tab ? "block" : "none";
      });
    });
  });
});

// Helpers cho pattern
function parsePattern(rawPattern) {
  if (!rawPattern) return [];
  return rawPattern
    .split(/\s+/)
    .map(ch => ch.trim())
    .filter(Boolean);
}

function applyPatternToLyrics(rawLyrics, pattern) {
  if (!rawLyrics.trim()) return "";
  const lines = rawLyrics.split(/\r?\n/);
  const outLines = [];
  let chordIndex = 0;

  for (const line of lines) {
    if (!line.trim()) {
      outLines.push("");
      continue;
    }

    const chord = pattern[chordIndex % pattern.length];
    chordIndex++;

    const matchTs = line.match(/^(\s*\[[0-9:.]+\]\s*)(.*)$/);
    if (matchTs) {
      const ts = matchTs[1];
      const rest = matchTs[2];
      outLines.push(`${ts}${rest}    ${chord}`);
    } else {
      outLines.push(`${line}    ${chord}`);
    }
  }

  return outLines.join("\n");
}

// ====== PHẦN 2: Pi SDK Login + Payment (Step 10) ======

document.addEventListener("DOMContentLoaded", () => {
  const sdkStatusDot = document.getElementById("sdkStatusDot");
  const sdkStatusText = document.getElementById("sdkStatusText");
  const loginBtn = document.getElementById("loginBtn");
  const loginLog = document.getElementById("loginLog");
  const scopeInput = document.getElementById("scopeInput");
  const loginNoteInput = document.getElementById("loginNoteInput");

  const payBtn = document.getElementById("payBtn");
  const paymentLog = document.getElementById("paymentLog");
  const amountInput = document.getElementById("amountInput");
  const memoInput = document.getElementById("memoInput");
  const metadataInput = document.getElementById("metadataInput");

  if (!sdkStatusDot || !sdkStatusText || !loginBtn || !payBtn) {
    // nếu thiếu panel thì bỏ qua
    return;
  }

  let piAvailable = false;

  function appendLog(el, msg) {
    const time = new Date().toISOString().split("T")[1].split(".")[0];
    el.textContent += `\n[${time}] ${msg}`;
    el.scrollTop = el.scrollHeight;
  }

  if (window.Pi) {
    try {
      window.Pi.init({
        version: "2.0",
        sandbox: true,
      });
      piAvailable = true;
      sdkStatusDot.classList.add("status-ok");
      sdkStatusText.textContent = "Pi SDK sẵn sàng (Testnet / Sandbox)";
      loginBtn.disabled = false;
      payBtn.disabled = false;

      loginLog.textContent =
        "[Login] Sẵn sàng. Bấm “Đăng nhập bằng Pi (Testnet)” trong Pi Browser.";
      paymentLog.textContent =
        "[Payment] Sẵn sàng. Bấm “Tạo thanh toán Pi (Testnet)” để tạo giao dịch thử.";
    } catch (err) {
      sdkStatusText.textContent = "Lỗi init Pi SDK: " + err.message;
      appendLog(loginLog, "Pi.init error: " + err.message);
      loginBtn.disabled = true;
      payBtn.disabled = true;
    }
  } else {
    sdkStatusText.textContent =
      "Không tìm thấy Pi SDK. Nếu bạn đang dùng Pi Browser, có thể đang mở bằng URL thường.";
    loginBtn.disabled = true;
    payBtn.disabled = true;

    loginLog.textContent =
      "[Login] Đang xem bằng trình duyệt thường.\nMở app Tran682025 trong mục Develop của Pi Browser để test đăng nhập.";
    paymentLog.textContent =
      "[Payment] Đang xem bằng trình duyệt thường.\nMở app Tran682025 trong mục Develop của Pi Browser để test thanh toán.";
  }

  // Login
  loginBtn.addEventListener("click", async () => {
    if (!piAvailable) {
      alert("Pi SDK chưa hoạt động. Hãy mở trong Pi Browser (Develop → Tran682025).");
      return;
    }

    const scopes = scopeInput.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    appendLog(loginLog, `Bắt đầu Pi.authenticate với scope: [${scopes.join(", ")}]`);

    const onIncompletePaymentFound = (payment) => {
      appendLog(
        loginLog,
        "onIncompletePaymentFound: " + JSON.stringify(payment, null, 2)
      );
    };

    try {
      const authResult = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
      appendLog(loginLog, "Kết quả auth: " + JSON.stringify(authResult, null, 2));

      if (loginNoteInput.value.trim()) {
        appendLog(loginLog, "Ghi chú: " + loginNoteInput.value.trim());
      }
    } catch (err) {
      appendLog(loginLog, "Lỗi authenticate: " + err.message);
      alert("Login lỗi: " + err.message);
    }
  });

  // Payment
  payBtn.addEventListener("click", async () => {
    if (!piAvailable) {
      alert("Pi SDK chưa hoạt động. Hãy mở trong Pi Browser (Develop → Tran682025).");
      return;
    }

    const amount = parseFloat(amountInput.value) || 0;
    const memo = memoInput.value || "Tran682025 Test Payment";

    let metadata = {};
    try {
      metadata = JSON.parse(metadataInput.value);
    } catch (err) {
      alert("Metadata không phải JSON hợp lệ. Sửa lại trước khi gửi.");
      return;
    }

    appendLog(
      paymentLog,
      `Tạo payment: amount=${amount}, memo="${memo}", metadata=${JSON.stringify(
        metadata
      )}`
    );

    const paymentData = {
      amount,
      memo,
      metadata,
    };

    const callbacks = {
      onReadyForServerApproval: async (paymentId) => {
        appendLog(paymentLog, "onReadyForServerApproval: " + paymentId);
        try {
          if (BACKEND_URL && BACKEND_URL.startsWith("http")) {
            await fetch(`${BACKEND_URL}/payments/approve`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId }),
            });
            appendLog(paymentLog, "Đã gửi approve tới backend.");
          } else {
            appendLog(
              paymentLog,
              "BACKEND_URL chưa cấu hình – chỉ log ở client, không gọi server."
            );
          }
        } catch (err) {
          appendLog(paymentLog, "Lỗi fetch approve: " + err.message);
        }
      },
      onReadyForServerCompletion: async (paymentId, txid) => {
        appendLog(
          paymentLog,
          `onReadyForServerCompletion: paymentId=${paymentId}, txid=${txid}`
        );
        try {
          if (BACKEND_URL && BACKEND_URL.startsWith("http")) {
            await fetch(`${BACKEND_URL}/payments/complete`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, txid }),
            });
            appendLog(paymentLog, "Đã gửi complete tới backend.");
          } else {
            appendLog(
              paymentLog,
              "BACKEND_URL chưa cấu hình – chỉ log ở client, không gọi server."
            );
          }
        } catch (err) {
          appendLog(paymentLog, "Lỗi fetch complete: " + err.message);
        }
      },
      onCancel: (paymentId) => {
        appendLog(paymentLog, "Người dùng hủy payment: " + paymentId);
      },
      onError: (error, payment) => {
        appendLog(
          paymentLog,
          "Lỗi payment: " + error + " | payment=" +
            JSON.stringify(payment || {}, null, 2)
        );
      },
    };

    try {
      const payment = await window.Pi.createPayment(paymentData, callbacks);
      appendLog(paymentLog, "createPayment() trả về: " + JSON.stringify(payment, null, 2));
    } catch (err) {
      appendLog(paymentLog, "Lỗi createPayment: " + err.message);
      alert("Payment lỗi: " + err.message);
    }
  });
});
