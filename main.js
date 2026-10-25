document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  var tabButtons = document.querySelectorAll(".tab-btn");
  var screens = document.querySelectorAll(".screen");

  function activateScreen(screenId) {
    screens.forEach(function (screen) { screen.classList.remove("active"); });
    tabButtons.forEach(function (btn) { btn.classList.remove("active"); });

    var targetScreen = document.getElementById(screenId);
    if (targetScreen) targetScreen.classList.add("active");

    var targetButton = document.querySelector('.tab-btn[data-screen="' + screenId + '"]');
    if (targetButton) targetButton.classList.add("active");

    if (screenId === 'screen-1') {
      setTimeout(function() { if (window._rimbaMap) window._rimbaMap.invalidateSize(); }, 200);
    }
    if (screenId === 'screen-5') {
      generateFaceRain();
    }
  }

  tabButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var screenId = button.getAttribute("data-screen");
      if (screenId) activateScreen(screenId);
    });
  });

  // --- TOMBOL HOME ---
  var btnHome = document.getElementById('btn-go-home');
  if (btnHome) {
    btnHome.addEventListener('click', function() {
      var landing = document.getElementById('screen-landing');
      if (landing) landing.style.display = 'flex';
      var mainApp = document.getElementById('main-app');
      if (mainApp) mainApp.style.display = 'none';
    });
  }

  // --- HUJAN FOTO ---
  function generateFaceRain() {
    var container = document.getElementById('face-rain-container');
    if (!container) return;
    container.innerHTML = ''; 
    var images = ['img/nurreza.jpeg', 'img/tegar.jpg', 'img/fatimah.jpeg'];
    for (var i = 0; i < 35; i++) {
      var img = document.createElement('img');
      img.src = images[Math.floor(Math.random() * images.length)];
      img.className = 'falling-face';
      img.style.left = (Math.random() * 100) + '%';
      img.style.animationDuration = (Math.random() * 5 + 4) + 's';
      img.style.animationDelay = (Math.random() * 4) + 's';
      container.appendChild(img);
    }
  }

  // --- MODAL KRITIK & SARAN + TELEGRAM ---
  var btnFeedback = document.getElementById('btn-feedback');
  var modalFeedback = document.getElementById('feedback-modal');
  var btnCloseFeedback = document.getElementById('btn-close-feedback');
  var formFeedback = document.getElementById('feedback-form');

  if (btnFeedback && modalFeedback) {
    btnFeedback.addEventListener('click', function() {
      modalFeedback.style.display = 'flex';
    });
  }
  if (btnCloseFeedback) {
    btnCloseFeedback.addEventListener('click', function() {
      modalFeedback.style.display = 'none';
    });
  }
  if (formFeedback) {
    formFeedback.addEventListener('submit', function(e) {
      e.preventDefault();
      
      var teksSaran = document.getElementById('feedback-text').value;
      
      // --- INTEGRASI TELEGRAM ---
      // GANTI DENGAN TOKEN & CHAT ID KAMU
      var token = '8840033537:AAFxjawQm6HYQQdWx88F8CRjrBxHYVX8fdw';
      var chatId = '6492979386';
      
      var pesan = "💬 KRITIK & SARAN BARU 💬\n\n" + teksSaran;
      
      fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: pesan })
      }).catch(function(err) { console.log('Error Telegram:', err); });
      // --------------------------
      
      alert('Terima kasih! Kritik dan saran berhasil dikirim.');
      modalFeedback.style.display = 'none';
      formFeedback.reset();
    });
  }
});