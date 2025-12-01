// Chordifykingdom v1.0 + Tran682025 Pi Login/Payment panel
// Chuẩn hóa: Golden Turtle Edition (musickingdom), Pi SDK v2, pending-safe.

// === Backend URL cho Pi Payment (tùy chọn, đã bỏ khoảng trắng thừa) ===
const BACKEND_URL = "https://9bf7eba97a89.ngrok-free.app";

// ====== I18N đơn giản VN / EN cho phần UI chính ======
const I18N = {
  vn: {
    bannerTitle: "PiChordify Kingdom · Tran682025",
    bannerDescription:
      "Công cụ gợi ý hợp âm & luyện hát trong hệ sinh thái Pi – bản dành riêng cho thử nghiệm frontend, chạy trên domain Tran682025 cùng với Pi Login & Pi Payment (Testnet) để hoàn thành Checklist trên Pi App Platform.",
    bannerVersionLabel: "Tran682025 · Golden Turtle Edition",
    bannerSubline: "FYKINGDOM v1.0 · Pi SDK SANDBOX",
    bannerSmall: "Testnet gateway for Pi apps",
    newSongTitle: "Bản nhạc mới (giao diện demo)",
    composerPill: "Composer panel",
    instrumentLabel: "Nhạc cụ",
    songTitleLabel: "Tên bài",
    keyLabel: "Giọng (key)",
    progressionLabel: "Tiến trình: I–V–vi–IV",
    lyricsSectionTitle: "Lời + hợp âm (có mốc thời gian)",
    lyricsHint:
      "Mỗi dòng có thể bắt đầu bằng mốc thời gian, ví dụ: [00:12] Ngày mai…",
    patternSectionTitle: "Mẫu hợp âm cho cả bài (pattern)",
    patternHint:
      "Ví dụ: G D Em C hoặc C G Am F G F Em Am. App sẽ lặp lại pattern theo từng dòng lời.",
    mp3SectionTitle: "File MP3 (tùy chọn)",
    mp3Hint: "Chọn file beat hoặc bản demo để luyện trong Player.",
    playerTitle: "FYKINGDOM Player",
    practicePill: "Practice panel",
    speedLabelText: "Tốc độ / BPM",
    volumeLabel: "Âm lượng",
    recLabel: "Bản thu của bạn",
    videoRoomHint:
      "Kênh giao lưu học viên & giảng viên (bản DEV – placeholder).",
    devModeText:
      "Đang chạy ở trạng thái: Chế độ DEV, thanh toán Pi chỉ chạy khi Pi SDK (client) & backend UP, Pi Payment mở trên app Pi và test (SANDBOX).",
    piPanelTitle: "Pi Login & Pi Payment (Testnet)",
    piPanelSubtitle:
      "Panel dùng để hoàn thành bước 10 Checklist trong Pi App Platform cho app Tran682025.",
    sdkStatusChecking: "Đang kiểm tra Pi SDK…",
    compressPanelBtnExpand: "Thu gọn panel",
    compressPanelBtnCollapse: "Mở rộng panel",
    scopeLabel: "Scope",
    loginNoteLabel: "Ghi chú login",
    paymentSectionTitle: "Pi Payment (Testnet)",
    amountLabel: "Số Pi (test)",
    memoLabel: "Memo",
    metadataLabel: "Metadata (JSON)",
    helpTitle: "Hướng dẫn sử dụng PiChordify Kingdom",
    helpSubtitle: "Tóm tắt cách học với app · VN / EN / Dev notes",
    langToggle: "VN / EN",
    sdkBadge: "Pi SDK ready (SANDBOX)",
    playlistTitle: "Danh sách bản demo",
  },
  en: {
    bannerTitle: "PiChordify Kingdom · Tran682025",
    bannerDescription:
      "Chord suggestion & vocal practice tool in the Pi ecosystem – frontend test build on Tran682025 domain with Pi Login & Pi Payment (Testnet) to complete the Pi App Platform Checklist.",
    bannerVersionLabel: "Tran682025 · Golden Turtle Edition",
    bannerSubline: "FYKINGDOM v1.0 · Pi SDK SANDBOX",
    bannerSmall: "Testnet gateway for Pi apps",
    newSongTitle: "New song (demo UI)",
    composerPill: "Composer panel",
    instrumentLabel: "Instrument",
    songTitleLabel: "Song title",
    keyLabel: "Key",
    progressionLabel: "Progression: I–V–vi–IV",
    lyricsSectionTitle: "Lyrics + chords (with timestamps)",
    lyricsHint:
      "Each line may start with a timestamp, for example: [00:12] Tomorrow…",
    patternSectionTitle: "Chord pattern for the whole song",
    patternHint:
      "Example: G D Em C or C G Am F G F Em Am. The app loops this pattern per lyric line.",
    mp3SectionTitle: "MP3 file (optional)",
    mp3Hint: "Choose a backing track or demo to practice with the Player.",
    playerTitle: "FYKINGDOM Player",
    practicePill: "Practice panel",
    speedLabelText: "Speed / BPM",
    volumeLabel: "Volume",
    recLabel: "Your recording",
    videoRoomHint:
      "Student & teacher hangout channel (DEV placeholder).",
    devModeText:
      "Running in DEV mode: Pi payments only work when Pi SDK (client) & backend are UP and the app is opened in Pi Browser (SANDBOX).",
    piPanelTitle: "Pi Login & Pi Payment (Testnet)",
    piPanelSubtitle:
      "Panel used to complete Step 10 in the Pi App Platform Checklist for the Tran682025 app.",
    sdkStatusChecking: "Checking Pi SDK…",
    compressPanelBtnExpand: "Collapse panel",
    compressPanelBtnCollapse: "Expand panel",
    scopeLabel: "Scope",
    loginNoteLabel: "Login note",
    paymentSectionTitle: "Pi Payment (Testnet)",
    amountLabel: "Pi amount (test)",
    memoLabel: "Memo",
    metadataLabel: "Metadata (JSON)",
    helpTitle: "How to use PiChordify Kingdom",
    helpSubtitle: "Quick guide · VN / EN / Dev notes",
    langToggle: "EN / VN",
    sdkBadge: "Pi SDK ready (SANDBOX)",
    playlistTitle: "Demo playlist",
  },
};

// ====== PHẦN 1: FYKINGDOM (audio, pattern, rec, help, i18n, video) ======

let mediaRecorder = null;
let recordedChunks = [];
let userRecordingUrl = null;
let isRecording = false;
let currentLang = "vn";

document.addEventListener("DOMContentLoaded", () => {
  // DOM refs cho FYKINGDOM
  const audioPlayer = document.getElementById("audioPlayer");
  const playBtn = document.getElementById("playBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const stopBtn = document.getElementById("stopBtn");
  const speedSlider = document.getElementById("speedSlider");
  const speedLabel = document.getElementById("speedLabel");
  const speedLabelText = document.getElementById("speedLabelText");
  const volumeSlider = document.getElementById("volumeSlider");
  const volumeLabel = document.getElementById("volumeLabel");

  const lyricsInput = document.getElementById("lyricsInput");
  const patternInput = document.getElementById("patternInput");
  const applyPatternBtn = document.getElementById("applyPatternBtn");
  const autoFillPatternBtn = document.getElementById("autoFillPatternBtn");
  const lyricsWithChordsOutput = document.getElementById(
    "lyricsWithChordsOutput"
  );
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

  const videoRoomBtn = document.getElementById("videoRoomBtn");
  const langToggleBtn = document.getElementById("langToggleBtn");

  // I18N: áp dụng text cho UI tĩnh chính
  function applyI18n() {
    const dict = I18N[currentLang];
    if (!dict) return;

    const ids = {
      bannerTitle: "bannerTitle",
      bannerDescription: "bannerDescription",
      bannerVersionLabel: "bannerVersionLabel",
      bannerSubline: "bannerSubline",
      bannerSmall: "bannerSmall",
      newSongTitle: "newSongTitle",
      composerPill: "composerPill",
      instrumentLabel: "instrumentLabel",
      songTitleLabel: "songTitleLabel",
      keyLabel: "keyLabel",
      progressionLabel: "progressionLabel",
      lyricsSectionTitle: "lyricsSectionTitle",
      lyricsHint: "lyricsHint",
      patternSectionTitle: "patternSectionTitle",
      patternHint: "patternHint",
      mp3SectionTitle: "mp3SectionTitle",
      mp3Hint: "mp3Hint",
      playerTitle: "playerTitle",
      practicePill: "practicePill",
      speedLabelText: "speedLabelText",
      volumeLabel: "volumeLabel",
      recLabel: "recLabel",
      videoRoomHint: "videoRoomHint",
      piPanelTitle: "piPanelTitle",
      piPanelSubtitle: "piPanelSubtitle",
      scopeLabel: "scopeLabel",
      loginNoteLabel: "loginNoteLabel",
      paymentSectionTitle: "paymentSectionTitle",
      amountLabel: "amountLabel",
      memoLabel: "memoLabel",
      metadataLabel: "metadataLabel",
      helpTitle: "helpTitle",
      helpSubtitle: "helpSubtitle",
      sdkBadge: "sdkBadge",
    };

    Object.entries(ids).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (el && typeof dict[key] === "string") {
        el.textContent = dict[key];
      }
    });

    const devModeTextEl = document.getElementById("devModeText");
    if (devModeTextEl && dict.devModeText) {
      devModeTextEl.innerHTML = dict.devModeText.replace(
        "Chế độ DEV",
        "<strong>Chế độ DEV</strong>"
      );
      if (currentLang === "en") {
        devModeTextEl.innerHTML = dict.devModeText.replace(
          "DEV mode",
          "<strong>DEV mode</strong>"
        );
      }
    }

    if (langToggleBtn && dict.langToggle) {
      langToggleBtn.textContent = dict.langToggle;
    }

    const playlistBlock = document.getElementById("playlistBlock");
    if (playlistBlock && dict.playlistTitle) {
      const html =
        currentLang === "vn"
          ? `<div>${dict.playlistTitle}</div>
             <div>• <strong>Tran682025 – Demo Jam</strong> · 92 BPM · 3:45</div>
             <div>• Focus Mode Practice · 75 BPM · 4:12</div>`
          : `<div>${dict.playlistTitle}</div>
             <div>• <strong>Tran682025 – Demo Jam</strong> · 92 BPM · 3:45</div>
             <div>• Focus Mode Practice · 75 BPM · 4:12</div>`;
      playlistBlock.innerHTML = html;
    }
  }

  if (langToggleBtn) {
    langToggleBtn.addEventListener("click", () => {
      currentLang = currentLang === "vn" ? "en" : "vn";
      applyI18n();
    });
    applyI18n();
  }

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
  chipPresets.forEach((chip) => {
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
      lyricsWithChordsOutput.textContent =
        result || "[trống] Chưa có dòng hợp lệ.";
      if (result) {
        lyricsPreview.textContent = result;
      }
    });
  }

  // 3. Recording (đã chỉnh lại cho mượt, tránh lỗi double-rec)
  if (startRecBtn && stopRecBtn) {
    startRecBtn.addEventListener("click", () => startRecording(audioPlayer));
    stopRecBtn.addEventListener("click", stopRecording);
  }

  async function startRecording(playerRef) {
    if (isRecording) return;
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
        if (recStatusText)
          recStatusText.textContent = "Đã thu xong · có thể phát lại";
        isRecording = false;
        startRecBtn.disabled = false;
        stopRecBtn.disabled = true;

        if (mediaRecorder && mediaRecorder.stream) {
          mediaRecorder.stream.getTracks().forEach((t) => t.stop());
        }
      };

      mediaRecorder.start();
      isRecording = true;
      startRecBtn.disabled = true;
      stopRecBtn.disabled = false;

      if (recDot) recDot.style.display = "inline-block";
      if (recStatusText)
        recStatusText.textContent = "Đang thu… nói hoặc hát vào mic";

      if (playerRef && playerRef.paused) {
        playerRef.play().catch(() => {});
      }
    } catch (err) {
      console.error("startRecording error", err);
      alert("Không thể truy cập micro: " + err.message);
      isRecording = false;
      startRecBtn.disabled = false;
      stopRecBtn.disabled = true;
      if (recDot) recDot.style.display = "none";
      if (recStatusText) recStatusText.textContent = "Idle";
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    } else {
      if (recDot) recDot.style.display = "none";
      if (recStatusText) recStatusText.textContent = "Idle";
      isRecording = false;
      startRecBtn.disabled = false;
      stopRecBtn.disabled = true;
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

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.helpTab;
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll("[data-help-content]").forEach((el) => {
        el.style.display = el.dataset.helpContent === tab ? "block" : "none";
      });
    });
  });

  // 5. Video ROOM (placeholder)
  if (videoRoomBtn) {
    videoRoomBtn.addEventListener("click", () => {
      alert(
        "Video ROOM sẽ được tích hợp ở các bản sau.\nHiện tại đây là nút demo cho kênh học viên & giảng viên."
      );
    });
  }
});

// Helpers cho pattern
function parsePattern(rawPattern) {
  if (!rawPattern) return [];
  return rawPattern
    .split(/\s+/)
    .map((ch) => ch.trim())
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

// ====== PHẦN 2: Pi SDK Login + Payment (Step 10, pending-safe) ======

document.addEventListener("DOMContentLoaded", () => {
  const sdkStatusDot = document.getElementById("sdkStatusDot");
  const sdkStatusText = document.getElementById("sdkStatusText");
  const loginBtn = document.getElementById("loginBtn");
  const loginDevBtn = document.getElementById("loginDevBtn");
  const loginLog = document.getElementById("loginLog");
  const scopeInput = document.getElementById("scopeInput");
  const loginNoteInput = document.getElementById("loginNoteInput");

  const payBtn = document.getElementById("payBtn");
  const payDevBtn = document.getElementById("payDevBtn");
  const paymentLog = document.getElementById("paymentLog");
  const amountInput = document.getElementById("amountInput");
  const memoInput = document.getElementById("memoInput");
  const metadataInput = document.getElementById("metadataInput");

  const compressPanelBtn = document.getElementById("compressPanelBtn");
  const piPanelBody = document.getElementById("piPanelBody");
  const langToggleBtn = document.getElementById("langToggleBtn");

  if (!sdkStatusDot || !sdkStatusText || !loginBtn || !payBtn) {
    return;
  }

  let piAvailable = false;

  function appendLog(el, msg) {
    const time = new Date().toISOString().split("T")[1].split(".")[0];
    el.textContent += `\n[${time}] ${msg}`;
    el.scrollTop = el.scrollHeight;
  }

  // Compress panel toggle (COMPRESSER PANEL)
  if (compressPanelBtn && piPanelBody) {
    compressPanelBtn.addEventListener("click", () => {
      const dict = I18N[currentLang];
      const expandLabel =
        dict?.compressPanelBtnExpand || "Thu gọn panel";
      const collapseLabel =
        dict?.compressPanelBtnCollapse || "Mở rộng panel";

      if (piPanelBody.classList.contains("card-body-collapsed")) {
        piPanelBody.classList.remove("card-body-collapsed");
        compressPanelBtn.textContent = expandLabel;
      } else {
        piPanelBody.classList.add("card-body-collapsed");
        compressPanelBtn.textContent = collapseLabel;
      }
    });

    // cập nhật label ban đầu theo ngôn ngữ
    const dict = I18N[currentLang];
    if (dict?.compressPanelBtnExpand) {
      compressPanelBtn.textContent = dict.compressPanelBtnExpand;
    }
  }

  // Pi SDK init
  if (window.Pi) {
    try {
      window.Pi.init({
        version: "2.0",
        sandbox: true,
      });
      piAvailable = true;
      sdkStatusDot.classList.add("status-ok");
      sdkStatusText.textContent =
        currentLang === "en"
          ? "Pi SDK ready (Testnet / Sandbox)"
          : "Pi SDK sẵn sàng (Testnet / Sandbox)";
      loginBtn.disabled = false;
      payBtn.disabled = false;
      if (loginDevBtn) loginDevBtn.disabled = false;
      if (payDevBtn) payDevBtn.disabled = false;

      loginLog.textContent =
        "[Login] Sẵn sàng. Bấm “Đăng nhập bằng Pi (Testnet)” trong Pi Browser.";
      paymentLog.textContent =
        "[Payment] Sẵn sàng. Bấm “Tạo thanh toán Pi (Testnet)” để tạo giao dịch thử.";
    } catch (err) {
      sdkStatusText.textContent = "Lỗi init Pi SDK: " + err.message;
      appendLog(loginLog, "Pi.init error: " + err.message);
      loginBtn.disabled = true;
      payBtn.disabled = true;
      if (loginDevBtn) loginDevBtn.disabled = true;
      if (payDevBtn) payDevBtn.disabled = true;
    }
  } else {
    const dict = I18N[currentLang];
    sdkStatusText.textContent =
      dict?.sdkStatusChecking ||
      "Không tìm thấy Pi SDK. Nếu bạn đang dùng Pi Browser, có thể đang mở bằng URL thường.";
    loginBtn.disabled = true;
    payBtn.disabled = true;
    if (loginDevBtn) loginDevBtn.disabled = true;
    if (payDevBtn) payDevBtn.disabled = true;

    loginLog.textContent =
      "[Login] Đang xem bằng trình duyệt thường.\nMở app Tran682025 trong mục Develop của Pi Browser để test đăng nhập.";
    paymentLog.textContent =
      "[Payment] Đang xem bằng trình duyệt thường.\nMở app Tran682025 trong mục Develop của Pi Browser để test thanh toán.";
  }


// 2) TRONG index.js: THAY TOÀN BỘ HÀM runLogin BẰNG ĐOẠN NÀY

async function runLogin(isDev = false) {
  if (!piAvailable) {
    alert("Pi SDK chưa hoạt động. Hãy mở trong Pi Browser (Develop → Tran682025).");
    return;
  }

  const scopes = scopeInput.value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  appendLog(
    loginLog,
    `[Login] Bắt đầu Pi.authenticate (mode=${
      isDev ? "DEV" : "TESTNET"
    }) với scope: [${scopes.join(", ")}]`
  );

  const onIncompletePaymentFound = async (payment) => {
    appendLog(
      loginLog,
      "onIncompletePaymentFound (pending payment): " +
        JSON.stringify(payment, null, 2)
    );

    try {
      const paymentId = payment.identifier;

      if (
        paymentId &&
        BACKEND_URL &&
        BACKEND_URL.startsWith("http")
      ) {
        appendLog(
          loginLog,
          `Gửi yêu cầu CANCEL pending payment: id=${paymentId}`
        );
       await fetch(`${BACKEND_URL}/payments/complete`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ paymentId }) // chỉ paymentId, không txid
});
appendLog(paymentLog, "Đã ép hoàn tất pending payment.");

      }
    } catch (e) {
      appendLog(loginLog, "Lỗi xử lý pending (cancel): " + e.message);
    }
  };

  try {
    const authResult = await window.Pi.authenticate(
      scopes,
      onIncompletePaymentFound
    );
    appendLog(
      loginLog,
      "Kết quả auth: " + JSON.stringify(authResult, null, 2)
    );

    if (loginNoteInput.value.trim()) {
      appendLog(
        loginLog,
        "Ghi chú: " + loginNoteInput.value.trim()
      );
    }
  } catch (err) {
    appendLog(loginLog, "Lỗi authenticate: " + err.message);
    alert("Login lỗi: " + err.message);
  }
}

// Giữ nguyên bên dưới:
loginBtn.addEventListener("click", () => runLogin(false));
if (loginDevBtn) {
  loginDevBtn.addEventListener("click", () => runLogin(true));
}


  // Payment
  async function runPayment(isDev = false) {
    if (!piAvailable) {
      alert(
        "Pi SDK chưa hoạt động. Hãy mở trong Pi Browser (Develop → Tran682025)."
      );
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
      `[Payment] Tạo payment (mode=${
        isDev ? "DEV" : "TESTNET"
      }): amount=${amount}, memo="${memo}", metadata=${JSON.stringify(
        metadata
      )}`
    );

    const paymentData = {
      amount,
      memo,
      metadata,
    };

    const cleanBackend = (BACKEND_URL || "").trim();

    const callbacks = {
      onReadyForServerApproval: async (paymentId) => {
        appendLog(
          paymentLog,
          "onReadyForServerApproval: " + paymentId
        );
        try {
          if (!isDev && cleanBackend && cleanBackend.startsWith("http")) {
            await fetch(`${cleanBackend}/payments/approve`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId }),
            });
            appendLog(paymentLog, "Đã gửi approve tới backend.");
          } else {
            appendLog(
              paymentLog,
              "BACKEND_URL chưa cấu hình hoặc đang ở DEV – chỉ log ở client, không gọi server."
            );
          }
        } catch (err) {
          appendLog(
            paymentLog,
            "Lỗi fetch approve: " + err.message
          );
        }
      },
    onReadyForServerCompletion: async (paymentId, txid) => {
  appendLog(paymentLog, "Complete request: " + paymentId);

  try {
    const res = await fetch(`${cleanBackend}/payments/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId })   // chỉ paymentId
    });
    const data = await res.json();
    appendLog(paymentLog, "Backend đã complete xong.");

    // ⭐ RẤT QUAN TRỌNG: báo cho Pi SDK biết là hoàn tất
    payment.onReadyForCompletion(paymentId, txid);

  } catch (err) {
    appendLog(paymentLog, "Lỗi fetch complete: " + err.message);
  }
},


      onCancel: (paymentId) => {
        appendLog(
          paymentLog,
          "Người dùng hủy payment: " + paymentId
        );
      },
      onError: (error, payment) => {
        appendLog(
          paymentLog,
          "Lỗi payment: " +
            error +
            " | payment=" +
            JSON.stringify(payment || {}, null, 2)
        );
      },
    };

    try {
      const payment = await window.Pi.createPayment(
        paymentData,
        callbacks
      );
      appendLog(
        paymentLog,
        "createPayment() trả về: " +
          JSON.stringify(payment, null, 2)
      );
    } catch (err) {
      appendLog(
        paymentLog,
        "Lỗi createPayment: " + err.message
      );
      alert("Payment lỗi: " + err.message);
    }
  }

  payBtn.addEventListener("click", () => runPayment(false));
  if (payDevBtn) {
    payDevBtn.addEventListener("click", () => runPayment(true));
  }
});
