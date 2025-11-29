// PiChordify Kingdom — v8.10 "Chord Runner"
// Player + chord tools + Pi Login / Pay (LIVE)

const MK = {
  audio: null,
  state: {
    isPlaying: false,
    duration: 0,
  },
};

function $(id) {
  return document.getElementById(id);
}

function log(...args) {
  const box = $("log");
  if (!box) {
    console.log("[LOG]", ...args);
    return;
  }
  const now = new Date().toLocaleTimeString("vi-VN", { hour12: false });
  const line =
    "[" + now + "] " +
    args
      .map((x) =>
        typeof x === "string" ? x : JSON.stringify(x)
      )
      .join(" ");
  box.value = (box.value ? box.value + "\n" : "") + line;
  box.scrollTop = box.scrollHeight;
}

//////////////////////////////
// 1. Audio player + volume
//////////////////////////////

function initPlayer() {
  const audio = $("audio");
  if (!audio) {
    console.error("Không tìm thấy thẻ <audio>.");
    return;
  }
  MK.audio = audio;

  const btnPlay = $("btnPlay");
  const btnPause = $("btnPause");
  const btnStop = $("btnStop");
  const timeSpan = $("time");
  const bar = $("bar");

  const vol = $("vol");
  const btnMute = $("btnMute");

  const urlInput = $("audiourl");
  const btnLoad = $("btnLoad");

  // === Nút chọn file local: chịu khó tìm input[type=file] cho chắc ===
  const fileInput =
    $("filepick") ||
    document.querySelector('input[type="file"][accept*="audio"]') ||
    document.querySelector('input[type="file"]');

  const btnPick =
    $("btnPick") ||
    document.querySelector('button[id*="Pick"],button[id*="pick"]');

  const titleEl = $("titleEl");

  function updateTime() {
    if (!timeSpan || !bar) return;

    const cur = Math.floor(audio.currentTime || 0);
    const dur = Math.floor(audio.duration || 0);

    const mm = (v) => String(Math.floor(v / 60)).padStart(2, "0");
    const ss = (v) => String(v % 60).padStart(2, "0");

    timeSpan.textContent = `${mm(cur)}:${ss(cur)} / ${mm(dur)}:${ss(dur)}`;
    bar.value = dur > 0 ? String((cur / dur) * 100) : "0";
  }

  audio.addEventListener("timeupdate", updateTime);
  audio.addEventListener("loadedmetadata", () => {
    MK.state.duration = audio.duration || 0;
    updateTime();
  });
  audio.addEventListener("ended", () => {
    MK.state.isPlaying = false;
    updateTime();
  });

  if (bar) {
    bar.addEventListener("input", () => {
      if (!audio.duration || !isFinite(audio.duration)) return;
      const percent = Number(bar.value || "0");
      const t = (percent / 100) * audio.duration;
      audio.currentTime = t;
      updateTime();
    });
  }

  if (vol) {
    vol.addEventListener("input", () => {
      const v = Number(vol.value || "1");
      audio.volume = v;
      if (v > 0) {
        audio.muted = false;
        if (btnMute) btnMute.textContent = "Mute";
      }
    });
  }

  if (btnMute) {
    btnMute.addEventListener("click", () => {
      audio.muted = !audio.muted;
      btnMute.textContent = audio.muted ? "Unmute" : "Mute";
    });
  }

  if (btnPlay) {
    btnPlay.addEventListener("click", () => {
      if (!audio.src) {
        log("⚠ Chưa có file audio. Hãy chọn hoặc load file MP3 trước.");
        return;
      }
      audio
        .play()
        .then(() => {
          MK.state.isPlaying = true;
          log("▶ Bắt đầu phát audio.");
        })
        .catch((e) => {
          console.error(e);
          log("❌ Lỗi khi phát audio:", e.message || e);
        });
    });
  }

  if (btnPause) {
    btnPause.addEventListener("click", () => {
      audio.pause();
      MK.state.isPlaying = false;
      log("⏸ Tạm dừng audio.");
    });
  }

  if (btnStop) {
    btnStop.addEventListener("click", () => {
      audio.pause();
      audio.currentTime = 0;
      MK.state.isPlaying = false;
      updateTime();
      log("⏹ Dừng audio.");
    });
  }

  function setTitleFromName(name) {
    if (!titleEl) return;
    const clean = name.replace(/\.(mp3|wav|m4a|aac|flac)$/i, "");
    if (!titleEl.value.trim()) {
      titleEl.value = decodeURIComponent(clean);
    }
  }

  if (btnPick && fileInput) {
    btnPick.addEventListener("click", () => {
      fileInput.click();
    });

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      audio.src = url;
      MK.state.duration = 0;
      MK.state.isPlaying = false;
      updateTime();
      setTitleFromName(file.name);
      log(`📂 Đã load file MP3 local: ${file.name}.`);
    });
  }

  if (btnLoad && urlInput) {
    btnLoad.addEventListener("click", () => {
      const url = urlInput.value.trim();
      if (!url) {
        log("⚠ Hãy nhập URL file MP3 trước.");
        return;
      }

      audio.src = url;
      MK.state.duration = 0;
      MK.state.isPlaying = false;
      updateTime();

      if (titleEl && !titleEl.value.trim()) {
        let last = url.split("/").pop() || "";
        last = last.split("?")[0].split("#")[0];
        last = last.replace(/\.(mp3|wav|m4a|aac|flac)$/i, "");
        titleEl.value = decodeURIComponent(last);
      }

      log(`🌐 Đã load MP3 từ URL: ${url}`);
    });
  }

  log("🎵 Player đã khởi động.");
}

//////////////////////////////
// 2. Gợi ý hợp âm theo key
//////////////////////////////

const MK_PROGS = {
  "I-V-vi-IV": ["I", "V", "vi", "IV"],
  "I-vi-IV-V": ["I", "vi", "IV", "V"],
  "I-IV-V": ["I", "IV", "V"],
};

const MK_KEYS = {
  C: ["C", "Dm", "Em", "F", "G", "Am", "Bdim"],
  G: ["G", "Am", "Bm", "C", "D", "Em", "F#dim"],
  D: ["D", "Em", "F#m", "G", "A", "Bm", "C#dim"],
  A: ["A", "Bm", "C#m", "D", "E", "F#m", "G#dim"],
  F: ["F", "Gm", "Am", "Bb", "C", "Dm", "Edim"],
};

function suggestChord(key, degree) {
  const scale = MK_KEYS[key];
  if (!scale) return "?";
  const map = { I: 0, ii: 1, iii: 2, IV: 3, V: 4, vi: 5, vii: 6 };
  const idx = map[degree];
  if (idx == null) return "?";
  return scale[idx] || "?";
}

function initChordSuggest() {
  const keySel = $("selKey");
  const progSel = $("selProg");
  const suggestBox = $("suggest");
  const btnSuggest =
    $("btnSuggest") ||
    document.querySelector('button[id*="Suggest"],button[id*="suggest"]');

  if (!keySel || !progSel || !suggestBox || !btnSuggest) {
    // Nếu HTML khác ID, thì thôi, khỏi lỗi
    return;
  }

  btnSuggest.addEventListener("click", () => {
    const key = keySel.value || "C";
    const progName = progSel.value || "I-V-vi-IV";
    const degrees = MK_PROGS[progName] || MK_PROGS["I-V-vi-IV"];
    const chords = degrees.map((deg) => suggestChord(key, deg));
    const lines = [];
    lines.push(`[Key ${key}]  ${progName}`);
    lines.push(chords.join("   |   "));
    suggestBox.value = lines.join("\n");
  });
}

//////////////////////////////
// 3. Auto pattern fill toàn bài
//////////////////////////////

function parsePattern(str) {
  return str
    .split(/\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function initAutoPatternFill() {
  // cố gắng bắt mọi khả năng ID cho pattern + nút
  const patternInput =
    $("patternInput") ||
    $("patternBox") ||
    $("pattern") ||
    document.querySelector("textarea[id*='pattern']");

  const btnFillAll =
    $("btnAutoPattern") ||
    $("btnPattern") ||
    document.querySelector("button[id*='Pattern'],button[id*='pattern']");

  const lyricsBox = $("lyrics");

  if (!patternInput || !btnFillAll || !lyricsBox || !MK.audio) return;

  btnFillAll.addEventListener("click", () => {
    const chords = parsePattern(patternInput.value || "");
    if (!chords.length) {
      log("⚠ Chưa nhập pattern hợp âm (ví dụ: C G Am F | F G Em Am).");
      return;
    }

    const duration = MK.audio.duration;
    if (!duration || !isFinite(duration)) {
      log("⚠ Chưa đọc được thời lượng MP3. Hãy load file, bấm Play một lần rồi thử lại.");
      return;
    }

    const total = Math.floor(duration);
    if (total < 4) {
      log("⚠ Bài hát quá ngắn, không auto fill được.");
      return;
    }

    const step = 4;
    const lines = [];
    let t = 0;
    let i = 0;

    const fmt = (sec) => {
      const mm = String(Math.floor(sec / 60)).padStart(2, "0");
      const ss = String(sec % 60).padStart(2, "0");
      return `${mm}:${ss}`;
    };

    while (t < total) {
      const chord = chords[i % chords.length];
      const timeStr = fmt(t);
      lines.push(`${timeStr}    ${chord}`);
      t += step;
      i++;
    }

    lyricsBox.value = lines.join("\n");
    log(`✅ Đã auto fill ${lines.length} dòng hợp âm cho cả bài (pattern lặp, ${step}s / hợp âm).`);
  });
}

//////////////////////////////
// 4. Chord Runner
//////////////////////////////

function initChordRunner() {
  const lyricsBox = $("lyrics");
  const currentChordSpan = $("currentChord");
  if (!lyricsBox || !currentChordSpan || !MK.audio) return;

  let parsed = [];

  function parseLyrics() {
    parsed = [];
    const lines = lyricsBox.value.split("\n");
    for (let line of lines) {
      const m = line.match(/^(\d{2}):(\d{2})\s+(.+)$/);
      if (!m) continue;
      const t = Number(m[1]) * 60 + Number(m[2]);
      const chord = m[3].trim();
      parsed.push({ time: t, chord });
    }
  }

  lyricsBox.addEventListener("input", parseLyrics);
  parseLyrics();

  setInterval(() => {
    if (!parsed.length || MK.audio.paused) return;
    const now = Math.floor(MK.audio.currentTime || 0);
    let found = "";
    for (let i = parsed.length - 1; i >= 0; i--) {
      if (now >= parsed[i].time) {
        found = parsed[i].chord;
        break;
      }
    }
    currentChordSpan.textContent = found;
  }, 400);
}

//////////////////////////////
// 5. Focus Mode (vẫn giữ, nhưng chỉ ẩn header + card phải)
//////////////////////////////

//////////////////////////////
// 6. Backend settings
//////////////////////////////

function getBackend() {
  return localStorage.getItem("backend") || "";
}

function setBackend(url) {
  localStorage.setItem("backend", url);
  const span = $("backendNow");
  if (span) span.textContent = url || "(none)";
}

function initBackendSettings() {
  const backendInput = $("backendUrl");
  const btnSaveBackend = $("btnSaveBackend");
  const span = $("backendNow");

  if (span) span.textContent = getBackend() || "(none)";
  if (backendInput) backendInput.value = getBackend();

  if (btnSaveBackend && backendInput) {
    btnSaveBackend.addEventListener("click", () => {
      const url = backendInput.value.trim();
      setBackend(url);
      log("🔧 Đã lưu backend:", url || "(none)");
    });
  }
}

//////////////////////////////
// 7. Pi SDK
//////////////////////////////

function initPiSdk() {
  if (typeof Pi === "undefined") {
    log("⚠ Không tìm thấy Pi SDK (window.Pi).");
    return;
  }

  try {
    Pi.init({ version: "2.0", sandbox: false });
    log("✅ Pi SDK initialized (LIVE).");
  } catch (e) {
    console.error(e);
    log("❌ Lỗi init Pi SDK:", e.message || e);
  }

  const btnLogin = $("btnPiLogin");
  const btnPremium = $("btnCheckPremium");
  const btnPayLive = $("btnPayLive");

  if (btnLogin) {
    btnLogin.addEventListener("click", async () => {
      try {
        log("⏳ Đang login với Pi...");
        const scopes = ["username", "payments"];
        const auth = await Pi.authenticate(scopes, () => ({}));
        log("✅ Login thành công.", auth.user && auth.user.username);
      } catch (e) {
        console.error(e);
        log("❌ Pi Login lỗi:", e.message || e);
      }
    });
  }

  if (btnPremium) {
    btnPremium.addEventListener("click", async () => {
      const backend = getBackend();
      if (!backend) {
        log("⚠ Chưa cấu hình backend (dev). Hãy vào 'Cài đặt backend'.");
        return;
      }
      try {
        log("⏳ Đang gửi yêu cầu kiểm tra Premium...");
        const res = await fetch(backend + "/premium-status", {
          credentials: "include",
        });
        const data = await res.json();
        log("📡 Premium:", data);
      } catch (e) {
        console.error(e);
        log("❌ Lỗi gọi /premium-status:", e.message || e);
      }
    });
  }

  if (btnPayLive) {
    btnPayLive.addEventListener("click", async () => {
      const backend = getBackend();
      if (!backend) {
        log("⚠ Chưa cấu hình backend (dev). Hãy vào 'Cài đặt backend'.");
        return;
      }
      try {
        log("⏳ Bắt đầu tạo thanh toán (LIVE)...");
        const amount = 0.1;
        const memo = "Musickingdom test for Tran2020";
        const metadata = { username: "Tran2020" };

        const payment = await Pi.createPayment({
          amount,
          memo,
          metadata,
        });

        log("📩 Pi.createPayment trả về:", payment);

        const res = await fetch(backend + "/pay-live", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payment),
        });
        const data = await res.json();
        log("✅ Kết quả /pay-live:", data);
      } catch (e) {
        console.error(e);
        log("❌ X payment (LIVE) lỗi:", e.message || e);
      }
    });
  }
}

//////////////////////////////
// 8. Boot
//////////////////////////////

window.addEventListener("DOMContentLoaded", () => {
  try {
    initPlayer();
    initChordSuggest();
    initAutoPatternFill();
    initChordRunner();
    initBackendSettings();
    initPiSdk();
    log("🎼 PiChordify Kingdom frontend (index.js) đã khởi động.");
  } catch (e) {
    console.error(e);
    log("❌ Lỗi init index.js:", e.message || e);
  }
});
