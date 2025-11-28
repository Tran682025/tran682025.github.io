// =========================
// PiChordify Kingdom – index.js
// Frontend logic: player, chords, save/share + Pi Login & Pi Pay (LIVE)
// =========================

// ---- Global state ----
const MK = {
  audio: null,
  progressBar: null,
  timeLabel: null,
  state: {
    isPlaying: false,
    duration: 0,
    current: 0,
    transpose: 0,
    key: "C",
    progression: "I–V–vi–IV",
    instrument: "piano",
  },
  pi: {
    user: null,
    backendUrl: "",
    apiBase: "",
  },
};

const STORAGE_KEY_SONG = "pichordify.currentSong";

// Note names cho 12 cung
const KEY_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
// Major scale steps (semitones)
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];

// ===== Utils chung =====
function fmtTime(sec) {
  if (!isFinite(sec)) sec = 0;
  sec = Math.max(0, sec);
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

// Roman numeral -> degree (1..7) + isMinor
function parseRoman(token) {
  const clean = (token || "").toLowerCase().replace(/[^iv]/g, "");
  const map = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7 };
  const deg = map[clean] || 1;
  const isMinor = token === token.toLowerCase();
  return { degree: deg, isMinor };
}

// Lấy index trong KEY_NAMES (fallback C)
function keyIndex(name) {
  const idx = KEY_NAMES.indexOf(name);
  return idx >= 0 ? idx : 0;
}

function chordFromRoman(rootIndex, token) {
  const { degree, isMinor } = parseRoman(token);
  const step = MAJOR_STEPS[clamp(degree, 1, 7) - 1];
  const note = KEY_NAMES[(rootIndex + step) % 12];
  return note + (isMinor ? "m" : "");
}

// =========================
// 1) AUDIO PLAYER
// =========================
function initPlayer() {
  MK.audio = document.getElementById("audio");
  MK.progressBar = document.getElementById("bar");
  MK.timeLabel = document.getElementById("time");

  if (!MK.audio) {
    log("⚠️ Không tìm thấy thẻ <audio>.");
    return;
  }

  MK.audio.addEventListener("loadedmetadata", () => {
    MK.state.duration = MK.audio.duration || 0;
    updateTimeUI();
  });

  MK.audio.addEventListener("timeupdate", () => {
    MK.state.current = MK.audio.currentTime || 0;
    updateTimeUI();
    updateProgressUI();
  });

  MK.audio.addEventListener("ended", () => {
    MK.state.isPlaying = false;
    updatePlayButtons();
  });

  const progress = document.querySelector(".progress");
  if (progress) {
    progress.addEventListener("click", (ev) => {
      if (!MK.audio || !MK.state.duration) return;
      const rect = progress.getBoundingClientRect();
      const ratio = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
      MK.audio.currentTime = ratio * MK.state.duration;
    });
  }

  // Nút chọn file
  const pickBtn = document.getElementById("btnPick");
  const fileInput = document.getElementById("filePick");
  if (pickBtn && fileInput) {
    pickBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      document.getElementById("audioUrl").value = "";
      MK.audio.src = url;
      MK.audio.play().catch(() => {});
      MK.state.isPlaying = true;
      log("🎧 Đã load file MP3 local:", file.name);
      updatePlayButtons();
    });
  }

  // Nút load URL
  const loadBtn = document.getElementById("btnLoad");
  if (loadBtn) {
    loadBtn.addEventListener("click", () => {
      const url = document.getElementById("audioUrl").value.trim();
      if (!url) {
        log("⚠️ Hãy nhập URL file MP3 trước.");
        return;
      }
      MK.audio.src = url;
      MK.audio.play().catch(() => {});
      MK.state.isPlaying = true;
      log("🎧 Đã load MP3 từ URL:", url);
      updatePlayButtons();
    });
  }

  // Play / Pause / Stop
  document.getElementById("btnPlay")?.addEventListener("click", () => {
    if (!MK.audio || !MK.audio.src) {
      log("⚠️ Chưa có file audio.");
      return;
    }
    MK.audio.play().catch((e) => log("❌ Lỗi play:", e.message || e));
    MK.state.isPlaying = true;
    updatePlayButtons();
  });

  document.getElementById("btnPause")?.addEventListener("click", () => {
    MK.audio?.pause();
    MK.state.isPlaying = false;
    updatePlayButtons();
  });

  document.getElementById("btnStop")?.addEventListener("click", () => {
    if (!MK.audio) return;
    MK.audio.pause();
    MK.audio.currentTime = 0;
    MK.state.isPlaying = false;
    updateTimeUI();
    updateProgressUI();
    updatePlayButtons();
  });
}

function updateTimeUI() {
  if (!MK.timeLabel) return;
  MK.timeLabel.textContent = `${fmtTime(MK.state.current)} / ${fmtTime(
    MK.state.duration
  )}`;
}

function updateProgressUI() {
  if (!MK.progressBar || !MK.state.duration) return;
  const ratio = clamp(MK.state.current / MK.state.duration, 0, 1);
  MK.progressBar.style.width = `${ratio * 100}%`;
}

function updatePlayButtons() {
  const playBtn = document.getElementById("btnPlay");
  const pauseBtn = document.getElementById("btnPause");
  if (!playBtn || !pauseBtn) return;
  if (MK.state.isPlaying) {
    playBtn.disabled = true;
    pauseBtn.disabled = false;
  } else {
    playBtn.disabled = false;
    pauseBtn.disabled = true;
  }
}

// =========================
// 2) KEY / PROGRESSION / TRANSPOSE
// =========================
function initKeyAndProgression() {
  const selKey = document.getElementById("selKey");
  const selProg = document.getElementById("selProg");
  const badgeTrans = document.getElementById("transposeView");

  // Populate keys
  if (selKey && !selKey.options.length) {
    KEY_NAMES.forEach((k) => {
      const opt = document.createElement("option");
      opt.value = k;
      opt.textContent = k;
      selKey.appendChild(opt);
    });
    selKey.value = MK.state.key;
  }

  if (selKey) {
    selKey.addEventListener("change", () => {
      MK.state.key = selKey.value || "C";
      MK.state.transpose = 0;
      if (badgeTrans) badgeTrans.textContent = "0";
      updateSuggestions();
    });
  }

  if (selProg) {
    MK.state.progression = selProg.value;
    selProg.addEventListener("change", () => {
      MK.state.progression = selProg.value;
      updateSuggestions();
    });
  }

  document.getElementById("btnUp")?.addEventListener("click", () =>
    changeKey(+1)
  );
  document.getElementById("btnDown")?.addEventListener("click", () =>
    changeKey(-1)
  );

  function changeKey(delta) {
    const sel = document.getElementById("selKey");
    if (!sel) return;
    const idx = keyIndex(MK.state.key);
    const newIdx = (idx + delta + KEY_NAMES.length) % KEY_NAMES.length;
    MK.state.key = KEY_NAMES[newIdx];
    MK.state.transpose += delta;
    sel.value = MK.state.key;
    if (badgeTrans) badgeTrans.textContent = String(MK.state.transpose);
    updateSuggestions();
  }

  // Instrument tabs
  document.getElementById("tabPiano")?.addEventListener("click", () =>
    setInstrument("piano")
  );
  document.getElementById("tabGuitar")?.addEventListener("click", () =>
    setInstrument("guitar")
  );
  document.getElementById("tabUke")?.addEventListener("click", () =>
    setInstrument("ukulele")
  );

  function setInstrument(name) {
    MK.state.instrument = name;
    ["tabPiano", "tabGuitar", "tabUke"].forEach((id) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.classList.toggle(
        "active",
        (id === "tabPiano" && name === "piano") ||
          (id === "tabGuitar" && name === "guitar") ||
          (id === "tabUke" && name === "ukulele")
      );
    });
    updateSuggestions();
  }

  // Nút "Tự gợi ý hợp âm"
  document.getElementById("btnSuggest")?.addEventListener("click", () => {
    updateSuggestions(true);
  });

  // Gợi ý lần đầu
  updateSuggestions(false);
}

function updateSuggestions(force = false) {
  const suggestBox = document.getElementById("suggest");
  if (!suggestBox) return;

  const keyName = MK.state.key || "C";
  const rootIdx = keyIndex(keyName);
  const pattern = MK.state.progression || "I–V–vi–IV";

  const tokens = pattern.split(/[\-–]+/).map((t) => t.trim()).filter(Boolean);
  if (!tokens.length) {
    suggestBox.value = "";
    return;
  }

  const chords = tokens.map((tk) => chordFromRoman(rootIdx, tk));
  const line1 = `[Key ${keyName}]  ${pattern}`;
  const line2 = chords.join("  |  ");

  let extra = "";
  if (force) {
    extra = `\n\nGợi ý thêm: Chơi arpeggio trên ${
      MK.state.instrument === "guitar" ? "guitar" : "piano"
    } với nhịp 4/4, tempo vừa phải.`;
  }

  suggestBox.value = line1 + "\n" + line2 + extra;
}

// =========================
// 3) SAVE / LOAD / SHARE
// =========================
function initSaveLoadShare() {
  document.getElementById("btnSave")?.addEventListener("click", saveSong);
  document.getElementById("btnLoadLocal")?.addEventListener("click", loadSong);
  document.getElementById("btnShare")?.addEventListener("click", shareSong);

  // Tự load từ URL (nếu có ?song=...)
  tryLoadFromUrl();
}

function collectSongData() {
  return {
    title: document.getElementById("title")?.value || "",
    key: MK.state.key,
    progression: MK.state.progression,
    transpose: MK.state.transpose,
    instrument: MK.state.instrument,
    lyrics: document.getElementById("lyrics")?.value || "",
    suggest: document.getElementById("suggest")?.value || "",
  };
}

function applySongData(data) {
  if (!data) return;
  const titleEl = document.getElementById("title");
  const selKey = document.getElementById("selKey");
  const selProg = document.getElementById("selProg");
  const lyricsEl = document.getElementById("lyrics");
  const suggestEl = document.getElementById("suggest");
  const badgeTrans = document.getElementById("transposeView");

  if (titleEl) titleEl.value = data.title || "";
  if (selKey && data.key && KEY_NAMES.includes(data.key)) {
    selKey.value = data.key;
    MK.state.key = data.key;
  }
  if (typeof data.transpose === "number") {
    MK.state.transpose = data.transpose;
    if (badgeTrans) badgeTrans.textContent = String(data.transpose);
  }
  if (selProg && data.progression) {
    selProg.value = data.progression;
    MK.state.progression = data.progression;
  }
  if (lyricsEl && typeof data.lyrics === "string") lyricsEl.value = data.lyrics;
  if (suggestEl && typeof data.suggest === "string")
    suggestEl.value = data.suggest;

  if (data.instrument) {
    MK.state.instrument = data.instrument;
  }

  updateSuggestions(false);
}

function saveSong() {
  const data = collectSongData();
  try {
    localStorage.setItem(STORAGE_KEY_SONG, JSON.stringify(data));
    log("✅ Đã lưu bài hiện tại vào trình duyệt.");
  } catch (e) {
    log("❌ Lỗi lưu localStorage:", e.message || e);
  }
}

function loadSong() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SONG);
    if (!raw) {
      log("⚠️ Chưa có bản lưu nào.");
      return;
    }
    const data = JSON.parse(raw);
    applySongData(data);
    log("✅ Đã tải lại bài từ bản lưu.");
  } catch (e) {
    log("❌ Lỗi đọc bản lưu:", e.message || e);
  }
}

function shareSong() {
  const data = collectSongData();
  try {
    const json = JSON.stringify(data);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    const url =
      window.location.origin +
      window.location.pathname +
      "?song=" +
      encodeURIComponent(b64);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => log("📎 Đã copy link share vào clipboard."))
        .catch(() => log("🔗 Link share:", url));
    } else {
      log("🔗 Link share:", url);
    }
  } catch (e) {
    log("❌ Lỗi tạo link share:", e.message || e);
  }
}

function tryLoadFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("song");
  if (!encoded) return;
  try {
    const json = decodeURIComponent(encoded);
    const data = JSON.parse(decodeURIComponent(escape(atob(json))));
    applySongData(data);
    log("🌐 Đã nạp bài từ link share.");
  } catch (e) {
    try {
      const data = JSON.parse(decodeURIComponent(escape(atob(encoded))));
      applySongData(data);
      log("🌐 Đã nạp bài từ link share.");
    } catch (err) {
      log("❌ Không đọc được dữ liệu từ link share.");
    }
  }
}

// =========================
// 4) PI SDK + PI PAY (LIVE)
// =========================

function initPiSection() {
  // Backend URL từ localStorage, giống logic index.html
  const backendInput = document.getElementById("txtBackend");
  const backendNow = document.getElementById("backendNow");
  const stored = (localStorage.getItem("backend") || "").trim();

  if (backendInput) backendInput.value = stored;
  if (backendNow) backendNow.textContent = stored || "(none)";

  MK.pi.backendUrl = stored.replace(/\/$/, "");
  MK.pi.apiBase = MK.pi.backendUrl ? MK.pi.backendUrl + "/api" : "";

  initPiSDK();

  const btnLogin = document.getElementById("btnPiLogin");
  const btnPay = document.getElementById("btnPiPay");
  const btnCheck = document.getElementById("btnCheck");

  if (btnLogin) {
    btnLogin.addEventListener("click", () => {
      log("🟣 Pi Login button clicked");
      piLogin();
    });
  }

  if (btnPay) {
    btnPay.addEventListener("click", () => {
      log("🟣 Pi Pay (LIVE) button clicked");
      piPayLive(0.1);
    });
  }

  if (btnCheck) {
    btnCheck.addEventListener("click", async () => {
      log("🔍 Check Premium (demo).");
      const auth = await piLogin();
      if (auth && auth.user && auth.user.username) {
        log("⭐ Premium check demo cho user:", auth.user.username);
      } else {
        log("⭐ Premium check demo cho user: unknown");
      }
    });
  }
}

function initPiSDK() {
  if (!window.Pi) {
    log(
      "❌ Pi SDK not found. Hãy mở trong Pi Browser và chắc script sdk.minepi.com đã load."
    );
    return;
  }
  try {
    Pi.init({
      version: "2.0",
      sandbox: false,
      onIncompletePaymentFound(payment) {
        log("⚠️ Incomplete payment (LIVE):", payment && payment.identifier);
      },
    });
    log("✅ Pi SDK initialized (LIVE).");

    const isPiBrowser =
      typeof Pi.isPiBrowser === "function" ? Pi.isPiBrowser() === true : false;
    if (!isPiBrowser) {
      log(
        "⚠️ Không nhận diện được Pi Browser – chỉ nên test thanh toán thật trong Pi Browser."
      );
    } else {
      log("✅ Đang chạy trong Pi Browser (OK cho live payment).");
    }
  } catch (err) {
    log("❌ Lỗi init Pi SDK (LIVE):", err?.message || err);
  }
}

async function piLogin() {
  if (!window.Pi) {
    log("❌ Pi SDK chưa sẵn sàng.");
    return null;
  }
  try {
    const auth = await Pi.authenticate(
      ["username", "payments"],
      () => log("🔐 PIN callback được gọi (LIVE).")
    );
    if (!auth || !auth.user) {
      log("❌ Pi Login trả về null/undefined.");
      return null;
    }
    MK.pi.user = auth.user;
    log("✅ Pi Login OK – user:", auth.user.username);
    log(
      "ℹ️ User info:",
      JSON.stringify({ username: auth.user.username, user_uid: auth.user.uid })
    );
    return auth;
  } catch (err) {
    log("❌ Pi Login lỗi (LIVE):", err?.message || err);
    return null;
  }
}

async function backendCreatePayment(amount, username, user_uid) {
  if (!MK.pi.apiBase) {
    log("❌ API_BASE rỗng – chưa cấu hình Backend URL.");
    throw new Error("API_BASE empty");
  }
  const payload = { amount, username, user_uid };

  const res = await fetch(MK.pi.apiBase + "/create-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    log("❌ Backend /create-payment lỗi:", data || (await res.text()));
    throw new Error(data.error || "create-payment failed");
  }
  log(
    "✅ Backend /create-payment OK, payment:",
    data.payment && data.payment.identifier
  );
  return data.payment;
}

async function piPayLive(amount) {
  try {
    const auth = await piLogin();
    if (!auth || !auth.user) {
      log("❌ Không có thông tin user sau login, hủy payment.");
      return;
    }

    const username = auth.user.username;
    const user_uid = auth.user.uid;

    log("➡️ Gửi dữ liệu tạo payment lên backend:", username, user_uid);

    // 1) nhờ backend tạo payment trên Pi server
    const serverPayment = await backendCreatePayment(
      amount,
      username,
      user_uid
    );

    // 2) chuẩn bị object cho Pi.createPayment
    const paymentDto = {
      amount: serverPayment.amount,
      memo: serverPayment.memo,
      metadata: serverPayment.metadata,
      paymentId: serverPayment.identifier,
    };

    const callbacks = {
      onReadyForServerApproval: async (paymentId) => {
        log("🟡 readyForServerApproval (LIVE):", paymentId);
      },
      onReadyForServerCompletion: async (paymentId) => {
        log("🟡 readyForServerCompletion (LIVE):", paymentId);
      },
      onCancel: (paymentId) => {
        log("⛔ PAYMENT CANCELLED (LIVE):", paymentId);
      },
      onError: (err) => {
        log("❌ PAYMENT ERROR (LIVE):", err?.message || err);
      },
    };

    log("▶️ Bắt đầu thanh toán LIVE, amount =", String(amount), "Pi…");
    const payment = await Pi.createPayment(paymentDto, callbacks);
    log("✅ createPayment (LIVE) đã xong:", payment);
  } catch (e) {
    log("❌ X payment (LIVE) lỗi:", e?.message || e);
  }
}

// =========================
// 5) BOOT
// =========================
window.addEventListener("DOMContentLoaded", () => {
  try {
    initPlayer();
    initKeyAndProgression();
    initSaveLoadShare();
    initPiSection();
    updatePlayButtons();
    log("🎼 PiChordify Kingdom frontend (index.js) đã khởi động.");
  } catch (e) {
    log("❌ Lỗi init index.js:", e.message || e);
  }
});
