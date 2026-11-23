/* Shared helpers: theme toggle, icons, demo-mode banner */
(function () {
  var C = window.LB_CONFIG || {};
  var live = !!(C.SUPABASE_URL && C.SUPABASE_KEY);

  var btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("lb-theme", next); } catch (e) {}
    });
  }

  var banner = document.getElementById("mode-banner");
  if (banner && !live) {
    banner.textContent = "Demo mode: reports are saved only in this browser. Connect Supabase (see README) to share them with everyone.";
    banner.hidden = false;
  }

  window.LB = {
    live: live,
    icon: function (name, size) {
      var ns = "http://www.w3.org/2000/svg";
      var svg = document.createElementNS(ns, "svg");
      svg.setAttribute("class", "ic");
      svg.setAttribute("width", size);
      svg.setAttribute("height", size);
      var use = document.createElementNS(ns, "use");
      use.setAttribute("href", "#i-" + name);
      svg.appendChild(use);
      return svg;
    },
    el: function (tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text !== undefined) e.textContent = text;
      return e;
    },
    shortDate: function (iso) {
      var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
      if (!m) return iso || "";
      return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    },
    today: function () {
      var d = new Date();
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    }
  };
})();
