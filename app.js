// Khởi tạo Pi SDK ở chế độ thử nghiệm (sandbox)
Pi.init({ version: "2.0", sandbox: true });

// Hàm render hợp âm
function renderChords(chords) {
  const container = document.getElementById("chords");
  container.innerHTML = ""; // Xóa nội dung cũ
  chords.forEach(chord => {
    const el = document.createElement("div");
    el.innerHTML = `<strong>${chord.name}</strong>: ${chord.fingering}`;
    container.appendChild(el);
  });
}

// Hàm đăng nhập
function login() {
  const scopes = ['username', 'payments'];
  Pi.authenticate(scopes, function(payment) {
    console.log("Incomplete payment found:", payment);
  }).then(function(auth) {
    console.log("Authentication success", auth);
    alert("Xin chào, " + auth.user.username + " 👋");

    // Sau khi đăng nhập thành công, fetch hợp âm
    fetch('basic.json')
      .then(response => response.json())
      .then(data => {
        renderChords(data);
      })
      .catch(error => {
        console.error("Lỗi khi lấy hợp âm:", error);
      });

  }).catch(function(error) {
    console.error("Authentication failed:", error);
    alert("Đăng nhập thất bại 😥");
  });
}

// Hàm mua Premium
function payPremium() {
  Pi.createPayment({
    amount: 1,
    memo: "Pichordify Premium Access",
    metadata: { type: "premium", item: "access" }
  }, {
    onReadyForServerApproval: function(paymentId) {
      console.log("Sẵn sàng duyệt:", paymentId);
      alert("Thanh toán thử nghiệm khởi tạo ✔️");
    },
    onReadyForServerCompletion: function(paymentId, txid) {
      console.log("Sẵn sàng hoàn tất:", paymentId, txid);
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
