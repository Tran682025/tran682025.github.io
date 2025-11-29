// PiChordify Kingdom — frontend clean build
// Tương thích giao diện v8.10, thêm Pi Login + Pi Payment (LIVE) chạy được thật.

// Namespace chính
const MK = {
  audio: null,
  state: {
    isPlaying: false,
    duration: 0,
    user: null,
  },
};

function $(id) {
  return document.getElementById(id);
}

// === Auto fill "Tên bài" từ MP3 / URL ===
var titleEl = $("titleEl");

function setTitleFromName(name) {
  if (!titleEl) return;
  var clean = (name || "").split("/").pop() || name;
  clean = clean.split("?")[0].split("#")[0];
  clean = clean.replace(/\.(mp3|wav|m4a|aac|flac)$/i, "");
  if (!titleEl.value.trim()) {
    try {
      titleEl.value = decodeURI(clean);
    } catch (e) {
      titleEl.value = clean;
    }
  }
}

// === Log panel (viết thẳng ra textarea #log) ===
function log() {
  var args = Array.prototype.slice.call(arguments);
  var box = $("log");
  var textParts = [];

  for (var i = 0; i < args.length; i++) {
    var x = args[i];
    if (typeof x === "string") {
      textParts.push(x);
    } else {
      try {
        textParts.push(JSON.stringify(x));
      } catch (e) {
        textParts.push(String(x));
      }
    }
  }

  var now = new Date().toLocaleTimeString("vi-VN", { hour12: false });
  var line = "[" + now + "] " + textParts.join(" ");

  if (!box) {
    console.log(line);
    return;
  }

  box.value = (box.value ? box.value + "\n" : "") + line;
  box.scrollTop = box.scrollHeight;
}

//////////////////////////////
// 1. Audio player + volume
//////////////////////////////

function initPlayer() {
  var audio = $("audio");
  if (!audio) {
    console.error("Không tìm thấy thẻ <audio>.");
    return;
  }
  MK.audio = audio;

  var btnPlay = $("btnPlay");
  var btnPause = $("btnPause");
  var btnStop = $("btnStop");
  var timeSpan = $("time");
  var bar = $("bar");

  var vol = $("vol");
  var btnMute = $("btnMute");

  var urlInput = $("audiourl");
  var btnLoad = $("btnLoad");

  var fileInput =
    $("filepick") ||
    document.querySelector('input[type="file"][accept*="audio"]') ||
    document.querySelector('input[type="file"]');

  var btnPick =
    $("btnPick") ||
    document.querySelector('button[id*="Pick"],button[id*="pick"]');

  function mm(v) {
    return String(Math.floor(v / 60)).padStart(2, "0");
  }
  function ss(v) {
    return String(v % 60).padStart(2, "0");
  }

  function updateTime() {
    if (!timeSpan || !bar) return;
    var cur = Math.floor(audio.currentTime || 0);
    var dur = Math.floor(audio.duration || 0);
    timeSpan.textContent = mm(cur) + ":" + ss(cur) + " / " + mm(dur) + ":" + ss(dur);
    bar.value = dur > 0 ? String((cur / dur) * 100) : "0";
  }

  audio.addEventListener("timeupdate", updateTime);
  audio.addEventListener("loadedmetadata", function () {
    MK.state.duration = audio.duration || 0;
    updateTime();
  });
  audio.addEventListener("ended", function () {
    MK.state.isPlaying = false;
    updateTime();
  });

  if (bar) {
    bar.addEventListener("input", function () {
      if (!audio.duration || !isFinite(audio.duration)) return;
      var percent = Number(bar.value || "0");
      audio.currentTime = (percent / 100) * audio.duration;
      updateTime();
    });
  }

  if (vol) {
    vol.addEventListener("input", function () {
      var v = Number(vol.value || "1");
      audio.volume = v;
      if (v > 0) {
        audio.muted = false;
        if (btnMute) btnMute.textContent = "Mute";
      }
    });
  }

  if (btnMute) {
    btnMute.addEventListener("click", function () {
      audio.muted = !audio.muted;
      btnMute.textContent = audio.muted ? "Unmute" : "Mute";
    });
  }

  if (btnPlay) {
    btnPlay.addEventListener("click", function () {
      if (!audio.src) {
        log("⚠ Chưa có file audio. Hãy chọn hoặc load file MP3 trước.");
        return;
      }
      audio
        .play()
        .then(function () {
          MK.state.isPlaying = true;
          log("▶ Bắt đầu phát audio.");
        })
        .catch(function (e) {
          console.error(e);
          log("❌ Lỗi khi phát audio:", e && e.message ? e.message : e);
        });
    });
  }

  if (btnPause) {
    btnPause.addEventListener("click", function () {
      audio.pause();
      MK.state.isPlaying = false;
      log("⏸ Tạm dừng audio.");
    });
  }

  if (btnStop) {
    btnStop.addEventListener("click", function () {
      audio.pause();
      audio.currentTime = 0;
      MK.state.isPlaying = false;
      updateTime();
      log("⏹ Dừng audio.");
    });
  }

  if (btnPick && fileInput) {
    btnPick.addEventListener("click", function () {
      fileInput.click();
    });

    fileInput.addEventListener("change", function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var url = URL.createObjectURL(file);
      audio.src = url;
      MK.state.duration = 0;
      MK.state.isPlaying = false;
      updateTime();
      setTitleFromName(file.name);
      log("📂 Đã load file MP3 local: " + file.name + ".");
    });
  }

  if (btnLoad && urlInput) {
    btnLoad.addEventListener("click", function () {
      var url = (urlInput.value || "").trim();
      if (!url) {
        log("⚠ Hãy nhập URL file MP3 trước.");
        return;
      }
      audio.src = url;
      MK.state.duration = 0;
      MK.state.isPlaying = false;
      updateTime();
      setTitleFromName(url);
      log("🌐 Đã load MP3 từ URL: " + url);
    });
  }

  log("🎵 Player đã khởi động.");
}

//////////////////////////////
// 2. Gợi ý hợp âm theo key
//////////////////////////////

var MK_PROGS = {
  "I-V-vi-IV": ["I", "V", "vi", "IV"],
  "I-vi-IV-V": ["I", "vi", "IV", "V"],
  "I-IV-V": ["I", "IV", "V"],
};

var MK_KEYS = {
  C: ["C", "Dm", "Em", "F", "G", "Am", "Bdim"],
  G: ["G", "Am", "Bm", "C", "D", "Em", "F#dim"],
  D: ["D", "Em", "F#m", "G", "A", "Bm", "C#dim"],
  A: ["A", "Bm", "C#m", "D", "E", "F#m", "G#dim"],
  F: ["F", "Gm", "Am", "Bb", "C", "Dm", "Edim"],
};

function suggestChord(key, degree) {
  var scale = MK_KEYS[key];
  if (!scale) return "?";
  var map = { I: 0, ii: 1, iii: 2, IV: 3, V: 4, vi: 5, vii: 6 };
  var idx = map[degree];
  if (idx == null) return "?";
  return scale[idx] || "?";
}

function initChordSuggest() {
  var keySel = $("selKey");
  var progSel = $("selProg");
  var suggestBox = $("suggest");
  var btnSuggest =
    $("btnSuggest") ||
    document.querySelector('button[id*="Suggest"],button[id*="suggest"]');

  if (!keySel || !progSel || !suggestBox || !btnSuggest) return;

  btnSuggest.addEventListener("click", function () {
    var key = keySel.value || "C";
    var progName = progSel.value || "I-V-vi-IV";
    var degrees = MK_PROGS[progName] || MK_PROGS["I-V-vi-IV"];
    var chords = degrees.map(function (deg) {
      return suggestChord(key, deg);
    });
    var lines = [];
    lines.push("[Key " + key + "]  " + progName);
    lines.push(chords.join("   |   "));
    suggestBox.value = lines.join("\n");
  });
}

//////////////////////////////
// 3. Auto pattern fill toàn bài
//////////////////////////////

function parsePattern(str) {
  return (str || "")
    .split(/\s+/)
    .map(function (x) {
      return x.trim();
    })
    .filter(function (x) {
      return Boolean(x);
    });
}

function initAutoPatternFill() {
  var patternInput =
    $("patternInput") ||
    $("patternBox") ||
    $("pattern") ||
    document.querySelector("textarea[id*='pattern']");

  var btnFillAll =
    $("btnAutoPattern") ||
    $("btnPattern") ||
    document.querySelector("button[id*='Pattern'],button[id*='pattern']");

  var lyricsBox = $("lyrics");

  if (!patternInput || !btnFillAll || !lyricsBox || !MK.audio) return;

  btnFillAll.addEventListener("click", function () {
    var chords = parsePattern(patternInput.value);
    if (!chords.length) {
      log("⚠ Chưa nhập pattern hợp âm (ví dụ: C G Am F | F G Em Am).");
      return;
    }

    var duration = MK.audio.duration;
    if (!duration || !isFinite(duration)) {
      log("⚠ Chưa đọc được thời lượng MP3. Hãy load file, bấm Play một lần rồi thử lại.");
      return;
    }

    var total = Math.floor(duration);
    if (total < 4) {
      log("⚠ Bài hát quá ngắn, không auto fill được.");
      return;
    }

    var step = 4;
    var lines = [];
    var t = 0;
    var i = 0;

    function fmt(sec) {
      var mm = String(Math.floor(sec / 60)).padStart(2, "0");
      var ss = String(sec % 60).padStart(2, "0");
      return mm + ":" + ss;
    }

    while (t < total) {
      var chord = chords[i % chords.length];
      lines.push(fmt(t) + "    " + chord);
      t += step;
      i++;
    }

    lyricsBox.value = lines.join("\n");
    log("✅ Đã auto fill " + lines.length + " dòng hợp âm cho cả bài (pattern lặp, " + step + "s / hợp âm).");
  });
}

//////////////////////////////
// 4. Chord Runner
//////////////////////////////

function initChordRunner() {
  var lyricsBox = $("lyrics");
  var currentChordSpan = $("currentChord");
  if (!lyricsBox || !currentChordSpan || !MK.audio) return;

  var parsed = [];

  function parseLyrics() {
    parsed = [];
    var lines = lyricsBox.value.split("\n");
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var m = line.match(/^(\d{2}):(\d{2})\s+(.+)$/);
      if (!m) continue;
      var t = Number(m[1]) * 60 + Number(m[2]);
      var chord = m[3].trim();
      parsed.push({ time: t, chord: chord });
    }
  }

  lyricsBox.addEventListener("input", parseLyrics);
  parseLyrics();

  setInterval(function () {
    if (!parsed.length || MK.audio.paused) return;
    var now = Math.floor(MK.audio.currentTime || 0);
    var found = "";
    for (var i = parsed.length - 1; i >= 0; i--) {
      if (now >= parsed[i].time) {
        found = parsed[i].chord;
        break;
      }
    }
    currentChordSpan.textContent = found;
  }, 400);
}

//////////////////////////////
// 5. Log panel toggle
//////////////////////////////

function initLogPanel() {
  var logBox = $("log");
  var btn = $("btnLogToggle");
  if (!logBox || !btn) return;
  btn.addEventListener("click", function () {
    var isMax = logBox.classList.toggle("log-max");
    btn.textContent = isMax ? "Thu nhỏ log" : "Mở rộng log";
  });
}

//////////////////////////////
// 6. Backend settings
//////////////////////////////

function getBackend() {
  return localStorage.getItem("backend") || "";
}

function setBackend(url) {
  localStorage.setItem("backend", url);
  var span = $("backendNow");
  if (span) span.textContent = url || "(none)";
}

function initBackendSettings() {
  var backendInput = $("backendUrl");
  var btnSaveBackend = $("btnSaveBackend");
  var span = $("backendNow");

  if (span) span.textContent = getBackend() || "(none)";
  if (backendInput) backendInput.value = getBackend();

  if (btnSaveBackend && backendInput) {
    btnSaveBackend.addEventListener("click", function () {
      var url = (backendInput.value || "").trim();
      setBackend(url);
      log("🔧 Đã lưu backend:", url || "(none)");
    });
  }
}

//////////////////////////////
// 7. Pi SDK (LIVE)
//////////////////////////////

function onIncompletePaymentFound(payment) {
  log("⚠ onIncompletePaymentFound:", payment);
}

function initPiSdk() {
  if (typeof window.Pi === "undefined") {
    log("⚠ Không tìm thấy Pi SDK (window.Pi). Mở app trong Pi Browser.");
    return;
  }

  var Pi = window.Pi;

  try {
    Pi.init({ version: "2.0", sandbox: false });
    log("✅ Pi SDK initialized (LIVE).");
  } catch (e) {
    console.error(e);
    log("❌ Lỗi init Pi SDK:", e && e.message ? e.message : e);
  }

  var btnLogin = $("btnPiLogin");
  var btnPremium = $("btnCheckPremium");
  var btnPayLive = $("btnPayLive");

  if (btnLogin) {
    btnLogin.addEventListener("click", async function () {
      try {
        log("⏳ Đang login với Pi...");
        var scopes = ["username", "payments"];
        var auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
        var username = auth && auth.user ? auth.user.username : "(unknown)";
        MK.state.user = auth.user || null;
        log("✅ Login thành công.", username);
      } catch (e) {
        console.error(e);
        log("❌ Pi Login lỗi:", e && e.message ? e.message : e);
      }
    });
  }

  if (btnPremium) {
    btnPremium.addEventListener("click", async function () {
      var backend = getBackend();
      if (!backend) {
        log("⚠ Chưa cấu hình backend (dev). Hãy vào 'Cài đặt backend'.");
        return;
      }
      try {
        log("⏳ Đang gửi yêu cầu kiểm tra Premium...");
        var res = await fetch(backend.replace(/\/+$/, "") + "/premium-status", {
          credentials: "include",
        });
        var data = await res.json();
        log("📡 Premium:", data);
      } catch (e) {
        console.error(e);
        log("❌ Lỗi gọi /premium-status:", e && e.message ? e.message : e);
      }
    });
  }

  if (btnPayLive) {
    btnPayLive.addEventListener("click", async function () {
      var backend = getBackend();
      if (!backend) {
        log("⚠ Chưa cấu hình backend (dev). Hãy vào 'Cài đặt backend'.");
        return;
      }

      try {
        log("⏳ Bắt đầu tạo thanh toán (LIVE)...");

        var amount = "0.1"; // 0.1 Pi cho nhẹ
        var memo = "Musickingdom test for Tran2020";
        var metadata = {
          username: MK.state.user && MK.state.user.username ? MK.state.user.username : "Tran2020",
          app: "PiChordifyKingdom",
          version: "8.10-clean",
        };

        var paymentData = {
          amount: amount,
          memo: memo,
          metadata: metadata,
        };

        var backendBase = backend.replace(/\/+$/, "");

        var payment = await Pi.createPayment(paymentData, {
          onReadyForServerApproval: async function (paymentId) {
            log("🛰️ onReadyForServerApproval, paymentId:", paymentId);
            try {
              var res = await fetch(backendBase + "/pay-live", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  identifier: paymentId,
                  amount: paymentData.amount,
                  username: paymentData.metadata.username,
                }),
              });
              var data = await res.json();
              log("💾 Backend /pay-live trả về:", data);
            } catch (err) {
              console.error(err);
              log("❌ Lỗi gọi backend /pay-live:", err && err.message ? err.message : err);
            }
          },
          onReadyForServerCompletion: function (paymentId, txid) {
            log("✅ onReadyForServerCompletion:", paymentId, "txid:", txid);
          },
          onCancel: function (paymentId) {
            log("⚠ User huỷ thanh toán:", paymentId);
          },
          onError: function (err) {
            console.error(err);
            log("❌ Lỗi Pi Payment (callback):", err && err.message ? err.message : err);
          },
        });

        log("📩 Pi.createPayment trả về:", payment);
      } catch (e) {
        console.error(e);
        log("❌ X payment (LIVE) lỗi:", e && e.message ? e.message : e);
      }
    });
  }
}

//////////////////////////////
// 8. Boot
//////////////////////////////

window.addEventListener("DOMContentLoaded", function () {
  try {
    initPlayer();
    initChordSuggest();
    initAutoPatternFill();
    initChordRunner();
    initBackendSettings();
    initPiSdk();
    initLogPanel();
    log("🎼 PiChordify Kingdom frontend (index.js clean build) đã khởi động.");
  } catch (e) {
    console.error(e);
    log("❌ Lỗi init index.js:", e && e.message ? e.message : e);
  }
});
function onIncompletePaymentFound(payment) {
  log("⚠ onIncompletePaymentFound:", payment);

  try {
    var backend = getBackend();
    if (!backend) {
      log("⚠ Chưa cấu hình backend nên không auto-complete được pending payment.");
      return;
    }

    var identifier = payment && payment.identifier;
    var txid =
      payment &&
      payment.transaction &&
      payment.transaction.txid;

    if (!identifier || !txid) {
      log("⚠ Pending payment thiếu identifier hoặc txid, không thể auto-complete.");
      return;
    }

    var url = backend.replace(/\/+$/, "") + "/complete-payment";
    var body = { identifier: identifier, txid: txid };

    log("⏳ Auto-complete pending payment trên server...", body);

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        log("✅ Kết quả /complete-payment:", data);
      })
      .catch(function (err) {
        log(
          "❌ Lỗi gọi /complete-payment:",
          err && err.message ? err.message : err
        );
      });
  } catch (e) {
    log(
      "❌ Lỗi xử lý onIncompletePaymentFound:",
      e && e.message ? e.message : e
    );
  }
}
