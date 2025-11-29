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

  // ===== Login =====
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

  // ===== Premium check (giữ nguyên logic cũ) =====
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

  // ===== Pi Pay LIVE =====
  if (btnPayLive) {
    btnPayLive.addEventListener("click", async () => {
      const backend = getBackend();
      if (!backend) {
        log("⚠ Chưa cấu hình backend (dev). Hãy vào 'Cài đặt backend'.");
        return;
      }

      try {
        const amount = 0.1;
        const memo = "Musickingdom test for Tran2020";
        const metadata = { username: "Tran2020" };

        const paymentData = {
          amount,
          memo,
          metadata,
        };

        log("⏳ Bắt đầu tạo thanh toán (LIVE)...");

        const payment = await Pi.createPayment(paymentData, {
          // Bước 1: Pi Wallet sẵn sàng để backend APPROVE
          onReadyForServerApproval: async (paymentId) => {
            log("📨 onReadyForServerApproval, paymentId:", paymentId);
            try {
              const res = await fetch(backend + "/pay-live", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  identifier: paymentId,
                  amount: paymentData.amount,
                  username: paymentData.metadata.username,
                }),
              });
              const data = await res.json();
              log("💾 Backend /pay-live trả về:", data);
            } catch (err) {
              console.error(err);
              log("❌ Lỗi gọi /pay-live:", err.message || err);
            }
          },

          // Bước 2: User đã gửi Pi, Pi Wallet cung cấp txid để COMPLETE
          onReadyForServerCompletion: async (paymentId, txid) => {
            log(
              "📨 onReadyForServerCompletion, paymentId:",
              paymentId,
              "txid:",
              txid
            );
            try {
              const res = await fetch(backend + "/pay-complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier: paymentId, txid }),
              });
              const data = await res.json();
              log("✅ Backend /pay-complete trả về:", data);
            } catch (err) {
              console.error(err);
              log("❌ Lỗi gọi /pay-complete:", err.message || err);
            }
          },

          onCancel: (paymentId) => {
            log("⚠ User huỷ thanh toán:", paymentId);
          },

          onError: (error, payment) => {
            console.error("Pi.createPayment error:", error, payment);
            log("❌ X payment (LIVE) lỗi:", error?.message || String(error));
          },
        });

        log("📩 Pi.createPayment trả về:", payment);
      } catch (e) {
        console.error(e);
        log("❌ X payment (LIVE) lỗi:", e.message || e);
      }
    });
  }
}
