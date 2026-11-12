/* WOTU AI plan autofill override */
(function () {
  function matOk(v, list) {
    return list.indexOf(v) >= 0 ? v : list[0];
  }
  function applyPlan(plan) {
    if (!plan || typeof plan !== "object" || typeof S === "undefined") return [];
    var found = [];
    var mats = ["mdf_mel", "ply_mel", "mdf_acr", "nhua_film", "nhua_acr", "nhua_lam"];
    var map = {
      bep: "bếp",
      khach: "phòng khách",
      an: "phòng ăn",
      master: "phòng ngủ master",
      n2: "phòng ngủ 2",
      n3: "phòng ngủ 3",
      tho: "phòng thờ"
    };
    (Array.isArray(plan.rooms) ? plan.rooms : []).forEach(function (r) {
      if (S.rooms && S.rooms.hasOwnProperty(r)) {
        S.rooms[r] = 1;
        if (map[r]) found.push(map[r]);
      }
    });
    var k = plan.kitchen || {};
    if (k && typeof k === "object") {
      if (!S.rooms.bep && (k.length_m || k.mat_bottom || k.mat_top)) {
        S.rooms.bep = 1;
        found.push("bếp");
      }
      if (+k.length_m > 0) {
        S.bepW = Math.max(1, +k.length_m);
        S.bepTopW = S.bepW;
      }
      if (+k.top_m > 0) S.bepTopW = Math.max(1, +k.top_m);
      if (+k.island_m > 0) {
        S.bepDaoW = +k.island_m;
        if (found.indexOf("đảo bếp") < 0) found.push("đảo bếp");
      }
      if (k.mat_bottom) S.bepDuoi = matOk(k.mat_bottom, mats);
      if (k.mat_top) S.bepTren = matOk(k.mat_top, mats);
      if (k.stone) S.da = matOk(k.stone, ["kimsa", "su", "lamar", "khong"]);
      if (k.backsplash) S.op = matOk(k.backsplash, ["k6", "kimsa", "khong"]);
      if (k.ceiling === "full" || k.ceiling === "khung") S.kich = k.ceiling;
      if (k.sink === "700" || k.sink === "800") {
        S.bon = 1;
        S.chau = k.sink;
      }
      if (k.led === true) S.ledB = 1;
    }
    var lv = plan.living || {};
    if (lv && typeof lv === "object" && S.kh) {
      if (!S.rooms.khach && (lv.tv_m || lv.shoe_m2)) {
        S.rooms.khach = 1;
        found.push("phòng khách");
      }
      if (+lv.tv_m > 0) S.kh.ke = +lv.tv_m;
      if (lv.tv_mat) S.kh.kemat = matOk(lv.tv_mat, mats);
      if (+lv.shoe_m2 > 0) S.kh.giay = +lv.shoe_m2;
      if (lv.shoe_mat) S.kh.gmat = matOk(lv.shoe_mat, mats);
      if (lv.shoe_acrylic === true) S.kh.gacr = 1;
    }
    var dn = plan.dining || {};
    if (dn && typeof dn === "object" && S.an) {
      if (!S.rooms.an && (dn.wine || dn.m2)) {
        S.rooms.an = 1;
        found.push("phòng ăn");
      }
      if (dn.wine) S.an.tu = dn.wine;
      if (+dn.m2 > 0) S.an.m2 = +dn.m2;
    }
    var beds = plan.bedrooms || {};
    ["master", "n2", "n3"].forEach(function (id) {
      var b = beds[id];
      if (!b || typeof b !== "object" || !S.ngu || !S.ngu[id]) return;
      if (!S.rooms[id]) {
        S.rooms[id] = 1;
        found.push(map[id] || id);
      }
      if (+b.wardrobe_m2 > 0) S.ngu[id].m2 = +b.wardrobe_m2;
      if (b.mat) S.ngu[id].mat = matOk(b.mat, mats);
      if (b.aluminum_glass === true) S.ngu[id].nk = 1;
      if (["14", "16", "18", "20"].indexOf(String(b.bed)) >= 0) S.ngu[id].bed = String(b.bed);
      if (b.bed_mat) S.ngu[id].bmat = matOk(b.bed_mat, ["mdf_mel", "ply_mel"]);
      if (b.padded_head === true) S.ngu[id].nem = 1;
    });
    return found;
  }

  function waitForApplyAI(cb) {
    var n = 0;
    (function tick() {
      if (typeof applyAI === "function" && typeof S !== "undefined") return cb();
      if (++n > 80) return;
      setTimeout(tick, 50);
    })();
  }

  waitForApplyAI(function () {
    var legacyApply = applyAI;
    window.applyAI = async function () {
      var el = document.getElementById("ai");
      var raw = (el && el.value ? el.value : "").trim();
      S.ai = raw;
      if (!raw) {
        S.aiMsg =
          "Hãy mô tả nhu cầu, ví dụ: bếp chữ I dài 3.2m plywood, phòng ngủ master giường 1m8, ngân sách vừa.";
        if (typeof draw === "function") draw();
        return;
      }
      S.aiMsg = "AI đang phân tích và điền phương án...";
      S.aiReview = "Đang phân tích...";
      if (typeof draw === "function") draw();

      var found = [];
      var usedAI = false;
      try {
        var r = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: raw })
        });
        var d = await r.json().catch(function () {
          return {};
        });
        if (!r.ok) throw new Error(d.error || "Gemini lỗi");
        if (d.plan) {
          found = applyPlan(d.plan);
          usedAI = true;
        }
        S.aiReview = d.text || d.summary || "Đã phân tích nhu cầu.";
      } catch (e) {
        var msg = e && e.message ? e.message : "";
        S.aiReview =
          msg.indexOf("Failed to fetch") >= 0 || msg.indexOf("NetworkError") >= 0
            ? "AI tạm thời chưa kết nối được. Đã dùng phân tích nhanh local."
            : "AI chưa phản hồi: " + msg + ". Đã dùng phân tích nhanh local.";
      }

      if (!found.length) {
        try {
          return legacyApply();
        } catch (_) {}
      }

      S.aiMsg =
        (usedAI ? "AI đã điền phương án: " : "Đã chọn sơ bộ: ") +
        (found.length ? found.join(", ") : "nhu cầu") +
        ". Bạn có thể chỉnh từng mục bên dưới." +
        (typeof suggestGaris === "function" ? suggestGaris(raw) : "");
      if (typeof draw === "function") draw();
    };
  });
})();
