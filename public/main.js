const pizzasList = document.getElementById("pizzas-list");
const toppingsList = document.getElementById("toppings-list");
const loadPizzasBtn = document.getElementById("load-pizzas");
const loadToppingsBtn = document.getElementById("load-toppings");

// API base — adjust if your backend runs on a different host/port
const API_BASE = "http://localhost:3000";

function clear(el) {
  el.innerHTML = "";
}

function renderPizzas(pizzas) {
  clear(pizzasList);
  if (!Array.isArray(pizzas) || pizzas.length === 0) {
    pizzasList.innerHTML = '<li class="empty">No pizzas found</li>';
    return;
  }
  pizzas.forEach((p) => {
    const li = document.createElement("li");
    const id = p._id || p.id || "";
    const name = p.name || "(no name)";
    const total =
      typeof p.totalPriceEur === "number"
        ? ` — €${p.totalPriceEur.toFixed(2)}`
        : "";
    li.innerHTML = `<a class="item-link" href="pizza.html?id=${encodeURIComponent(
      id
    )}">${escapeHtml(name)}</a> <span class="meta">${escapeHtml(id)}</span>`;
    pizzasList.appendChild(li);
  });
}

function renderToppings(toppings) {
  clear(toppingsList);
  if (!Array.isArray(toppings) || toppings.length === 0) {
    toppingsList.innerHTML = '<li class="empty">No toppings found</li>';
    return;
  }
  toppings.forEach((t) => {
    const li = document.createElement("li");
    const id = t._id || t.id || "";
    const title = t.title || "(no title)";
    const price =
      typeof t.priceEur === "number" ? ` — €${t.priceEur.toFixed(2)}` : "";
    li.innerHTML = `<a class="item-link" href="topping.html?id=${encodeURIComponent(
      id
    )}">${escapeHtml(title)}</a> <span class="meta">${escapeHtml(
      id
    )}${escapeHtml(price)}</span>`;
    toppingsList.appendChild(li);
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function loadPizzas() {
  loadPizzasBtn.disabled = true;
  try {
    const res = await fetch(`${API_BASE}/pizzas`);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HTTP ${res.status} - ${txt.slice(0, 200)}`);
    }
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("application/json")) {
      const txt = await res.text();
      throw new Error(
        `Expected JSON but got ${ct || "<no content-type>"}: ${txt.slice(
          0,
          200
        )}`
      );
    }
    const data = await res.json();
    renderPizzas(data);
  } catch (err) {
    pizzasList.innerHTML = `<li class="error">Error: ${escapeHtml(
      err.message
    )}</li>`;
  } finally {
    loadPizzasBtn.disabled = false;
  }
}

async function loadToppings() {
  loadToppingsBtn.disabled = true;
  try {
    const res = await fetch(`${API_BASE}/toppings`);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HTTP ${res.status} - ${txt.slice(0, 200)}`);
    }
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("application/json")) {
      const txt = await res.text();
      throw new Error(
        `Expected JSON but got ${ct || "<no content-type>"}: ${txt.slice(
          0,
          200
        )}`
      );
    }
    const data = await res.json();
    renderToppings(data);
  } catch (err) {
    toppingsList.innerHTML = `<li class="error">Error: ${escapeHtml(
      err.message
    )}</li>`;
  } finally {
    loadToppingsBtn.disabled = false;
  }
}

loadPizzasBtn.addEventListener("click", loadPizzas);
loadToppingsBtn.addEventListener("click", loadToppings);

// Auto-load pizzas on page open for convenience
// loadPizzas();
