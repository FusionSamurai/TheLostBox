/* Report page: validate, then save through Store */
(function () {
  var form = document.getElementById("report-form");
  var msg = document.getElementById("form-message");
  var photo = document.getElementById("photo");
  var photoErr = document.getElementById("photo-error");
  var preview = document.getElementById("preview");
  var submitBtn = document.getElementById("submit-btn");

  var MAX = 5 * 1024 * 1024, MIN = 1024;
  var EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/, ADM = /^[A-Za-z0-9\/\-]{3,30}$/;
  var EXT = ["jpg", "jpeg", "png", "gif", "webp"];

  document.getElementById("date").max = LB.today();

  function show(kind, nodes) {
    msg.className = "form-message" + (kind === "error" ? " error" : "");
    msg.textContent = "";
    nodes.forEach(function (n) { msg.appendChild(n); });
    msg.hidden = false;
    msg.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function showErrors(list) {
    var strong = LB.el("strong", "", "Please fix the following:");
    var ul = document.createElement("ul");
    list.forEach(function (t) { ul.appendChild(LB.el("li", "", t)); });
    show("error", [strong, ul]);
  }

  /* does the file really look like the image type it claims to be? */
  async function realImage(file, ext) {
    var b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    function is(arr, off) { off = off || 0; return arr.every(function (v, i) { return b[off + i] === v; }); }
    if (ext === "jpg" || ext === "jpeg") return is([0xff, 0xd8, 0xff]);
    if (ext === "png") return is([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (ext === "gif") return is([0x47, 0x49, 0x46, 0x38]);
    if (ext === "webp") return is([0x52, 0x49, 0x46, 0x46]) && is([0x57, 0x45, 0x42, 0x50], 8);
    return false;
  }
  async function checkPhoto(file) {
    if (!file) return "Please upload a photograph.";
    var ext = file.name.split(".").pop().toLowerCase();
    if (EXT.indexOf(ext) === -1) return "Photo must be a JPG, PNG, GIF or WEBP image.";
    if (file.size > MAX) return "Photo is too large (" + (file.size / 1048576).toFixed(2) + " MB). It must be 5 MB or smaller.";
    if (file.size < MIN) return "Photo file is empty or too small. Please choose a proper photograph.";
    if (!(await realImage(file, ext))) return "The uploaded file is not a valid image.";
    return "";
  }

  /* instant feedback when a photo is chosen */
  photo.addEventListener("change", async function () {
    var f = photo.files[0];
    photoErr.hidden = true; preview.hidden = true;
    if (!f) return;
    var e = await checkPhoto(f);
    if (e) { photoErr.textContent = e; photoErr.hidden = false; photo.value = ""; return; }
    preview.src = window.URL.createObjectURL(f); preview.hidden = false;
  });

  form.addEventListener("submit", async function (ev) {
    ev.preventDefault();
    var v = function (n) { return form.elements[n].value.trim(); };
    var rep = { type: v("type"), email: v("email"), admission_no: v("admission_no"), item_name: v("item_name"),
                description: v("description"), item_date: v("item_date"), location: v("location") };
    var file = photo.files[0], errors = [];

    if (rep.type !== "Lost" && rep.type !== "Found") errors.push("Please choose Lost or Found.");
    if (!EMAIL.test(rep.email)) errors.push("Please enter a valid email address.");
    if (!ADM.test(rep.admission_no)) errors.push("Admission number must be 3-30 letters, digits, '-' or '/'.");
    if (rep.item_name.length < 3) errors.push("Item name must be at least 3 characters.");
    if (rep.description.length < 10) errors.push("Description must be at least 10 characters - add colour, brand or marks.");
    if (!rep.location) errors.push("Location is required.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rep.item_date)) errors.push("Please enter a valid date.");
    else if (rep.item_date > LB.today()) errors.push("Date cannot be in the future.");
    [["Item name", rep.item_name, 100], ["Description", rep.description, 1000], ["Location", rep.location, 150], ["Email", rep.email, 150]]
      .forEach(function (x) { if (x[1].length > x[2]) errors.push(x[0] + " is too long (max " + x[2] + " characters)."); });
    var pe = await checkPhoto(file); if (pe) errors.push(pe);
    if (errors.length) return showErrors(errors);

    submitBtn.disabled = true; var old = submitBtn.textContent; submitBtn.textContent = "Submitting…";
    try {
      await Store.submit(rep, file);
      var a = LB.el("a", "", "View all reports"); a.href = "index.html#inventory";
      show("ok", [document.createTextNode("Success! Your report has been submitted. "), a]);
      form.reset(); preview.hidden = true;
    } catch (e) {
      showErrors([e.message || "Something went wrong. Please try again."]);
    }
    submitBtn.disabled = false; submitBtn.textContent = old;
  });
})();
