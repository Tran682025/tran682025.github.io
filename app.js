// Khởi tạo Pi SDK ở chế độ thử nghiệm
Pi.init({ version: "2.0", sandbox: true });

// Hiển thị hợp âm cơ bản
function renderBasicChords(chords) {
  const container = document.getElementById("chords");
  container.innerHTML = "";
  chords.forEach(chord => {
    const el = document.createElement("div");
    el.innerHTML = `<strong>${chord.name}</strong>: ${chord.fingering}`;
    container.appendChild(el);
  });
}

// Hiển thị trạng thái Premium
function updatePremiumStatus(isPremium) {
  const statusDiv = document.getElementById("premium-status");
  if (isPremium) {
    statusDiv.innerHTML = "🔓 Đã mua Premium";
  } else {
    statusDiv.innerHTML = "🔒 Chưa mua Premium";
  }
}

// Hàm đăng nhập
function login() {
  const scopes = ['username', 'payments'];
  Pi.authenticate(scopes, function(payment) {
    console.log("Incomplete payment found:", payment);
  }).then(function(auth) {
    alert("Xin chào, " + auth.user.username + " 👋");
    fetch('basic.json')
      .then(response => response.json())
      .then(data => renderBasicChords(data));
  }).catch(function(error) {
    alert("Đăng nhập thất bại: " + error);
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
      alert("Đã khởi tạo thanh toán thử nghiệm ✔️");
    },
    onReadyForServerCompletion: function(paymentId, txid) {
      alert("Thanh toán thành công 🎉");
      updatePremiumStatus(true); // Đổi trạng thái sang đã mua
    },
    onCancel: function(paymentId) {
      alert("Đã huỷ thanh toán.");
    },
    onError: function(error, paymentId) {
      alert("Lỗi thanh toán: " + error);
    }
  });
}
