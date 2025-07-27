// Initialize Pi SDK
Pi.init({ version: "2.0", sandbox: false });

const chordsElement = document.getElementById('chords');
const userInfo = document.getElementById('user-info');

// Fetch chords
fetch('chords/basic.json')
  .then(response => response.json())
  .then(data => {
    data.forEach(chord => {
      const li = document.createElement('li');
      li.textContent = chord.name + " - " + chord.fingering;
      chordsElement.appendChild(li);
    });
  });

function login() {
  alert("Đang gửi yêu cầu đăng nhập Pi...");
  const scopes = ['username', 'payments'];
  const onIncompletePaymentFound = (payment) => {
    console.log('Incomplete payment found:', payment);
  };

  Pi.authenticate(scopes, onIncompletePaymentFound)
    .then(auth => {
      const username = auth.user.username;
      alert("Login thành công! Xin chào, " + username);
      userInfo.innerHTML = `<p>Xin chào, <b>${username}</b>!</p>`;
    })
    .catch(error => alert("Đăng nhập thất bại: " + error));
}

function buyPremium() {
  alert("Đang khởi tạo thanh toán 1 Pi Premium...");
  Pi.createPayment({
    amount: 1,
    memo: "PICHORDIFY Premium",
    metadata: { type: "premium" }
  }, {
    onReadyForServerApproval: (paymentId) => alert("Sẵn sàng duyệt: " + paymentId),
    onReadyForServerCompletion: (paymentId) => alert("Thanh toán hoàn tất: " + paymentId),
    onCancel: () => alert("Thanh toán bị hủy."),
    onError: (error) => alert("Lỗi: " + error)
  });
}
