<script src="https://sdk.minepi.com/pi-sdk.js"></script>
<script>
  // 1) Pi SDK: bật sandbox khi test (?onSandbox=1)
  const url = new URL(window.location.href);
  const isSandbox = url.searchParams.get("onSandbox") === "1";
  Pi.init({ version: "2.0", sandbox: isSandbox });

  // 2) URL Worker của Trẫm (đÃ deploy)
  const WORKER_URL = "https://pichordifykingdom.workers.dev"; // <-- sửa đúng URL của Trẫm

  // 3) Helper gọi API Worker
  async function callAPI(path, body) {
    const r = await fetch(`${WORKER_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {})
    });
    if (!r.ok) {
      const t = await r.text().catch(()=> "");
      throw new Error(`API ${path} failed: ${r.status} ${t}`);
    }
    return r.json();
  }

  // (giữ nguyên các hàm renderBasicChords / updatePremiumStatus / login của Trẫm)

  // 4) Mua Premium (đã nối backend approve/complete)
  async function payPremium() {
    try {
      // a) đảm bảo đã login và có scope 'payments'
      await Pi.authenticate(["username","payments"], () => {});

      // b) tạo payment + nối callback gọi Worker
      await Pi.createPayment(
        {
          amount: 1, // đổi giá nếu muốn
          memo: "PiChordify Premium Access",
          metadata: { type: "premium", item: "access" }
        },
        {
          onReadyForServerApproval: (paymentId) => {
            // gọi /approve để server kiểm tra/ghi log
            return callAPI("/approve", { paymentId });
          },
          onReadyForServerCompletion: (paymentId, txid) => {
            // gọi /complete để server xác nhận on-chain
            return callAPI("/complete", { paymentId, txid })
              .then(() => {
                // đánh dấu đã premium tại client
                localStorage.setItem("pck_premium","true");
                updatePremiumStatus(true);
                alert("Thanh toán thành công ✅");
              });
          },
          onCancel: (paymentId) => {
            console.log("User cancelled", paymentId);
            alert("Đã hủy thanh toán.");
          },
          onError: (error, paymentId) => {
            console.error("Payment error", error, paymentId);
            alert("Lỗi thanh toán: " + (error?.message || error));
          }
        }
      );
    } catch (e) {
      console.error(e);
      alert("Có lỗi khi mua Premium: " + (e?.message || e));
    }
  }

  // 5) Nếu cần: tự hiển thị trạng thái premium từ localStorage khi load
  (function initPremium() {
    const isPremium = localStorage.getItem("pck_premium") === "true";
    updatePremiumStatus(isPremium);
  })();
</script>
