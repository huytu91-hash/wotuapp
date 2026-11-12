/* Bootstrap last known-good app.js from commit e1f4b2a */
(function () {
  var s = document.createElement("script");
  s.src =
    "https://cdn.jsdelivr.net/gh/huytu91-hash/wotuapp@e1f4b2a0f9a0469ea7208d91cc24fde3a7eef06b/app.js";
  s.onload = function () {
    var a = document.createElement("script");
    a.src = "ai-plan.js?v=20261112";
    document.head.appendChild(a);
  };
  s.onerror = function () {
    var app = document.getElementById("app");
    if (app) app.textContent = "Không tải được app.js. Thử tải lại trang.";
  };
  document.head.appendChild(s);
})();
