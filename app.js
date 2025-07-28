// Khởi tạo Pi SDK ở chế độ sandbox (thử nghiệm, không trừ Pi thật)
Pi.init({ version: "2.0", sandbox: true });

// Hàm Đăng nhập
function login() {
  const scopes = ['username', 'payments'];
  Pi.authenticate(scopes, function(payment) {
    console.log("Incomplete payment found:", payment);
  }).then(function(auth) {
    console.log("Authentication success", auth);
    alert("Xin chào, " + auth.user.username + " 👋");
  }).catch(function(error) {
    console.error("Authentication failed:", error);
    alert("Đăng nhập thất bại 😥");
  });
}

// Hàm mua Premium thử nghiệm
function payPremium() {
  Pi.createPayment({
    amount: 1,
    memo: "Pichordify Premium Access",
    metadata: { type: "premium", item: "access" }
  }, {
    onReadyForServerApproval: function(paymentId) {
      console.log("Ready for approval:", paymentId);
      alert("Thanh toán thử nghiệm đã khởi tạo ✔️ (Không trừ Pi thật)");
    },
    onReadyForServerCompletion: function(paymentId, txid) {
      console.log("Ready to complete:", paymentId, txid);
      alert("Đã hoàn tất thanh toán thử nghiệm 🎉");
    },
    onCancel: function(paymentId) {
      alert("Bạn đã hủy thanh toán.");
    },
    onError: function(error, paymentId) {
      alert("Lỗi thanh toán: " + error);
    }
  });
}
