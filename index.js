// Tran682025 · Pi Web3 Studio
// Frontend test cho Pi Login & Pi Payment (Testnet)

const BACKEND_URL = "https://your-backend-url.example.com";
// TODO: sửa thành URL backend thật nếu cần gọi approve/complete.
// Nếu chỉ muốn test Pi SDK ở client, cứ để nguyên.

let piAvailable = false;

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

  // ===== Helper: log =====
  function appendLog(el, msg) {
    const time = new Date().toISOString().split("T")[1].split(".")[0];
    el.textContent += `\n[${time}] ${msg}`;
    el.scrollTop = el.scrollHeight;
  }

  // ===== Init Pi SDK (nếu có) =====
  if (window.Pi) {
    try {
      window.Pi.init({
        version: "2.0",
        sandbox: true, // Testnet / sandbox
      });
      piAvailable = true;
      sdkStatusDot.classList.add("status-ok");
      sdkStatusText.textContent = "Pi SDK sẵn sàng (Testnet / Sandbox)";

      // Cho phép bấm nút
      loginBtn.disabled = false;
      payBtn.disabled = false;

      // Cập nhật log ban đầu
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
    // SIMPLE MODE: không có Pi SDK → chỉ cho xem giao diện
    sdkStatusText.textContent =
      "Không tìm thấy Pi SDK. Hãy mở trang này trong Pi Browser (Develop → Tran682025).";
    loginBtn.disabled = true;
    payBtn.disabled = true;

    loginLog.textContent =
      "[Login] Đang xem bằng trình duyệt thường.\nMở app Tran682025 trong Pi Browser để test đăng nhập.";
    paymentLog.textContent =
      "[Payment] Đang xem bằng trình duyệt thường.\nMở app Tran682025 trong Pi Browser để test thanh toán.";
  }

  // ===== Login =====
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

  // ===== Payment =====
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
