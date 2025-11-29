// index.js — PiChordify Kingdom v20.0
// Mục tiêu: player + log ổn định, Pi Login + Pi Pay (LIVE) rõ ràng.

(function () {
  const state = {
    audio: null,
    isPlaying: false,
    isMuted: false,
    lastVolume: 1,
    currentUser: null,
    backendUrl: "",
    piReady: false,
  };

  // ========== Helpers ==========
  function $(id) {
    return document.getElementById(id);
  }

  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  // ----- Log panel + console mirror -----
  const logEl = $("log");
  const btnLogToggle = $("btnLogToggle");

  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };

  function appendLogLine(raw) {
    if (!logEl) return;
    const ts = new Date().toLocaleTimeString("vi-VN", { hour12: false });
    const line = `[${ts}] ${raw}`;
    logEl.value += (logEl.value ? "\n" : "") + line;
    logEl.scrollTop = logEl.scrollHeight;
  }

  function log(msg) {
    appendLogLine(msg);
    try {
      originalConsole.log("[PK20]", msg);
    } catch (_) {}
  }

  function logWarn(msg) {
    appendLogLine("⚠ " + msg);
    try {
      originalConsole.warn("[PK20]", msg);
    } catch (_) {}
  }

  function logError(msg) {
    appendLogLine("✘ " + msg);
    try {
      originalConsole.error("[PK20]", msg);
    } catch (_) {}
  }

  // Mirror console.log / warn / error → log panel, nhưng dùng originalConsole nên không loop.
  ["log", "warn", "error"].forEach((fn) => {
    console[fn] = function (...args) {
      try {
        originalConsole[fn].apply(originalConsole, args);
      } catch (_) {}
      const text = args
        .map((a) => {
          if (a instanceof Error) return a.message;
          if (typeof a === "object") {
            try {
              return JSON.stringify(a);
            } catch (_) {
              return String(a);
            }
          }
          return String(a);
        })
        .join(" ");
      appendLogLine(`console.${fn}: ${text}`);
    };
  });

  if (btnLogToggle && logEl) {
    btnLogToggle.addEventListener("click", () => {
      logEl.classList.toggle("log-max");
      btnLogToggle.textContent = logEl.classList.contains("log-max")
        ? "Thu nhỏ log"
        : "Mở rộng log";
    });
  }

  // ========== Focus mode ==========
  function initFocusMode() {
    const btn = $("btnFocusMode");
    if (!btn) return;

    btn.addEventListener("click", () => {
      document.body.classList.toggle("focus-mode");
      const on = document.body.classList.contains("focus-mode");
      btn.textContent = on ? "Thoát chế độ tập trung" : "Chế độ tập trung";
      log(on ? "Đã bật Focus mode." : "Đã tắt Focus mode.");
    });
  }

  // ========== Instrument tabs ==========
  function initInstrumentTabs() {
    const tabs = ["tabPiano", "tabGuitar", "tabUke"]
      .map((id) => $(id))
      .filter(Boolean);

    tabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabs.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        log("Nhạc cụ: " + btn.textContent.trim());
      });
    });
  }

  // ========== Chord suggest (đơn giản) ==========
  const PROGRESSIONS = {
    "I-V-vi-IV": ["I", "V", "vi", "IV"],
    "I-vi-IV-V": ["I", "vi", "IV", "V"],
    "I-IV-V": ["I", "IV", "V", "V"],
  };

  const KEY_MAP = {
    C: { I: "C", V: "G", vi: "Am", IV: "F" },
    G: { I: "G", V: "D", vi: "Em", IV: "C" },
    D: { I: "D", V: "A", vi: "Bm", IV: "G" },
    A: { I: "A", V: "E", vi: "F#m", IV: "D" },
    F: { I: "F", V: "C", vi: "Dm", IV: "Bb" },
  };

  function initChordSuggest() {
    const btn = $("btnSuggest");
    const keySel = $("selKey");
    const progSel = $("selProg");
    const out = $("suggest");

    if (!btn || !keySel || !progSel || !out) return;

    btn.addEventListener("click", () => {
      const key = keySel.value || "C";
      const progKey = progSel.value || "I-V-vi-IV";
      const prog = PROGRESSIONS[progKey] || PROGRESSIONS["I-V-vi-IV"];
      const map = KEY_MAP[key] || KEY_MAP["C"];

      const chords = prog.map((deg) => map[deg] || deg);
      const lines = [
        `Key: ${key}`,
        `Tiến trình: ${progKey}`,
        "",
        "[Verse]",
        chords.join("  /  "),
        "",
        "[Chorus]",
        chords.slice().reverse().join("  /  "),
      ];

      out.value = lines.join("\n");
      out.scrollTop = 0;
      log("Đã gợi ý hợp âm cho key " + key + " — " + progKey);
    });
  }

  // ========== Auto pattern fill ==========
  function initAutoPatternFill() {
    const patternInput = $("patternInput");
    const btn = $("btnAutoPattern");
    const lyrics = $("lyrics");
    const audio = $("audio");

    if (!patternInput || !btn || !lyrics || !audio) return;

    btn.addEventListener("click", () => {
      const patternRaw = (patternInput.value || "").trim();
      if (!patternRaw) {
        alert("Điền pattern hợp âm trước đã.");
        return;
      }

      const tokens = patternRaw
        .split(/[|\s]+/)
        .map((t) => t.trim())
        .filter(Boolean);
      if (!tokens.length) {
        alert("Pattern không hợp lệ.");
        return;
      }

      const duration = audio.duration || 180; // mặc định 3 phút
      const step = duration / tokens.length;

      const lines = tokens.map((ch, i) => {
        const t = formatTime(step * i);
        return `${t}   ${ch}`;
      });

      lyrics.value = lines.join("\n");
      lyrics.scrollTop = 0;
      log("Đã auto-fill " + tokens.length + " hợp âm theo pattern.");
    });
  }

  // ========== Audio player ==========
  function initAudioPlayer() {
    const audio = $("audio");
    const urlInput = $("audiourl");
    const filePick = $("filepick");
    const btnPick = $("btnPick");
    const btnLoad = $("btnLoad");
    const btnPlay = $("btnPlay");
    const btnPause = $("btnPause");
    const btnStop = $("btnStop");
    const timeLabel = $("time");
    const bar = $("bar");
    const vol = $("vol");
    const btnMute = $("btnMute");
    const currentChord = $("currentChord");
    const lyrics = $("lyrics");

    if (!audio) return;
    state.audio = audio;

    function updateTime() {
      if (!timeLabel) return;
      const cur = audio.currentTime || 0;
      const dur = audio.duration || 0;
      timeLabel.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;
      if (bar && dur > 0) {
        bar.value = ((cur / dur) * 100).toFixed(1);
      }
      // Chord runner đơn giản: quét lyrics tìm timestamp <= cur gần nhất
      if (lyrics && currentChord) {
        const text = lyrics.value || "";
        const lines = text.split(/\r?\n/);
        let found = "";
        for (const line of lines) {
          const m = line.match(/^(\d{2}:\d{2})\s+(.*)$/);
          if (!m) continue;
          const t = m[1];
          const rest = m[2];
          const parts = t.split(":");
          const sec = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
          if (sec <= cur + 0.25) {
            found = rest.trim();
          } else {
            break;
          }
        }
        if (found) {
          currentChord.textContent = found;
          currentChord.classList.remove("chord-pulse");
          void currentChord.offsetWidth;
          currentChord.classList.add("chord-pulse");
        }
      }
    }

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateTime);
    audio.addEventListener("ended", () => {
      state.isPlaying = false;
      updateTime();
      log("Track đã kết thúc.");
    });

    if (btnPick && filePick) {
      btnPick.addEventListener("click", () => filePick.click());
      filePick.addEventListener("change", () => {
        if (!filePick.files || !filePick.files[0]) return;
        const file = filePick.files[0];
        const url = URL.createObjectURL(file);
        audio.src = url;
        if (urlInput) urlInput.value = file.name;
        log("Đã chọn file local: " + file.name);
      });
    }

    if (btnLoad && urlInput) {
      btnLoad.addEventListener("click", () => {
        const url = (urlInput.value || "").trim();
        if (!url) {
          alert("Nhập URL MP3 trước đã.");
          return;
        }
        audio.src = url;
        audio.load();
        log("Đã load audio từ URL.");
      });
    }

    if (btnPlay) {
      btnPlay.addEventListener("click", () => {
        if (!audio.src) {
          alert("Chưa có file MP3. Chọn file hoặc nhập URL.");
          return;
        }
        audio
          .play()
          .then(() => {
            state.isPlaying = true;
            log("Play.");
          })
          .catch((err) => {
            logError("Play lỗi: " + (err && err.message));
          });
      });
    }

    if (btnPause) {
      btnPause.addEventListener("click", () => {
        audio.pause();
        state.isPlaying = false;
        log("Pause.");
      });
    }

    if (btnStop) {
      btnStop.addEventListener("click", () => {
        audio.pause();
        audio.currentTime = 0;
        state.isPlaying = false;
        updateTime();
        log("Stop.");
      });
    }

    if (bar) {
      bar.addEventListener("input", () => {
        const v = parseFloat(bar.value) || 0;
        const dur = audio.duration || 0;
        audio.currentTime = (dur * v) / 100;
        updateTime();
      });
    }

    if (vol) {
      vol.addEventListener("input", () => {
        const v = parseFloat(vol.value);
        audio.volume = v;
        if (v > 0) {
          state.lastVolume = v;
          state.isMuted = false;
          if (btnMute) btnMute.textContent = "Mute";
        }
      });
    }

    if (btnMute && vol) {
      btnMute.addEventListener("click", () => {
        if (!state.isMuted) {
          state.lastVolume = vol.value;
          vol.value = 0;
          audio.volume = 0;
          state.isMuted = true;
          btnMute.textContent = "Unmute";
          log("Mute.");
        } else {
          const v = parseFloat(state.lastVolume || "1") || 1;
          vol.value = v;
          audio.volume = v;
          state.isMuted = false;
          btnMute.textContent = "Mute";
          log("Unmute.");
        }
      });
    }

    updateTime();
    log("Player đã khởi động.");
  }

  // ========== Local save (rất đơn giản) ==========
  function initLocalSave() {
    const btnSave = $("btnSave");
    const btnLoadLocal = $("btnLoadLocal");
    const lyrics = $("lyrics");
    const suggest = $("suggest");
    const titleEl = $("titleEl");

    if (btnSave) {
      btnSave.addEventListener("click", () => {
        const payload = {
          title: titleEl ? titleEl.value : "",
          lyrics: lyrics ? lyrics.value : "",
          suggest: suggest ? suggest.value : "",
        };
        localStorage.setItem("pk20-song", JSON.stringify(payload));
        log("Đã lưu tạm vào trình duyệt.");
      });
    }

    if (btnLoadLocal) {
      btnLoadLocal.addEventListener("click", () => {
        const raw = localStorage.getItem("pk20-song");
        if (!raw) {
          alert("Chưa có bản lưu nào.");
          return;
        }
        try {
          const payload = JSON.parse(raw);
          if (titleEl) titleEl.value = payload.title || "";
          if (lyrics) lyrics.value = payload.lyrics || "";
          if (suggest) suggest.value = payload.suggest || "";
          log("Đã load lại bản lưu.");
        } catch (e) {
          logError("Load local lỗi: " + e.message);
        }
      });
    }
  }

  // ========== Backend config ==========
  function initBackendConfig() {
    const input = $("backendUrl");
    const btn = $("btnSaveBackend");
    const span = $("backendNow");

    const saved = localStorage.getItem("backend") || "";
    state.backendUrl = saved;
    if (input) input.value = saved;
    if (span) span.textContent = saved || "(none)";

    if (btn && input) {
      btn.addEventListener("click", () => {
        const url = (input.value || "").trim();
        state.backendUrl = url;
        localStorage.setItem("backend", url);
        if (span) span.textContent = url || "(none)";
        log("Đã lưu backend: " + (url || "(none)"));
      });
    }
  }

  async function postBackend(path, body) {
    if (!state.backendUrl) {
      logWarn("Chưa cấu hình backend; bỏ qua " + path);
      return { ok: false, error: "No backend" };
    }
    const url = state.backendUrl.replace(/\/+$/, "") + path;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
      });
      const data = await res.json().catch(() => ({}));
      log("Backend " + path + " status " + res.status);
      return { ok: res.ok, data };
    } catch (e) {
      logError("Gọi backend lỗi: " + e.message);
      return { ok: false, error: e.message };
    }
  }

  // ========== Pi SDK (LIVE) ==========
  function initPiSdk() {
    const btnLogin = $("btnPiLogin");
    const btnPay = $("btnPayLive");
    const btnCheckPremium = $("btnCheckPremium");

    if (typeof window.Pi === "undefined") {
      logWarn("Không tìm thấy Pi SDK. Mở app trong Pi Browser để dùng Pi Login / Pay.");
      if (btnLogin) {
        btnLogin.addEventListener("click", () => {
          alert("Không có Pi SDK. Thử mở trong Pi Browser.");
        });
      }
      if (btnPay) {
        btnPay.addEventListener("click", () => {
          alert("Không có Pi SDK nên không test được Pi Payment.");
        });
      }
      if (btnCheckPremium) {
        btnCheckPremium.addEventListener("click", () => {
          alert("Không có Pi SDK. Cần mở trong Pi Browser.");
        });
      }
      return;
    }

    const Pi = window.Pi;
    try {
      Pi.init({ version: "2.0", sandbox: false });
      state.piReady = true;
      log("Pi SDK initialized (LIVE).");
    } catch (e) {
      state.piReady = false;
      logError("Pi SDK init lỗi: " + e.message);
    }

    async function handleLogin() {
      if (!state.piReady) {
        logWarn("Pi SDK chưa sẵn, không login được.");
        return;
      }
      log("Đang login với Pi...");
      try {
        const scopes = ["username", "payments"];
        const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
        state.currentUser = auth.user;
        log("Login thành công. " + auth.user.username);
      } catch (e) {
        logError("Pi login lỗi: " + e.message);
        alert("Pi login lỗi. Xem log để chi tiết.");
      }
    }

    async function handleCheckPremium() {
      if (!state.currentUser) {
        alert("Đăng nhập Pi trước đã.");
        return;
      }
      const res = await postBackend("/premium/check", {
        uid: state.currentUser.uid,
        username: state.currentUser.username,
      });
      if (!res.ok) {
        alert("Không kiểm tra được premium. Xem log.");
        return;
      }
      const status = res.data && res.data.status;
      log("Premium status: " + status);
      alert("Premium: " + status);
    }

    async function handlePayLive() {
      if (!state.currentUser) {
        alert("Đăng nhập Pi trước đã.");
        return;
      }
      if (!state.backendUrl) {
        if (!confirm("Chưa cấu hình backend. Vẫn tạo payment (sẽ không approve/complete được)?")) {
          return;
        }
      }

      try {
        log("Bắt đầu tạo payment LIVE 1 Pi...");
        const paymentData = {
          amount: "1",
          memo: "PiChordify Kingdom premium demo",
          metadata: {
            app: "PiChordifyKingdom",
            version: "20.0",
          },
        };

        const callbacks = {
          onReadyForServerApproval: async (paymentId) => {
            log("onReadyForServerApproval: " + paymentId);
            await postBackend("/payments/approve", {
              paymentId,
              user: state.currentUser,
            });
          },
          onReadyForServerCompletion: async (paymentId, txid) => {
            log("onReadyForServerCompletion: " + paymentId + " txid=" + txid);
            await postBackend("/payments/complete", {
              paymentId,
              txid,
              user: state.currentUser,
            });
          },
          onCancel: (paymentId) => {
            logWarn("Payment bị huỷ: " + paymentId);
          },
          onError: (error, payment) => {
            logError("Pi.createPayment error: " + (error && error.message));
            if (payment) {
              log("Payment object (error): " + JSON.stringify(payment));
            }
          },
        };

        const payment = await Pi.createPayment(paymentData, callbacks);
        log("✅ Pi.createPayment trả về: " + JSON.stringify(payment));
      } catch (e) {
        logError("✘ x payment (LIVE) lỗi: " + (e.message || e));
        alert("Payment lỗi. Xem log.");
      }
    }

    if (btnLogin) btnLogin.addEventListener("click", handleLogin);
    if (btnCheckPremium) btnCheckPremium.addEventListener("click", handleCheckPremium);
    if (btnPay) btnPay.addEventListener("click", handlePayLive);
  }

  function onIncompletePaymentFound(payment) {
    logWarn("Có payment chưa hoàn tất: " + JSON.stringify(payment));
    // Sau này có thể gọi backend để sync lại.
  }

  // ========== Init ==========
  function init() {
    log("PiChordify Kingdom frontend (index.js v20.0) đã khởi động.");
    initFocusMode();
    initInstrumentTabs();
    initChordSuggest();
    initAutoPatternFill();
    initAudioPlayer();
    initLocalSave();
    initBackendConfig();
    initPiSdk();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
