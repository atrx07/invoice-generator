/* InvoiceGen — 100% client-side. Nothing is uploaded anywhere. */
(function () {
  "use strict";

  var SYMBOLS = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };
  var $ = function (id) { return document.getElementById(id); };

  var fields = ["bizName", "bizEmail", "bizAddr", "bizPhone", "bizTaxId", "currency"];

  function fmt(n, cur) {
    var s = SYMBOLS[cur] || cur + " ";
    return s + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function today() { return new Date().toISOString().slice(0, 10); }

  /* ---------- items ---------- */
  function addItem(desc, qty, rate) {
    var wrap = $("items");
    var row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML =
      '<input type="text" class="i-desc" placeholder="Service / product" aria-label="Description">' +
      '<input type="number" class="i-qty" min="0" step="any" value="1" aria-label="Quantity">' +
      '<input type="number" class="i-rate" min="0" step="any" value="0" aria-label="Rate">' +
      '<div class="amt">₹0.00</div>' +
      '<button type="button" class="item-del" aria-label="Remove item">×</button>';
    if (desc) row.querySelector(".i-desc").value = desc;
    if (qty != null) row.querySelector(".i-qty").value = qty;
    if (rate != null) row.querySelector(".i-rate").value = rate;
    row.querySelector(".item-del").addEventListener("click", function () { row.remove(); render(); save(); });
    row.querySelectorAll("input").forEach(function (el) {
      el.addEventListener("input", function () { render(); save(); });
    });
    wrap.appendChild(row);
  }

  function getItems() {
    var out = [];
    document.querySelectorAll("#items .item-row").forEach(function (row) {
      out.push({
        desc: row.querySelector(".i-desc").value,
        qty: parseFloat(row.querySelector(".i-qty").value) || 0,
        rate: parseFloat(row.querySelector(".i-rate").value) || 0
      });
    });
    return out;
  }

  /* ---------- render preview ---------- */
  function text(id, v, fallback) { $(id).textContent = v || fallback || ""; }

  function render() {
    var cur = $("currency").value;
    text("pBizName", $("bizName").value, "Your Business");
    text("pBizAddr", $("bizAddr").value);
    var contact = [$("bizEmail").value, $("bizPhone").value].filter(Boolean).join(" · ");
    text("pBizContact", contact);
    text("pBizTaxId", $("bizTaxId").value ? "Tax ID: " + $("bizTaxId").value : "");
    text("pInvNum", $("invNum").value, "—");
    text("pInvDate", $("invDate").value);
    text("pInvDue", $("invDue").value);
    text("pClientName", $("clientName").value, "—");
    text("pClientAddr", $("clientAddr").value);
    text("pClientEmail", $("clientEmail").value);
    text("pNotes", $("notes").value);

    var items = getItems();
    var tb = $("pItems");
    tb.innerHTML = "";
    var subtotal = 0;
    var rows = document.querySelectorAll("#items .item-row");
    items.forEach(function (it, i) {
      var amt = it.qty * it.rate;
      subtotal += amt;
      rows[i].querySelector(".amt").textContent = fmt(amt, cur);
      var tr = document.createElement("tr");
      tr.innerHTML = "<td></td><td class='r'></td><td class='r'></td><td class='r'></td>";
      tr.children[0].textContent = it.desc || "Item " + (i + 1);
      tr.children[1].textContent = it.qty;
      tr.children[2].textContent = fmt(it.rate, cur);
      tr.children[3].textContent = fmt(amt, cur);
      tb.appendChild(tr);
    });
    if (!items.length) {
      var tr = document.createElement("tr");
      tr.innerHTML = "<td colspan='4' style='text-align:center;color:#9aa3b5'>No items yet — add one on the left.</td>";
      tb.appendChild(tr);
    }

    var discount = parseFloat($("discount").value) || 0;
    var taxRate = parseFloat($("taxRate").value) || 0;
    var taxable = Math.max(0, subtotal - discount);
    var tax = taxable * taxRate / 100;
    var total = taxable + tax;

    text("pSubtotal", fmt(subtotal, cur));
    $("rowDiscount").hidden = !(discount > 0);
    if (discount > 0) text("pDiscount", "−" + fmt(discount, cur));
    $("rowTax").hidden = !(taxRate > 0);
    if (taxRate > 0) { text("pTaxLabel", "Tax (" + taxRate + "%)"); text("pTax", fmt(tax, cur)); }
    text("pTotal", fmt(total, cur));
  }

  /* ---------- persistence (local business profile only) ---------- */
  function save() {
    try {
      var data = {};
      fields.forEach(function (f) { data[f] = $(f).value; });
      localStorage.setItem("invoicegen-biz", JSON.stringify(data));
    } catch (e) { /* private mode — ignore */ }
  }
  function load() {
    try {
      var raw = localStorage.getItem("invoicegen-biz");
      if (!raw) return;
      var data = JSON.parse(raw);
      fields.forEach(function (f) { if (data[f] != null) $(f).value = data[f]; });
    } catch (e) { /* ignore */ }
  }

  /* ---------- actions ---------- */
  $("addItem").addEventListener("click", function () { addItem(); render(); });

  $("downloadPdf").addEventListener("click", function () {
    var el = $("invoice");
    var name = ($("invNum").value || "invoice").replace(/[^\w\-]+/g, "-") + ".pdf";
    var opt = {
      margin: 12,
      filename: name,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };
    if (window.html2pdf) { html2pdf().set(opt).from(el).save(); }
    else { window.print(); }
  });
  $("printBtn").addEventListener("click", function () { window.print(); });
  $("resetBtn").addEventListener("click", function () {
    if (!confirm("Clear the whole invoice and start over?")) return;
    ["bizName","bizEmail","bizAddr","bizPhone","bizTaxId","clientName","clientEmail","clientAddr","notes"].forEach(function (f) { $(f).value = ""; });
    $("discount").value = 0; $("taxRate").value = 0;
    $("items").innerHTML = "";
    $("invNum").value = "INV-" + String(Math.floor(1000 + Math.random() * 9000));
    addItem(); render(); save();
  });

  /* ---------- init ---------- */
  ["bizName","bizEmail","bizAddr","bizPhone","bizTaxId","clientName","clientEmail","clientAddr","invNum","invDate","invDue","currency","taxRate","discount","notes"]
    .forEach(function (f) { $(f).addEventListener("input", function () { render(); save(); }); });

  load();
  if (!$("invNum").value) $("invNum").value = "INV-" + String(Math.floor(1000 + Math.random() * 9000));
  if (!$("invDate").value) $("invDate").value = today();
  var due = new Date(); due.setDate(due.getDate() + 14);
  if (!$("invDue").value) $("invDue").value = due.toISOString().slice(0, 10);
  if (!document.querySelector("#items .item-row")) addItem();
  render();
})();
