function q(selector) {
  return document.querySelector(selector);
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
      continue;
    }
  }

  throw new Error(lastErr || "Failed to fetch JSON");
}

async function loadTopping() {
  const id = parseId();
  if (!id) {
    q("#title").textContent = "Missing id";
    return;
  }
  try {
    const topping = await fetchJsonPath(`/toppings/${encodeURIComponent(id)}`);
    q("#title").textContent = topping.title || "Unknown topping";
    q("#info").innerHTML = `
      <p><strong>ID:</strong> ${topping._id || topping.id || ""}</p>
      <p><strong>Price:</strong> €${
        typeof topping.priceEur === "number"
          ? topping.priceEur.toFixed(2)
          : "0.00"
      }</p>
    `;

    // load pizzas that include this topping
    let pizzas = [];
    try {
      pizzas = await fetchJsonPath(
        `/toppings/${encodeURIComponent(id)}/pizzas`
      );
    } catch (e) {
      pizzas = [];
    }
    const list = q("#topping-pizzas");
    list.innerHTML = "";
    if (!Array.isArray(pizzas) || pizzas.length === 0) {
      list.innerHTML = '<li class="empty">No pizzas</li>';
    } else {
      pizzas.forEach((p) => {
        const li = document.createElement("li");
        const pid = p._id || p.id || "";
        const name = p.name || "(pizza)";
        // Use relative path so previews (Live Server) and backend-served files both work
        li.innerHTML = `<a class="item-link" href="pizza.html?id=${encodeURIComponent(
          pid
        )}">${escapeHtml(name)}</a> <span class="meta">${escapeHtml(
          pid
        )}</span>`;
        list.appendChild(li);
      });
    }
  } catch (err) {
    q("#title").textContent = "Error";
    q("#info").textContent = err.message;
  }
}

loadTopping();
