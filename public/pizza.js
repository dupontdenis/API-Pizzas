function q(selector) {
  return document.querySelector(selector);
}

// API helpers — prefer the current origin when the backend serves the frontend,
// otherwise fall back to localhost:3000 (useful when previewing with Live Server).
const API_FALLBACK = "http://localhost:3000";

async function fetchJsonPath(path) {
  let lastErr = "";
  const urls = [];
  try {
    const origin = window.location.origin;
    if (origin && origin !== "null" && origin !== "file://")
      urls.push(origin + path);
  } catch (e) {}
  urls.push(API_FALLBACK + path);

  for (const url of urls) {
    try {
      const res = await fetch(url);
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      const textPreview = async () => {
        try {
          return (await res.text()).slice(0, 200);
        } catch (e) {
          return "";
        }
      };

      if (!res.ok) {
        const preview = await textPreview();
        lastErr = `HTTP ${res.status} from ${url} - ${preview}`;
        if (!ct.includes("application/json")) continue;
        const j = await res.json();
        throw new Error(JSON.stringify(j).slice(0, 200));
      }

      if (!ct.includes("application/json")) {
        const preview = await textPreview();
        lastErr = `Expected JSON but got ${
          ct || "<no content-type>"
        } from ${url}: ${preview}`;
        continue;
      }

      return await res.json();
    } catch (e) {
      lastErr = e.message || String(e);
      // try next url
      continue;
    }
  }

  throw new Error(lastErr || "Failed to fetch JSON");
}

function parseId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function loadPizza() {
  const id = parseId();
  if (!id) {
    q("#name").textContent = "Missing id";
    return;
  }

  try {
    const pizza = await fetchJsonPath(`/pizzas/${encodeURIComponent(id)}`);
    q("#name").textContent = pizza.name || "Unknown pizza";
    q("#info").innerHTML = `
      <p><strong>ID:</strong> ${pizza._id || pizza.id || ""}</p>
      <p><strong>Description:</strong> ${escapeHtml(
        pizza.description || "—"
      )}</p>
      <p><strong>Total price:</strong> €${
        typeof pizza.totalPriceEur === "number"
          ? pizza.totalPriceEur.toFixed(2)
          : "0.00"
      }</p>
    `;

    const list = q("#pizza-toppings");
    list.innerHTML = "";
    if (!Array.isArray(pizza.toppings) || pizza.toppings.length === 0) {
      list.innerHTML = '<li class="empty">No toppings</li>';
    } else {
      pizza.toppings.forEach((t) => {
        const li = document.createElement("li");
        const title = t.title || t._id || "(topping)";
        const tid = t._id || t.id || "";
        const price =
          typeof t.priceEur === "number" ? ` — €${t.priceEur.toFixed(2)}` : "";
        // Use relative path so previews (Live Server) and backend-served files both work
        li.innerHTML = `<a class="item-link" href="topping.html?id=${encodeURIComponent(
          tid
        )}">${escapeHtml(title)}</a> <span class="meta">${escapeHtml(
          tid
        )}${escapeHtml(price)}</span>`;
        list.appendChild(li);
      });
    }
  } catch (err) {
    q("#name").textContent = "Error";
    q("#info").textContent = err.message;
  }
}

loadPizza();
