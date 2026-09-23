/* ============================================================
   Shopy — Cart state, persistence, and totals
   Handles everything related to the shopping cart: reading and
   writing localStorage, quantities, totals, and the header badge.
   ============================================================ */

const CART_STORAGE_KEY = "shopy_cart";
const ORDER_STORAGE_KEY = "shopy_last_order";
const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_COST = 8;

/**
 * Safely reads the cart from localStorage.
 * Returns an array of { id, quantity } objects. Never throws.
 */
function getCart() {
  let raw;
  try {
    raw = localStorage.getItem(CART_STORAGE_KEY);
  } catch (err) {
    return [];
  }

  if (!raw) return [];

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  // Keep only well-formed entries that reference real, in-stock products.
  return parsed
    .filter(
      (entry) =>
        entry &&
        typeof entry.id === "number" &&
        typeof entry.quantity === "number" &&
        entry.quantity > 0
    )
    .map((entry) => {
      const product = getProductById(entry.id);
      if (!product) return null;
      return {
        id: entry.id,
        quantity: Math.min(entry.quantity, product.stock)
      };
    })
    .filter(Boolean);
}

/** Persists the given cart array to localStorage. */
function saveCart(cart) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (err) {
    // Storage may be unavailable (private browsing, quota, etc.). Fail quietly.
  }
  updateCartBadge();
}

/** Looks up a product by id from the static catalog. */
function getProductById(id) {
  return PRODUCTS.find((p) => p.id === Number(id)) || null;
}

/**
 * Adds a quantity of a product to the cart, respecting stock limits.
 * If the product is already in the cart, quantities are combined.
 */
function addToCart(productId, quantity) {
  const product = getProductById(productId);
  if (!product) return false;

  const cart = getCart();
  const existing = cart.find((item) => item.id === productId);
  const requested = (existing ? existing.quantity : 0) + quantity;
  const finalQuantity = Math.max(1, Math.min(requested, product.stock));

  if (existing) {
    existing.quantity = finalQuantity;
  } else {
    cart.push({ id: productId, quantity: finalQuantity });
  }

  saveCart(cart);
  return true;
}

/** Sets an item's quantity directly. Removes the item if quantity <= 0. */
function updateCartQuantity(productId, quantity) {
  const product = getProductById(productId);
  let cart = getCart();

  if (!product || quantity <= 0) {
    cart = cart.filter((item) => item.id !== productId);
    saveCart(cart);
    return;
  }

  const clamped = Math.min(quantity, product.stock);
  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    existing.quantity = clamped;
  } else {
    cart.push({ id: productId, quantity: clamped });
  }
  saveCart(cart);
}

/** Removes a single product from the cart entirely. */
function removeFromCart(productId) {
  const cart = getCart().filter((item) => item.id !== productId);
  saveCart(cart);
}

/** Empties the cart. */
function clearCart() {
  saveCart([]);
}

/** Returns the total number of items (sum of quantities) in the cart. */
function getCartItemCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Returns the cart joined with full product details, skipping any
 * items whose product no longer exists.
 */
function getCartDetails() {
  return getCart()
    .map((item) => {
      const product = getProductById(item.id);
      if (!product) return null;
      return {
        product,
        quantity: item.quantity,
        lineTotal: product.price * item.quantity
      };
    })
    .filter(Boolean);
}

/** Calculates subtotal, shipping, and total for the current cart. */
function getCartTotals() {
  const details = getCartDetails();
  const subtotal = details.reduce((sum, item) => sum + item.lineTotal, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;
  return { subtotal, shipping, total, itemCount: getCartItemCount() };
}

/** Formats a number as USD currency, e.g. 1234.5 -> "$1,234.50". */
function formatCurrency(amount) {
  const value = Number.isFinite(amount) ? amount : 0;
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/** Updates every cart badge element on the current page. */
function updateCartBadge() {
  const count = getCartItemCount();
  document.querySelectorAll("[data-cart-badge]").forEach((badge) => {
    badge.textContent = String(count);
    badge.hidden = count === 0;
  });
}

/* Keep the badge in sync if the cart changes in another tab. */
window.addEventListener("storage", (event) => {
  if (event.key === CART_STORAGE_KEY) updateCartBadge();
});
