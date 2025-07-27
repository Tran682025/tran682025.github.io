// Initialize Pi SDK
Pi.init({ version: "2.0", sandbox: true });

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
  const scopes = ['username', 'payments'];
  const onIncompletePaymentFound = (payment) => {
    console.log('Incomplete payment found:', payment);
  };

  Pi.authenticate(scopes, onIncompletePaymentFound)
    .then(auth => {
      console.log('Authentication success', auth);
      userInfo.innerHTML = `<p>Xin chào, <b>${auth.user.username}</b>!</p>`;
    })
    .catch(error => {
      console.error('Authentication failed:', error);
      alert("Đăng nhập thất bại: " + error);
    });
}

function buyPremium() {
  Pi.createPayment({
    amount: 0.01,
    memo: "PICHORDIPY Premium",
    metadata: { type: "premium" }
  }, {
    onReadyForServerApproval: console.log,
    onReadyForServerCompletion: console.log,
    onCancel: console.log,
    onError: console.error
  });
}