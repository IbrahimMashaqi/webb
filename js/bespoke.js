// js/bespoke.js

let bespokeDB = { heels: [], materials: [], colors: [] };
let bespokeImages = [];

let bespokeState = {
  heelHeight: null,        // number (mm)
  heelPrice: 0,
  material: null,
  materialPrice: 0,
  color: null,
  size: null
};

document.addEventListener("DOMContentLoaded", () => {
  fetch("api/bespoke.php")
    .then((res) => res.json())
    .then((data) => {
      bespokeDB = data;
      bespokeImages = data.images || []; 
      renderHeelHeights();
      bindSizeClicks(); // sizes موجودة بالـ HTML
      updateSummary();
      calculatePrice();
    })
    .catch((err) => console.error("Bespoke DB ERROR:", err));
});

// ===============================
// RENDER HEELS
// ===============================
function renderHeelHeights() {
  const container = document.querySelector(".heel-selector");
  if (!container) return;

  container.innerHTML = "";

  bespokeDB.heels.forEach((h, idx) => {
    container.insertAdjacentHTML(
      "beforeend",
      `
      <div class="circular-option ${idx === 0 ? "active" : ""}"
        data-height="${h.height_mm}"
        data-price="${h.price}"
        onclick="selectHeelHeight(this)">
        <div class="circular-image">
          ${h.image ? `<img src="${h.image}" alt="${h.label} ${h.height_mm}mm"/>` : ""}
          <div class="selection-check"><i class="fa-solid fa-check"></i></div>
        </div>
        <div class="circular-label">
          <span class="option-name">${h.label}</span>
          <span class="option-detail">${h.height_mm}mm</span>
        </div>
      </div>
    `
    );
  });

  // Auto pick first
  if (bespokeDB.heels.length) {
    const first = container.querySelector(".circular-option");
    if (first) selectHeelHeight(first);
  }
}

// ===============================
// SELECT HEEL HEIGHT
// ===============================
function selectHeelHeight(el) {
  document
    .querySelectorAll(".heel-selector .circular-option")
    .forEach((e) => e.classList.remove("active"));

  el.classList.add("active");

  bespokeState.heelHeight = parseInt(el.dataset.height, 10);
  bespokeState.heelPrice = parseFloat(el.dataset.price) || 0;

  // reset downstream
  bespokeState.material = null;
  bespokeState.materialPrice = 0;
  bespokeState.color = null;

  renderMaterials();
  updateSummary();
  calculatePrice();
  updatePreviewImage();
}

// ===============================
// RENDER MATERIALS
// ===============================
function renderMaterials() {
  const container = document.querySelector(".material-selector");
  if (!container) return;

  container.innerHTML = "";

  const allowedMaterials = bespokeDB.materials.filter((m) =>
    Array.isArray(m.allowed_heights)
      ? m.allowed_heights.includes(bespokeState.heelHeight)
      : false
  );

  allowedMaterials.forEach((m, idx) => {
    container.insertAdjacentHTML(
      "beforeend",
      `
      <div class="circular-option ${idx === 0 ? "active" : ""}"
        data-material="${m.name}"
        data-price="${m.extra_price}"
        onclick="selectMaterial(this)">
        <div class="circular-image">
          ${m.image ? `<img src="${m.image}" alt="${m.name}"/>` : ""}
          <div class="selection-check"><i class="fa-solid fa-check"></i></div>
        </div>
        <div class="circular-label">
          <span class="option-name">${m.name}</span>
          <span class="option-detail">+NIS ${Number(m.extra_price).toFixed(0)}</span>
        </div>
      </div>
    `
    );
  });

  if (allowedMaterials.length) {
    const first = container.querySelector(".circular-option");
    if (first) selectMaterial(first);
  } else {
    // no materials available
    const colorBox = document.querySelector(".color-selector-bespoke");
    if (colorBox) colorBox.innerHTML = "";
  }
  
}

// ===============================
// SELECT MATERIAL
// ===============================
function selectMaterial(el) {
  document
    .querySelectorAll(".material-selector .circular-option")
    .forEach((e) => e.classList.remove("active"));

  el.classList.add("active");

  bespokeState.material = el.dataset.material;
  bespokeState.materialPrice = parseFloat(el.dataset.price) || 0;

  // reset color
  bespokeState.color = null;

  renderColors();
  updateSummary();
  calculatePrice();
  updatePreviewImage();
}

// ===============================
// RENDER COLORS
// ===============================
function renderColors() {
  const container = document.querySelector(".color-selector-bespoke");
  if (!container) return;

  container.innerHTML = "";

  const colors = bespokeDB.colors.filter(
    (c) => c.material === bespokeState.material
  );

  colors.forEach((c, i) => {
    container.insertAdjacentHTML(
      "beforeend",
      `
      <div class="color-option-bespoke ${i === 0 ? "active" : ""}"
        data-color="${c.value}"
        style="background:${c.hex}; ${c.value === "white" ? "border: 2px solid #e8ecef" : ""}"
        onclick="selectColor(this)">
        <div class="color-check"><i class="fa-solid fa-check"></i></div>
        <span class="color-name">${c.name}</span>
      </div>
    `
    );
  });

  if (colors.length) bespokeState.color = colors[0].value;
}

// ===============================
// SELECT COLOR
// ===============================
function selectColor(el) {
  document
    .querySelectorAll(".color-option-bespoke")
    .forEach((e) => e.classList.remove("active"));

  el.classList.add("active");
  bespokeState.color = el.dataset.color;
  updateSummary();
  updatePreviewImage();
}

// ===============================
// SIZE (HTML buttons)
// ===============================
function bindSizeClicks() {
  document.querySelectorAll(".size-option-bespoke").forEach((el) => {
    el.addEventListener("click", () => selectSize(el));
  });
}

function selectSize(el) {
  document
    .querySelectorAll(".size-option-bespoke")
    .forEach((e) => e.classList.remove("active"));

  el.classList.add("active");
  bespokeState.size = el.dataset.size;
  updateSummary();
}

// ===============================
// SUMMARY
// ===============================
function updateSummary() {
  const h = bespokeState.heelHeight ? `${bespokeState.heelHeight}mm` : "Not Selected";
  document.getElementById("summaryHeight").textContent = h;
  document.getElementById("summaryMaterial").textContent = bespokeState.material || "Not Selected";
  document.getElementById("summaryColor").textContent = bespokeState.color || "Not Selected";
  document.getElementById("summarySize").textContent = bespokeState.size || "Not Selected";
}

// ===============================
// PRICE
// ===============================
function calculatePrice() {
  const total = (bespokeState.heelPrice || 0) + (bespokeState.materialPrice || 0);
  document.getElementById("summaryPrice").textContent = `NIS ${total.toFixed(2)}`;
}

// ===============================
// SAVE ORDER TO DB
// لازم يكون عندك user_id (من تسجيل الدخول)
// ===============================
function saveBespokeOrderToDB() {
  // تأكيد selections
  if (!bespokeState.heelHeight || !bespokeState.material || !bespokeState.color || !bespokeState.size) {
    alert("Please complete all selections (height, material, color, size).");
    return;
  }

  // مثال: افترض auth.js مخزن user في localStorage
  // عدل السطرين حسب نظام اللوجين عندك
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userId = user?.id;

  if (!userId) {
    alert("Please login first to save your bespoke order.");
    window.location.href = "login.html";
    return;
  }

  const special = document.getElementById("specialRequests")?.value || "";

  fetch("api/bespoke.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      heel_height: bespokeState.heelHeight,
      material: bespokeState.material,
      color: bespokeState.color,
      size: bespokeState.size,
      special_requests: special
    })
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data.ok) {
        alert(data.error || "Failed to save bespoke order.");
        return;
      }
      alert(`Bespoke order saved! Order #${data.order_id}\nTotal: NIS ${Number(data.price).toFixed(2)}`);
      // اختياري: تفتح cart أو توديه على track_order
      // window.location.href = "track_order.html";
    })
    .catch((err) => {
      console.error(err);
      alert("Server error while saving bespoke order.");
    });
}

// expose (لأن عندك onclick بالـ HTML)
window.selectHeelHeight = selectHeelHeight;
window.selectMaterial = selectMaterial;
window.selectColor = selectColor;
window.selectSize = selectSize;
window.saveBespokeOrderToDB = saveBespokeOrderToDB;


function norm(v) {
  return String(v).trim().toLowerCase();
}

function updatePreviewImage() {
  const img = document.getElementById("previewImage");

  if (!bespokeState.heelHeight || !bespokeState.material || !bespokeState.color) {
    img.src = "heels/default.png";
    return;
  }

  const match = bespokeImages.find(i =>
    i.material.trim().toLowerCase() === bespokeState.material.trim().toLowerCase() &&
    parseInt(i.heel_height) === bespokeState.heelHeight &&
    i.color.trim().toLowerCase() === bespokeState.color.trim().toLowerCase()
  );

  // 👇 هذا هو السطر المهم
  img.src = match ? `heels/${match.image_path}` : "heels/default.png";
}



