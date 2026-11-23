/* Home page: load reports, draw cards, live search + filter */
(function () {
  var box = document.getElementById("reports");
  var pill = document.getElementById("count");
  var q = document.getElementById("q");
  var typeSel = document.getElementById("type");
  var all = [];

  function card(r) {
    var kind = r.type === "Found" ? "found" : "lost";
    var label = kind === "found" ? "Found" : "Lost";
    var a = LB.el("article", "item-card");

    var imgBox = LB.el("div", "item-image");
    if (r.image_url) {
      var img = document.createElement("img");
      img.src = r.image_url; img.alt = r.item_name; img.loading = "lazy";
      imgBox.appendChild(img);
    } else {
      var ph = LB.el("div", "image-placeholder");
      ph.appendChild(LB.icon("box", 34)); ph.appendChild(LB.el("span", "", "Photo unavailable"));
      imgBox.appendChild(ph);
    }
    imgBox.appendChild(LB.el("span", "status-tag status-" + kind, label));
    a.appendChild(imgBox);

    var body = LB.el("div", "item-card-body");
    var meta = LB.el("div", "item-meta");
    meta.appendChild(LB.el("span", "m-" + kind, label.toUpperCase() + " ITEM"));
    meta.appendChild(LB.el("span", "", "Reported " + LB.shortDate(r.created_at)));
    body.appendChild(meta);
    body.appendChild(LB.el("h3", "", r.item_name));
    body.appendChild(LB.el("p", "", r.description));
    var contact = LB.el("div", "item-contact");
    contact.appendChild(LB.el("b", "", "Contact: "));
    contact.appendChild(document.createTextNode(r.email));
    body.appendChild(contact);
    var foot = LB.el("div", "item-foot");
    var s1 = LB.el("span"); s1.appendChild(LB.icon("pin", 14)); s1.appendChild(document.createTextNode(r.location));
    var s2 = LB.el("span"); s2.appendChild(LB.icon("cal", 14)); s2.appendChild(document.createTextNode(LB.shortDate(r.item_date)));
    foot.appendChild(s1); foot.appendChild(s2);
    body.appendChild(foot);
    a.appendChild(body);
    return a;
  }

  function empty(title, text) {
    var d = LB.el("div", "empty-state");
    d.appendChild(LB.icon("box", 34));
    d.appendChild(LB.el("h3", "", title));
    d.appendChild(LB.el("p", "", text));
    return d;
  }

  function render() {
    var needle = q.value.trim().toLowerCase(), t = typeSel.value;
    var rows = all.filter(function (r) {
      if (t && r.type !== t) return false;
      if (!needle) return true;
      return (r.item_name + " " + r.description + " " + r.location).toLowerCase().indexOf(needle) !== -1;
    });
    pill.textContent = rows.length + (rows.length === 1 ? " report" : " reports");
    box.textContent = "";
    if (!all.length) { box.appendChild(empty("No reports yet", "When someone reports a lost or found item, it will appear here.")); return; }
    if (!rows.length) { box.appendChild(empty("No matching reports", "Try another search or filter.")); return; }
    var grid = LB.el("div", "item-grid");
    rows.forEach(function (r) { grid.appendChild(card(r)); });
    box.appendChild(grid);
  }

  q.addEventListener("input", render);
  typeSel.addEventListener("change", render);
  document.getElementById("filters").addEventListener("submit", function (e) { e.preventDefault(); });

  Store.list().then(function (rows) { all = rows; render(); })
    .catch(function (err) {
      pill.textContent = "0 reports";
      box.textContent = "";
      box.appendChild(empty("Could not load reports", err.message));
    });
})();
