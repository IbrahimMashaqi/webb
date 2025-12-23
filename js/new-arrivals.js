let allProducts = [];

document.addEventListener("DOMContentLoaded", () => {
  fetch("./api/new_arrivals.php")
    .then(res => res.json())
    .then(data => {
      allProducts = data;
      buildProducts(data);
    })
    .catch(err => console.error(err));
});

function buildProducts(products) {
  const container = document.getElementById("productsGrid");
  container.innerHTML = "";

  products.forEach(p => {
    const div = document.createElement("div");
    div.className = "product";
    div.dataset.category = p.category;
    div.dataset.price = p.price;
    div.dataset.date = p.date;

    div.innerHTML = `
      <div class="product-badge new">New</div>
      <i class="fa-solid fa-heart wishlist"></i>
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <div class="price">NIS ${Number(p.price).toFixed(2)}</div>
      <div class="rating">★★★★★</div>
      <div class="actions">
        <button onclick="quickAdd(this,'${p.name}','NIS ${p.price}','${p.image}','')">
          Add to Cart
        </button>
        <button class="quick-view-btn">Quick View</button>
      </div>
    `;

    container.appendChild(div);
  });
}

/* نفس الفلترة بدون ما نكسر الgrid */
function filterCategory(cat, btn) {
  document.querySelectorAll(".filter-btn").forEach(b =>
    b.classList.remove("active")
  );
  btn.classList.add("active");

  document.querySelectorAll(".product").forEach(p => {
    p.style.display =
      cat === "all" || p.dataset.category === cat ? "" : "none";
  });
}

/* نفس الترتيب */
function sortProducts(type) {
  let sorted = [...allProducts];

  if (type === "newest")
    sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
  if (type === "price-low")
    sorted.sort((a, b) => a.price - b.price);
  if (type === "price-high")
    sorted.sort((a, b) => b.price - a.price);

  buildProducts(sorted);
}
