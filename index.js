// Tran682025 · Pi Web3 Studio
// Frontend test cho Pi Login & Pi Payment (Testnet)

const BACKEND_URL = "https://your-backend-url.example.com"; 
// TODO: sửa thành URL backend của Trẫm (ví dụ: https://curvy-parts-flash.loca.lt)
// hoặc tạm thời để nguyên nếu chỉ muốn test Pi SDK & xem log.

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
        sandbox: true,       // testnet / sandbox
      });
      piAvailable = true;
      sdkStatusDot.classList.add("status-ok");
      sdkStatusText.textContent = "Pi SDK sẵn sàng (Testnet / Sandbox)";
    } catch (err) {
      sdkStatusText.textContent = "Lỗi init Pi SDK: " + err.message;
      appendLog(loginLog, "Pi.init error: " + err.message);
    }
  } else {
    sdkStatusText.textContent =
      "Không tìm thấy Pi SDK. Hãy mở trang này trong Pi Browser (Develop → Tran682025).";
    appendLog(loginLog, "Pi SDK không có. Đây có thể là Chrome / trình duyệt ngoài.");
  }

  // ===== Login =====
  loginBtn.addEventListener("click", async () => {
    if (!piAvailable) {
      alert("Pi SDK chưa hoạt động. Hãy mở trong Pi Browser.");
      return;
    }

    const scopes = scopeInput.value
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    appendLog(loginLog, `Bắt đầu Pi.authenticate với scope: [${scopes.join(", ")}]`);

    const onIncompletePaymentFound = (payment) => {
      appendLog(loginLog, "onIncompletePaymentFound: " + JSON.stringify(payment, null, 2));
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
      alert("Pi SDK chưa hoạt động. Hãy mở trong Pi Browser.");
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

    appendLog(paymentLog, `Tạo payment: amount=${amount}, memo="${memo}"`);

    const paymentData = {
      amount,
      memo,
      metadata,
    };

    const callbacks = {
      onReadyForServerApproval: async (paymentId) => {
        appendLog(paymentLog, "onReadyForServerApproval: " + paymentId);
        // Gửi paymentId cho backend để gọi Pi server /approve
        try {
          if (BACKEND_URL && BACKEND_URL.startsWith("http")) {
            await fetch(`${BACKEND_URL}/payments/approve`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId }),
            });
            appendLog(paymentLog, "Đã gửi approve tới backend.");
          } else {
            appendLog(paymentLog, "BACKEND_URL chưa cấu hình – chỉ log, không gọi server.");
          }
        } catch (err) {
          appendLog(paymentLog, "Lỗi fetch approve: " + err.message);
        }
      },
      onReadyForServerCompletion: async (paymentId, txid) => {
        appendLog(paymentLog, `onReadyForServerCompletion: paymentId=${paymentId}, txid=${txid}`);
        // Gửi paymentId + txid cho backend để gọi Pi server /complete
        try {
          if (BACKEND_URL && BACKEND_URL.startsWith("http")) {
            await fetch(`${BACKEND_URL}/payments/complete`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, txid }),
            });
            appendLog(paymentLog, "Đã gửi complete tới backend.");
          } else {
            appendLog(paymentLog, "BACKEND_URL chưa cấu hình – chỉ log, không gọi server.");
          }
        } catch (err) {
          appendLog(paymentLog, "Lỗi fetch complete: " + err.message);
        }
      },
      onCancel: (paymentId) => {
        appendLog(paymentLog, "Người dùng hủy payment: " + paymentId);
      },
      onError: (error, payment) => {
        appendLog(paymentLog, "Lỗi payment: " + error + " | payment=" +
          JSON.stringify(payment || {}, null, 2));
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
