# Shopy

Shopy is a frontend-only e-commerce storefront built as a software engineering
internship capstone project. It simulates a complete shopping experience —
browsing, searching, filtering, a cart, and a mock checkout — entirely in the
browser, with no backend or real payment processing.

## Features

- Product catalog with 12 products across four categories
- Real-time client-side search (by name, category, and description)
- Category filtering that works together with search and sorting
- Sorting by featured order, price, and name
- Product details page with quantity selection bounded by stock
- Persistent cart (survives refreshes) with quantity controls and removal
- Order summary with subtotal, a simple shipping rule, and total
- Multi-section checkout form with real client-side validation, including
  Luhn-checked card numbers and expiry-date checks
- Order confirmation page with a generated order ID
- Responsive layout from 320px mobile up to desktop
- Accessible semantic HTML, labeled form fields, and visible focus states

## Technologies

HTML5, CSS3, vanilla JavaScript, and the browser's `localStorage` API.
No frameworks, build tools, or backend services are used.

## Project Structure

```text
shopy/
├── index.html          Home page: hero + product catalog
├── product.html         Product details page (reads ?id= from the URL)
├── cart.html             Cart page
├── checkout.html         Checkout form
├── confirmation.html     Order confirmation page
│
├── css/
│   └── style.css         All styling for every page
│
├── js/
│   ├── products.js       Static product catalog data
│   ├── app.js             Catalog, search, filtering, sorting, product
│   │                       details, checkout, and confirmation logic
│   └── cart.js             Cart state, localStorage, quantities, totals,
│                            and the header cart badge
│
├── assets/
│   ├── images/            Reserved for local product images, if you'd
│   │                       rather not use the remote placeholder images
│   └── icons/              Reserved for any local icon assets
│
├── README.md
└── .gitignore
```

Product images currently use remote placeholder URLs (picsum.photos) so the
project runs immediately with no setup. To use your own images instead, drop
files into `assets/images/` and update each product's `image` field in
`js/products.js` to point at, for example, `assets/images/headphones.jpg`.
Every product image also has an `onerror` fallback to a local inline SVG
placeholder, so a broken image link never breaks the layout.

## How to Run

1. Download or clone this project folder.
2. Open the folder in VS Code.
3. Install the "Live Server" extension if you don't already have it.
4. Right-click `index.html` and choose **Open with Live Server**.
5. The site opens in your browser at a local address such as
   `http://127.0.0.1:5500`.

Alternatively, any static file server works, for example:

```bash
npx serve .
```

## Limitations

- Frontend-only: there is no backend, API, or database.
- No real user authentication or accounts.
- No real payment processing — checkout is a validated mock form only.
- Product data is static and defined in `js/products.js`.
- The cart is persisted in the browser's `localStorage`, so it is local
  to one browser on one device and is not shared across devices.

## Future Improvements

- Backend/API integration for real product and order data
- A real database instead of static, in-code product data
- User authentication and accounts
- Integration with a real payment provider
- An admin dashboard for managing products and orders
- Real, ongoing product management instead of a fixed catalog
