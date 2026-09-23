/* ============================================================
   Shopy — General UI, catalog, search, filtering, sorting,
   product details, checkout, and confirmation logic.
   ============================================================ */

const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='700' height='700'%3E%3Crect width='700' height='700' fill='%23EEF0F8'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='28' fill='%238C8FB3' text-anchor='middle' dominant-baseline='middle'%3EImage unavailable%3C/text%3E%3C/svg%3E";

/** Swaps a broken product image for a local SVG placeholder. */
function handleImageError(img) {
  if (img.dataset.fallbackApplied) return;
  img.dataset.fallbackApplied = "true";
  img.src = FALLBACK_IMAGE;
}

/* ---------------------------------------------------------- */
/* Shared chrome: mobile nav + toast notifications              */
/* ---------------------------------------------------------- */

function initNav() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const menu = document.querySelector("[data-nav-menu]");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

let toastTimeoutId = null;
/** Shows a small, non-blocking toast notification. */
function showToast(title, message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.innerHTML = "";
  const titleEl = document.createElement("strong");
  titleEl.className = "toast__title";
  titleEl.textContent = title;
  const messageEl = document.createElement("p");
  messageEl.className = "toast__message";
  messageEl.textContent = message;

  toast.appendChild(titleEl);
  toast.appendChild(messageEl);
  toast.classList.add("is-visible");

  clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3200);
}

/* ---------------------------------------------------------- */
/* Star rating rendering                                        */
/* ---------------------------------------------------------- */

function renderStars(rating) {
  const rounded = Math.round(rating * 2) / 2;
  const full = Math.floor(rounded);
  const half = rounded - full === 0.5;
  let stars = "★".repeat(full);
  if (half) stars += "½";
  const empty = 5 - Math.ceil(rounded);
  stars += "☆".repeat(Math.max(empty, 0));
  return stars;
}

/* ---------------------------------------------------------- */
/* Home / catalog page                                          */
/* ---------------------------------------------------------- */

function initCatalogPage() {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  const searchInput = document.getElementById("search-input");
  const clearSearchBtn = document.getElementById("clear-search");
  const categoryButtons = document.querySelectorAll("[data-category]");
  const sortSelect = document.getElementById("sort-select");
  const emptyState = document.getElementById("empty-state");
  const resultsCount = document.getElementById("results-count");

  const state = { query: "", category: "All", sort: "featured" };

  function applyFilters() {
    let items = [...PRODUCTS];

    if (state.category !== "All") {
      items = items.filter((p) => p.category === state.category);
    }

    if (state.query.trim() !== "") {
      const q = state.query.trim().toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    switch (state.sort) {
      case "price-asc":
        items.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        items.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        items.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        // "featured" keeps the catalog's natural order
        break;
    }

    renderGrid(items);
  }

  function renderGrid(items) {
    grid.innerHTML = "";

    if (items.length === 0) {
      emptyState.hidden = false;
      resultsCount.textContent = "0 products";
      return;
    }

    emptyState.hidden = true;
    resultsCount.textContent = `${items.length} product${items.length === 1 ? "" : "s"}`;

    const fragment = document.createDocumentFragment();
    items.forEach((product) => fragment.appendChild(buildProductCard(product)));
    grid.appendChild(fragment);
  }

  function buildProductCard(product) {
    const card = document.createElement("article");
    card.className = "product-card";

    card.innerHTML = `
      <a class="product-card__link" href="product.html?id=${product.id}" aria-label="View ${product.name}">
        <div class="product-card__image-wrap">
          <img
            class="product-card__image"
            src="${product.image}"
            alt="${product.name}"
            loading="lazy"
            onerror="handleImageError(this)"
          />
          ${product.stock === 0 ? '<span class="badge badge--out">Out of stock</span>' : ""}
        </div>
        <div class="product-card__body">
          <span class="product-card__category">${product.category}</span>
          <h3 class="product-card__name">${product.name}</h3>
          <div class="product-card__meta">
            <span class="stars" aria-label="Rated ${product.rating} out of 5">${renderStars(product.rating)}</span>
            <span class="product-card__price">${formatCurrency(product.price)}</span>
          </div>
        </div>
      </a>
    `;
    return card;
  }

  searchInput?.addEventListener("input", (e) => {
    state.query = e.target.value;
    clearSearchBtn.hidden = state.query.trim() === "";
    applyFilters();
  });

  clearSearchBtn?.addEventListener("click", () => {
    state.query = "";
    searchInput.value = "";
    clearSearchBtn.hidden = true;
    searchInput.focus();
    applyFilters();
  });

  categoryButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.category = btn.dataset.category;
      categoryButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
      applyFilters();
    });
  });

  sortSelect?.addEventListener("change", (e) => {
    state.sort = e.target.value;
    applyFilters();
  });

  document.getElementById("reset-filters")?.addEventListener("click", () => {
    state.query = "";
    state.category = "All";
    state.sort = "featured";
    if (searchInput) searchInput.value = "";
    if (sortSelect) sortSelect.value = "featured";
    clearSearchBtn.hidden = true;
    categoryButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.category === "All"));
    applyFilters();
  });

  const heroCta = document.getElementById("hero-cta");
  heroCta?.addEventListener("click", () => {
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  });

  applyFilters();
}

/* ---------------------------------------------------------- */
/* Product details page                                         */
/* ---------------------------------------------------------- */

function initProductPage() {
  const container = document.getElementById("product-detail");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get("id"));
  const product = Number.isFinite(id) ? getProductById(id) : null;

  if (!product) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>We couldn't find that product.</h2>
        <p>The item may have been removed, or the link may be incorrect.</p>
        <a class="btn btn--primary" href="index.html">Back to Shop</a>
      </div>
    `;
    return;
  }

  document.title = `${product.name} — Shopy`;

  container.innerHTML = `
    <a class="back-link" href="index.html">&larr; Back to Shop</a>
    <div class="product-detail">
      <div class="product-detail__image-wrap">
        <img
          class="product-detail__image"
          src="${product.image}"
          alt="${product.name}"
          onerror="handleImageError(this)"
        />
      </div>
      <div class="product-detail__info">
        <span class="product-card__category">${product.category}</span>
        <h1 class="product-detail__name">${product.name}</h1>
        <div class="product-card__meta">
          <span class="stars" aria-label="Rated ${product.rating} out of 5">${renderStars(product.rating)}</span>
          <span class="product-detail__price">${formatCurrency(product.price)}</span>
        </div>
        <p class="product-detail__stock ${product.stock > 0 ? "in-stock" : "out-of-stock"}">
          ${product.stock > 0 ? `In stock — ${product.stock} available` : "Out of stock"}
        </p>
        <p class="product-detail__description">${product.description}</p>

        ${
          product.stock > 0
            ? `
          <form id="add-to-cart-form" class="add-to-cart-form">
            <label for="quantity-input">Quantity</label>
            <div class="quantity-control">
              <button type="button" class="quantity-btn" id="qty-decrease" aria-label="Decrease quantity">&minus;</button>
              <input
                type="number"
                id="quantity-input"
                name="quantity"
                value="1"
                min="1"
                max="${product.stock}"
                inputmode="numeric"
                aria-label="Quantity"
              />
              <button type="button" class="quantity-btn" id="qty-increase" aria-label="Increase quantity">&plus;</button>
            </div>
            <button type="submit" class="btn btn--primary btn--large">Add to Cart</button>
          </form>
        `
            : `<button class="btn btn--primary btn--large" disabled>Out of Stock</button>`
        }

        <a class="btn btn--secondary" href="index.html">Continue Shopping</a>
      </div>
    </div>
  `;

  const qtyInput = document.getElementById("quantity-input");
  const decreaseBtn = document.getElementById("qty-decrease");
  const increaseBtn = document.getElementById("qty-increase");
  const form = document.getElementById("add-to-cart-form");

  function clampQty() {
    let val = parseInt(qtyInput.value, 10);
    if (!Number.isFinite(val) || val < 1) val = 1;
    if (val > product.stock) val = product.stock;
    qtyInput.value = val;
  }

  decreaseBtn?.addEventListener("click", () => {
    qtyInput.value = Math.max(1, parseInt(qtyInput.value, 10) - 1 || 1);
  });
  increaseBtn?.addEventListener("click", () => {
    qtyInput.value = Math.min(product.stock, (parseInt(qtyInput.value, 10) || 1) + 1);
  });
  qtyInput?.addEventListener("change", clampQty);

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    clampQty();
    const quantity = parseInt(qtyInput.value, 10);
    addToCart(product.id, quantity);
    showToast("Added to cart", `${product.name} has been added to your cart.`);
  });
}

/* ---------------------------------------------------------- */
/* Cart page                                                     */
/* ---------------------------------------------------------- */

function initCartPage() {
  const cartRoot = document.getElementById("cart-page");
  if (!cartRoot) return;

  const itemsContainer = document.getElementById("cart-items");
  const emptyState = document.getElementById("cart-empty");
  const summary = document.getElementById("cart-summary");
  const subtotalEl = document.getElementById("cart-subtotal");
  const shippingEl = document.getElementById("cart-shipping");
  const totalEl = document.getElementById("cart-total");
  const clearBtn = document.getElementById("clear-cart-btn");

  function render() {
    const details = getCartDetails();

    if (details.length === 0) {
      itemsContainer.innerHTML = "";
      emptyState.hidden = false;
      summary.hidden = true;
      clearBtn.hidden = true;
      return;
    }

    emptyState.hidden = true;
    summary.hidden = false;
    clearBtn.hidden = false;

    itemsContainer.innerHTML = "";
    details.forEach(({ product, quantity, lineTotal }) => {
      const row = document.createElement("article");
      row.className = "cart-item";
      row.innerHTML = `
        <img
          class="cart-item__image"
          src="${product.image}"
          alt="${product.name}"
          onerror="handleImageError(this)"
        />
        <div class="cart-item__details">
          <a class="cart-item__name" href="product.html?id=${product.id}">${product.name}</a>
          <span class="cart-item__price">${formatCurrency(product.price)} each</span>
          <button type="button" class="link-btn cart-item__remove" data-remove="${product.id}">Remove</button>
        </div>
        <div class="quantity-control quantity-control--small">
          <button type="button" class="quantity-btn" data-decrease="${product.id}" aria-label="Decrease quantity of ${product.name}">&minus;</button>
          <input
            type="number"
            value="${quantity}"
            min="1"
            max="${product.stock}"
            data-qty-input="${product.id}"
            aria-label="Quantity of ${product.name}"
          />
          <button type="button" class="quantity-btn" data-increase="${product.id}" aria-label="Increase quantity of ${product.name}">&plus;</button>
        </div>
        <div class="cart-item__subtotal">${formatCurrency(lineTotal)}</div>
      `;
      itemsContainer.appendChild(row);
    });

    const totals = getCartTotals();
    subtotalEl.textContent = formatCurrency(totals.subtotal);
    shippingEl.textContent = totals.shipping === 0 ? "Free" : formatCurrency(totals.shipping);
    totalEl.textContent = formatCurrency(totals.total);
  }

  itemsContainer.addEventListener("click", (e) => {
    const removeId = e.target.closest("[data-remove]")?.dataset.remove;
    const decId = e.target.closest("[data-decrease]")?.dataset.decrease;
    const incId = e.target.closest("[data-increase]")?.dataset.increase;

    if (removeId) {
      removeFromCart(Number(removeId));
      render();
    } else if (decId) {
      const product = getProductById(Number(decId));
      const current = getCart().find((i) => i.id === Number(decId));
      const next = (current ? current.quantity : 1) - 1;
      updateCartQuantity(Number(decId), next);
      render();
    } else if (incId) {
      const product = getProductById(Number(incId));
      const current = getCart().find((i) => i.id === Number(incId));
      const next = Math.min((current ? current.quantity : 0) + 1, product.stock);
      updateCartQuantity(Number(incId), next);
      render();
    }
  });

  itemsContainer.addEventListener("change", (e) => {
    const input = e.target.closest("[data-qty-input]");
    if (!input) return;
    const id = Number(input.dataset.qtyInput);
    let value = parseInt(input.value, 10);
    if (!Number.isFinite(value)) value = 1;
    updateCartQuantity(id, value);
    render();
  });

  clearBtn?.addEventListener("click", () => {
    clearCart();
    render();
  });

  render();
}

/* ---------------------------------------------------------- */
/* Checkout page                                                 */
/* ---------------------------------------------------------- */

function initCheckoutPage() {
  const form = document.getElementById("checkout-form");
  if (!form) return;

  const totals = getCartTotals();
  if (totals.itemCount === 0) {
    window.location.href = "cart.html";
    return;
  }

  const summaryList = document.getElementById("checkout-summary-list");
  const subtotalEl = document.getElementById("checkout-subtotal");
  const shippingEl = document.getElementById("checkout-shipping");
  const totalEl = document.getElementById("checkout-total");

  const details = getCartDetails();
  summaryList.innerHTML = details
    .map(
      (item) => `
      <li class="checkout-summary__row">
        <span>${item.product.name} &times; ${item.quantity}</span>
        <span>${formatCurrency(item.lineTotal)}</span>
      </li>`
    )
    .join("");
  subtotalEl.textContent = formatCurrency(totals.subtotal);
  shippingEl.textContent = totals.shipping === 0 ? "Free" : formatCurrency(totals.shipping);
  totalEl.textContent = formatCurrency(totals.total);

  const fields = {
    fullName: { pattern: (v) => v.trim().length >= 2 && v.trim().length <= 80, message: "Enter your full name." },
    email: {
      pattern: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      message: "Enter a valid email address."
    },
    phone: {
      pattern: (v) => v.replace(/\D/g, "").length >= 7 && v.replace(/\D/g, "").length <= 15,
      message: "Enter a valid phone number."
    },
    address: { pattern: (v) => v.trim().length >= 4, message: "Enter your street address." },
    city: { pattern: (v) => v.trim().length >= 2, message: "Enter your city." },
    country: { pattern: (v) => v.trim().length >= 2, message: "Enter your country." },
    cardNumber: { pattern: (v) => isValidCardNumber(v), message: "Enter a valid card number." },
    expiry: { pattern: (v) => isValidExpiry(v), message: "Enter a valid, unexpired MM/YY date." },
    cvv: { pattern: (v) => /^\d{3,4}$/.test(v.trim()), message: "Enter a 3 or 4 digit CVV." }
  };

  function isValidCardNumber(value) {
    const digits = value.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) return false;
    // Luhn algorithm
    let sum = 0;
    let shouldDouble = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  function isValidExpiry(value) {
    const match = value.trim().match(/^(\d{2})\/(\d{2})$/);
    if (!match) return false;
    const month = parseInt(match[1], 10);
    const year = 2000 + parseInt(match[2], 10);
    if (month < 1 || month > 12) return false;
    const expiryDate = new Date(year, month, 0, 23, 59, 59);
    return expiryDate >= new Date();
  }

  function showFieldError(name, message) {
    const errorEl = form.querySelector(`[data-error-for="${name}"]`);
    const input = form.elements[name];
    if (errorEl) errorEl.textContent = message || "";
    if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function validateField(name) {
    const input = form.elements[name];
    if (!input) return true;
    const rule = fields[name];
    const isValid = rule.pattern(input.value);
    showFieldError(name, isValid ? "" : rule.message);
    return isValid;
  }

  Object.keys(fields).forEach((name) => {
    const input = form.elements[name];
    input?.addEventListener("input", () => validateField(name));
    input?.addEventListener("blur", () => validateField(name));
  });

  // Light input formatting for card number and expiry.
  form.elements.cardNumber?.addEventListener("input", (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 19);
    e.target.value = digits.replace(/(.{4})/g, "$1 ").trim();
  });
  form.elements.expiry?.addEventListener("input", (e) => {
    let digits = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) digits = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    e.target.value = digits;
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const allValid = Object.keys(fields)
      .map((name) => validateField(name))
      .every(Boolean);

    if (!allValid) {
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    const currentTotals = getCartTotals();
    const orderId = generateOrderId();
    const order = {
      orderId,
      date: new Date().toISOString(),
      total: currentTotals.total,
      itemCount: currentTotals.itemCount,
      customerName: form.elements.fullName.value.trim(),
      email: form.elements.email.value.trim()
    };

    try {
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
    } catch (err) {
      // Ignore storage failures; confirmation page will handle a missing order.
    }

    clearCart();
    window.location.href = "confirmation.html";
  });
}

function generateOrderId() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `SHP-${datePart}-${randomPart}`;
}

/* ---------------------------------------------------------- */
/* Confirmation page                                             */
/* ---------------------------------------------------------- */

function initConfirmationPage() {
  const root = document.getElementById("confirmation-page");
  if (!root) return;

  let order = null;
  try {
    const raw = localStorage.getItem(ORDER_STORAGE_KEY);
    order = raw ? JSON.parse(raw) : null;
  } catch (err) {
    order = null;
  }

  if (!order || !order.orderId) {
    root.innerHTML = `
      <div class="empty-state">
        <h1>No recent order found</h1>
        <p>It looks like you haven't completed a checkout yet, or this page was opened directly.</p>
        <a class="btn btn--primary" href="index.html">Back to Home</a>
      </div>
    `;
    return;
  }

  const orderDate = new Date(order.date);
  const formattedDate = Number.isNaN(orderDate.getTime())
    ? ""
    : orderDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  root.innerHTML = `
    <div class="confirmation">
      <div class="confirmation__icon" aria-hidden="true">✓</div>
      <h1>Order Confirmed</h1>
      <p class="confirmation__thanks">Thank you for shopping with Shopy${order.customerName ? `, ${order.customerName}` : ""}.</p>
      <dl class="confirmation__details">
        <div><dt>Order ID</dt><dd>${order.orderId}</dd></div>
        ${formattedDate ? `<div><dt>Order date</dt><dd>${formattedDate}</dd></div>` : ""}
        <div><dt>Items</dt><dd>${order.itemCount}</dd></div>
        <div><dt>Total</dt><dd>${formatCurrency(order.total)}</dd></div>
      </dl>
      <div class="confirmation__actions">
        <a class="btn btn--primary" href="index.html">Continue Shopping</a>
        <a class="btn btn--secondary" href="index.html">Back to Home</a>
      </div>
    </div>
  `;

  try {
    localStorage.removeItem(ORDER_STORAGE_KEY);
  } catch (err) {
    /* ignore */
  }
}

/* ---------------------------------------------------------- */
/* Bootstrap                                                     */
/* ---------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  updateCartBadge();
  initCatalogPage();
  initProductPage();
  initCartPage();
  initCheckoutPage();
  initConfirmationPage();

  const yearEl = document.getElementById("current-year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
});
