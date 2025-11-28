// =========================
// PiChordify Kingdom – index.js
// Frontend logic: helpers, log, player, chords, save/share + Pi Login & Pi Pay (LIVE)
// =========================

// ===== Helpers & logger (tự lập, không phụ thuộc index.html) =====
const $id = (id) => document.getElementById(id);

function log(...args) {
  try {
    const now = new Date().toLocaleTimeString();
    const line =
      `[${now}] ` +
      args
        .map((x) => (typeof x === "string" ? x : JSON.stringify(x)))
        .join(" ");

    const box = document.getElementById("log");
    if (box) {
      box.value = (box.value ? box.value + "\n" : "") + line;
      box.scrollTop = box.scrollHeight;
    }
    console.log(...args);
  } catch (e) {
    console.error("log error", e);
  }
}

window.onerror = (m, s, l, c, e) => {
  log("❌ JS error:", m, "@", s, ":", l, c, e && e.stack);
};
window.addEventListener("unhandledrejection", (ev) => {
  log("❌ Promise error:", ev.reason && ev.reason.message || ev.reason);
});

// ===== Global state =====
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
const KEY_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];

// ===== Utils =====
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
function parseRoman(token) {
  const clean = (token || "").toLowerCase().replace(/[^iv]/g, "");
  const map = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7 };
  const deg = map[clean] || 1;
  const isMinor = token === token.toLowerCase();
  return { degree: deg, isMinor };
}
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
  MK.audio = $id("audio");
  MK.progressBar = $id("bar");
  MK.timeLabel = $id("time");

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

  const pickBtn = $id("btnPick");
  const fileInput = $id("filePick");
  if (pickBtn && fileInput) {
    pickBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      $id("audioUrl").value = "";
      MK.audio.src = url;
      MK.audio.play().catch(() => {});
      MK.state.isPlaying = true;
      log("🎧 Đã load file MP3 local:", file.name);
      updatePlayButtons();
    });
  }

  const loadBtn = $id("btnLoad");
  if (loadBtn) {
    loadBtn.addEventListener("click", () => {
      const url = $id("audioUrl").value.trim();
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

  $id("btnPlay")?.addEventListener("click", () => {
    if (!MK.audio || !MK.audio.src) {
      log("⚠️ Chưa có file audio.");
      return;
    }
    MK.audio.play().catch((e) => log("❌ Lỗi play:", e.message || e));
    MK.state.isPlaying = true;
    updatePlayButtons();
  });

  $id("btnPause")?.addEventListener("click", () => {
    MK.audio?.pause();
    MK.state.isPlaying = false;
    updatePlayButtons();
  });

  $id("btnStop")?.addEventListener("click", () => {
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
  const playBtn = $id("btnPlay");
  const pauseBtn = $id("btnPause");
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
  const selKey = $id("selKey");
  const selProg = $id("selProg");
  const badgeTrans = $id("transposeView");

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

  $id("btnUp")?.addEventListener("click", () => changeKey(+1));
  $id("btnDown")?.addEventListener("click", () => changeKey(-1));

  function changeKey(delta) {
    const sel = $id("selKey");
    if (!sel) return;
    const idx = keyIndex(MK.state.key);
    const newIdx = (idx + delta + KEY_NAMES.length) % KEY_NAMES.length;
    MK.state.key = KEY_NAMES[newIdx];
    MK.state.transpose += delta;
    sel.value = MK.state.key;
    if (badgeTrans) badgeTrans.textContent = String(MK.state.transpose);
    updateSuggestions();
  }

  $id("tabPiano")?.addEventListener("click", () => setInstrument("piano"));
  $id("tabGuitar")?.addEventListener("click", () => setInstrument("guitar"));
  $id("tabUke")?.addEventListener("click", () => setInstrument("ukulele"));

  function setInstrument(name) {
    MK.state.instrument = name;
    ["tabPiano", "tabGuitar", "tabUke"].forEach((id) => {
      const btn = $id(id);
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

  $id("btnSuggest")?.addEventListener("click", () => updateSuggestions(true));

  updateSuggestions(false);
}

function updateSuggestions(force = false) {
  const suggestBox = $id("suggest");
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
  $id("btnSave")?.addEventListener("click", saveSong);
  $id("btnLoadLocal")?.addEventListener("click", loadSong);
  $id("btnShare")?.addEventListener("click", shareSong);
  tryLoadFromUrl();
}

function collectSongData() {
  return {
    title: $id("title")?.value || "",
    key: MK.state.key,
    progression: MK.state.progression,
    transpose: MK.state.transpose,
    instrument: MK.state.instrument,
    lyrics: $id("lyrics")?.value || "",
    suggest: $id("suggest")?.value || "",
    audioUrl: $id("audioUrl")?.value || "",   // V8-C: mang luôn link MP3 (nếu có)
  };
}

function applySongData(data) {
  if (!data) return;
  const titleEl = $id("title");
  const selKey = $id("selKey");
  const selProg = $id("selProg");
  const lyricsEl = $id("lyrics");
  const suggestEl = $id("suggest");
  const badgeTrans = $id("transposeView");
  const audioUrlEl = $id("audioUrl");

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

  if (lyricsEl && typeof data.lyrics === "string") {
    lyricsEl.value = data.lyrics;
  }

  if (suggestEl && typeof data.suggest === "string") {
    suggestEl.value = data.suggest;
  }

  if (data.instrument) {
    MK.state.instrument = data.instrument;
  }

  // V8-C: nếu có audioUrl, tự điền vào ô và gán cho player (không auto-play)
  if (data.audioUrl && typeof data.audioUrl === "string") {
    if (audioUrlEl) audioUrlEl.value = data.audioUrl;
    if (MK.audio) {
      MK.audio.src = data.audioUrl;
      MK.state.isPlaying = false;
      MK.state.current = 0;
      updateTimeUI();
      updateProgressUI();
      log("🎧 Đã gắn link MP3 từ bài chia sẻ:", data.audioUrl);
    }
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
        .then(() =>
          log("📎 Đã copy link chia sẻ bài học vào clipboard. Gửi cho bạn bè để mở đúng bài này.")
        )
        .catch(() => log("🔗 Link chia sẻ:", url));
    } else {
      log("🔗 Link chia sẻ:", url);
    }
  } catch (e) {
    log("❌ Lỗi tạo link chia sẻ:", e.message || e);
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
    log("🌐 Đã nạp bài từ link chia sẻ (v8).");
    if (data.title) {
      log("🎵 Tiêu đề:", data.title);
    }
    if (data.audioUrl) {
      log("🎧 Có đính kèm link MP3 trong bài chia sẻ.");
    }
  } catch (e) {
    try {
      const data = JSON.parse(decodeURIComponent(escape(atob(encoded))));
      applySongData(data);
      log("🌐 Đã nạp bài từ link chia sẻ (fallback).");
    } catch {
      log("❌ Không đọc được dữ liệu từ link chia sẻ.");
    }
  }
}

// =========================
// 4) PI SDK + PI PAY (LIVE)
// =========================
function initPiSection() {
  const backendInput = $id("txtBackend");
  const backendNow = $id("backendNow");
  const stored = (localStorage.getItem("backend") || "").trim();

  if (backendInput) backendInput.value = stored;
  if (backendNow) backendNow.textContent = stored || "(none)";

  MK.pi.backendUrl = stored.replace(/\/$/, "");
  MK.pi.apiBase = MK.pi.backendUrl ? MK.pi.backendUrl + "/api" : "";

  initPiSDK();

  $id("btnPiLogin")?.addEventListener("click", () => {
    log("🟣 Pi Login button clicked");
    piLogin();
  });

  $id("btnPiPay")?.addEventListener("click", () => {
    log("🟣 Pi Pay (LIVE) button clicked");
    piPayLive(0.1);
  });

  $id("btnCheck")?.addEventListener("click", async () => {
    log("🔍 Check Premium (demo).");
    const auth = await piLogin();
    if (auth && auth.user && auth.user.username) {
      log("⭐ Premium check demo cho user:", auth.user.username);
    } else {
      log("⭐ Premium check demo cho user: unknown");
    }
  });
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

    const serverPayment = await backendCreatePayment(
      amount,
      username,
      user_uid
    );

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
// === v7.7 Volume & Mute ===
const audio = document.getElementById("audio");
const vol = document.getElementById("vol");
const btnMute = document.getElementById("btnMute");

if (audio && vol) {
  vol.addEventListener("input", () => {
    audio.volume = Number(vol.value);
    if (audio.volume > 0) {
      audio.muted = false;
      btnMute.textContent = "Mute";
    }
  });
}

if (audio && btnMute) {
  btnMute.addEventListener("click", () => {
    audio.muted = !audio.muted;
    btnMute.textContent = audio.muted ? "Unmute" : "Mute";
  });
}
// === Chord Runner: theo dõi hợp âm đang phát + auto-scroll ===
function initChordRunner(){
  const lyricsBox       = document.getElementById("lyrics");
  const currentChordSpan = document.getElementById("currentChord");
  if (!lyricsBox || !currentChordSpan) return;

  // mỗi phần tử: { time: giây, chord: "Em / D", lineIndex }
  let parsed = [];
  let totalLines = 0;
  let lastChord = "";

  function parseLyrics(){
    parsed = [];
    const lines = lyricsBox.value.split("\n");
    totalLines = lines.length || 1;

    for (let i = 0; i < lines.length; i++){
      const line = lines[i];
      // match: mm:ss  phần còn lại → chord / lời
      const m = line.match(/^(\d{2}):(\d{2})\s+(.*)$/);
      if (!m) continue;
      const t     = Number(m[1]) * 60 + Number(m[2]);
      const chord = m[3].trim();
      parsed.push({ time: t, chord, lineIndex: i });
    }
  }

  // parse ban đầu + khi người dùng sửa lời
  parseLyrics();
  lyricsBox.addEventListener("input", parseLyrics);

  const audio = document.getElementById("audio");
  if (!audio) return;

  // cứ 400ms cập nhật 1 lần
  setInterval(() => {
    if (!parsed.length || audio.paused) return;

    const now = Math.floor(audio.currentTime);
    let foundChord = "";
    let foundIndex = -1;

    // tìm dòng gần nhất có time <= now (duyệt ngược cho nhanh)
    for (let i = parsed.length - 1; i >= 0; i--){
      if (now >= parsed[i].time){
        foundChord = parsed[i].chord;
        foundIndex = parsed[i].lineIndex;
        break;
      }
    }

    // update text + pulse khi đổi chord
    if (foundChord !== lastChord){
      currentChordSpan.textContent = foundChord || "";
      if (foundChord){
        currentChordSpan.classList.remove("chord-pulse");
        // trigger lại animation
        void currentChordSpan.offsetWidth;
        currentChordSpan.classList.add("chord-pulse");
      }
      lastChord = foundChord;
    }

    // Auto-scroll lời theo dòng hiện tại
    if (foundIndex >= 0 && lyricsBox.scrollHeight > lyricsBox.clientHeight){
      const ratio = foundIndex / totalLines;
      const maxScroll = lyricsBox.scrollHeight - lyricsBox.clientHeight;
      const targetScroll = Math.max(0, Math.min(maxScroll, ratio * maxScroll));

      // cuộn mượt: lerp nhẹ nhàng
      const current = lyricsBox.scrollTop;
      lyricsBox.scrollTop = current + (targetScroll - current) * 0.25;
    }
  }, 400);
}
// === Auto fill bài hát theo pattern (v8.3) ===
(function initPatternFill() {
  const btn = document.getElementById("btnFillSong");
  const patternInput = document.getElementById("patternAll");
  const lyricsBox = document.getElementById("lyrics");
  const audio = document.getElementById("audio");

  if (!btn || !patternInput || !lyricsBox || !audio) return;

  // Tách pattern: bỏ khoảng trắng thừa, bỏ ký hiệu |
  function parsePattern(str) {
    return (str || "")
      .split(/\s+/)
      .map((s) => s.trim())
      .filter((s) => s && s !== "|");
  }

  // Định dạng thời gian mm:ss
  function fmtTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  btn.addEventListener("click", () => {
    const chords = parsePattern(patternInput.value);

    if (!chords.length) {
      log("⚠️ Chưa nhập pattern hợp âm (ví dụ: C G Am F | F G Em Am).");
      return;
    }

     // ===== Auto-fill lyrics theo pattern cho cả bài (v8.3) =====
    const duration = audio.duration;
    if (!duration || !isFinite(duration)) {
      log("⚠️ Chưa đọc được thời lượng MP3. Hãy chọn file, bấm Play một lần rồi thử lại.");
      return;
    }

    const total = Math.floor(duration);
    if (total < 4) {
      log("⚠️ Bài hát quá ngắn, không auto fill được.");
      return;
    }

    // Mặc định: 4 giây / 1 hợp âm (sau này cho chỉnh ở v8.x)
    const step  = 4;
    const lines = [];
    let t = 0;
    let i = 0;

    // chords ở phía trên callback đã chuẩn bị sẵn
    while (t < total) {
      const chord   = chords[i % chords.length];
      const mm      = String(Math.floor(t / 60)).padStart(2, "0");
      const ss      = String(Math.floor(t % 60)).padStart(2, "0");
      const timeStr = `${mm}:${ss}`;

      lines.push(`${timeStr}   ${chord}`);
      t += step;
      i++;
    }
  lyricsBox.value = lines.join("\n");

  // 👉 Báo cho Chord Runner biết lyrics đã đổi, để parse lại và chạy theo MP3
  try {
    const ev = new Event("input", { bubbles: true });
    lyricsBox.dispatchEvent(ev);
  } catch (e) {
    // fallback cho trình duyệt cũ nếu cần
    const ev = document.createEvent("Event");
    ev.initEvent("input", true, false);
    lyricsBox.dispatchEvent(ev);
  }

  log(`✅ Đã auto fill ${lines.length} dòng hợp âm cho cả bài (pattern lặp, ${step}s / hợp âm).`);
});

// === Focus Mode ===
(function initFocusMode(){
  const btn = document.getElementById("btnFocusMode");
  if (!btn) return;

  btn.addEventListener("click", () => {
    document.body.classList.toggle("focus-mode");
    btn.textContent = document.body.classList.contains("focus-mode")
      ? "Thoát chế độ tập trung"
      : "Chế độ tập trung";
  });
})();
