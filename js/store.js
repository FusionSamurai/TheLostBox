/* Data layer: Supabase (live mode) or this browser's localStorage (demo mode). No libraries needed. */
(function () {
  var C = window.LB_CONFIG || {};
  var URL = (C.SUPABASE_URL || "").replace(/\/+$/, "");
  var KEY = C.SUPABASE_KEY || "";
  var live = !!(URL && KEY);
  var LS_KEY = "lostbox_reports";
  var BUCKET = "report-images";
  var MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp" };

  function headers(extra) {
    var h = { apikey: KEY };
    if (KEY.indexOf("eyJ") === 0) h.Authorization = "Bearer " + KEY; // legacy JWT-style anon key
    for (var k in (extra || {})) h[k] = extra[k];
    return h;
  }
  function readLocal() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch (e) { return []; }
  }
  function same(a, b) {
    return a.email.toLowerCase() === b.email.toLowerCase() && a.type === b.type &&
           a.item_name.toLowerCase() === b.item_name.toLowerCase() && a.item_date === b.item_date;
  }
  var DUP_MSG = "You have already submitted this report (same item, type and date).";

  /* shrink the photo so it fits in browser storage (demo mode only) */
  function toDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image(), url = window.URL.createObjectURL(file);
      img.onload = function () {
        var max = 900, scale = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement("canvas");
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        var ctx = c.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        window.URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.78));
      };
      img.onerror = function () { reject(new Error("The uploaded file could not be read as an image.")); };
      img.src = url;
    });
  }

  async function list() {
    if (!live) {
      return readLocal().sort(function (a, b) { return b.created_at.localeCompare(a.created_at); });
    }
    var r = await fetch(URL + "/rest/v1/reports_public?select=*&order=created_at.desc&limit=200", { headers: headers() });
    if (!r.ok) throw new Error("Could not load reports (error " + r.status + "). Check the Supabase setup in the README.");
    return r.json();
  }

  async function isDuplicate(rep) {
    if (!live) return readLocal().some(function (x) { return same(x, rep); });
    var q = "/rest/v1/reports_public?select=email,type,item_name,item_date&type=eq." + encodeURIComponent(rep.type) +
            "&item_date=eq." + encodeURIComponent(rep.item_date);
    var r = await fetch(URL + q, { headers: headers() });
    if (!r.ok) return false;
    return (await r.json()).some(function (x) { return same(x, rep); });
  }

  /* rep: {type,email,admission_no,item_name,description,item_date,location}; file: the photo */
  async function submit(rep, file) {
    if (await isDuplicate(rep)) throw new Error(DUP_MSG);

    if (!live) {
      var row = {
        id: String(Date.now()), created_at: new Date().toISOString(),
        type: rep.type, email: rep.email, item_name: rep.item_name, description: rep.description,
        item_date: rep.item_date, location: rep.location, image_url: await toDataUrl(file)
      };
      var all = readLocal(); all.push(row);
      try { localStorage.setItem(LS_KEY, JSON.stringify(all)); }
      catch (e) { throw new Error("This browser's storage is full. Connect Supabase (see README) for unlimited reports."); }
      return;
    }

    var ext = file.name.split(".").pop().toLowerCase();
    var name = Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
    var up = await fetch(URL + "/storage/v1/object/" + BUCKET + "/" + name, {
      method: "POST", headers: headers({ "Content-Type": MIME[ext] || file.type, "x-upsert": "false" }), body: file
    });
    if (!up.ok) throw new Error("The photo could not be uploaded (error " + up.status + "). It must be a JPG, PNG, GIF or WEBP of 5 MB or less.");

    var body = {
      type: rep.type, email: rep.email, admission_no: rep.admission_no, item_name: rep.item_name,
      description: rep.description, item_date: rep.item_date, location: rep.location,
      image_url: URL + "/storage/v1/object/public/" + BUCKET + "/" + name
    };
    var ins = await fetch(URL + "/rest/v1/reports", {
      method: "POST", headers: headers({ "Content-Type": "application/json", Prefer: "return=minimal" }), body: JSON.stringify(body)
    });
    if (!ins.ok) {
      var err = {}; try { err = await ins.json(); } catch (e) {}
      if (err.code === "23505") throw new Error(DUP_MSG);
      throw new Error("The report could not be saved (error " + ins.status + "). Please try again.");
    }
  }

  window.Store = { live: live, list: list, submit: submit };
})();
