# Grand Café Premium Website — One Install Edition

This version is arranged like a simple single Node.js project for Hostinger. There is only **one `package.json` at the project root**, so you never need to run `npm install` separately inside `client` or `server`.

## Stack

- React + Vite frontend
- Node.js + Express backend
- MongoDB Atlas + Mongoose
- JWT admin login
- Customer registration/login with JWT sessions
- Customer order history, live tracking and saved delivery profile
- Guest order tracking by order number + phone
- Hostinger/local image uploads
- One domain for frontend + API

## Folder structure

```text
grand-cafe/
├─ package.json          # ALL frontend + backend dependencies
├─ server.js             # Hostinger startup file
├─ vite.config.js        # Builds the React app in /client
├─ .env                  # One environment file only
├─ client/
│  ├─ index.html
│  ├─ public/
│  └─ src/
└─ server/
   ├─ src/
   └─ uploads/
```

## Local setup

1. Copy `.env.example` to `.env` and add your MongoDB Atlas URI and JWT secret.
2. From the project root run only:

```bash
npm install
```

`npm install` automatically builds the React frontend through the `postinstall` script.

For development run:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

API: `http://localhost:5000`

Admin: `http://localhost:5173/admin`

Customer registration: `http://localhost:5173/register`

Customer login: `http://localhost:5173/login`

Customer account/order history: `http://localhost:5173/account`

Guest order tracking: `http://localhost:5173/track`

For a production-style local run:

```bash
npm start
```

Then open `http://localhost:5000`.

## Hostinger deployment

Upload/deploy the **whole project root**. Do not deploy only the `client` folder.

Use Node.js 20 or 22.

Hostinger only needs to install dependencies once at the root:

```bash
npm install
```

The `postinstall` script automatically runs the Vite build, so there is no second client install and no separate build folder setup.

Set the startup file to:

```text
server.js
```

Or set the start command to:

```bash
npm start
```

Add the variables from `.env.example` to Hostinger's environment settings.

After deployment test:

```text
https://yourdomain.com/api/health
```

Then visit:

```text
https://yourdomain.com/admin
```

The first deployment shows the one-time Create Admin screen when the MongoDB `admins` collection is empty.

## MongoDB

No MySQL is used. The application creates/uses these MongoDB collections automatically:

- `admins`
- `customers`
- `menuitems`
- `orders`
- `reservations`
- `sitesettings`

The official menu is versioned from the supplied `Grand Cafe Gujrat.pdf`. On first run, or when this official menu version changes, the app synchronizes all 120 official products, categories, descriptions and prices into MongoDB while preserving any product images and availability changes already managed in Admin.

## Local admin setup

On localhost, open `http://localhost:5173/admin`. The page now starts in **Create Admin** mode. If an older local admin already exists in MongoDB, creating a new one replaces the old local admin so forgotten test credentials cannot block development.

This replacement behavior is **development-only**. In production (`NODE_ENV=production`), admin setup is locked after the first admin is created.

## Customer accounts and tracking

Customers can create an account with name, email, phone and password. Passwords are stored only as bcrypt hashes. A signed-in customer's checkout is linked to their MongoDB customer record, so every new order automatically appears in **My Account**.

The account page shows order history and a live progress tracker for:

`Order received → Confirmed → Preparing → Ready → Out for delivery → Completed`

Pickup orders skip the delivery step. Admin status changes immediately become visible to customers on refresh, and the account page also refreshes automatically every 20 seconds. Guest customers can still order and can track an order from `/track` using their order number and phone number.

## Menu pagination, typography and website settings

The public menu now displays **18 products per page** with numbered pagination, previous/next controls, category filtering and search.

The interface uses **Manrope** for clean readable UI text and a bold retro display stack headed by **Nebies Retro** when installed, with **Bungee** as the bundled web-font fallback that closely matches the supplied visual reference. If you later provide the licensed Nebies Retro font file, it can be wired in directly.

The Admin dashboard now includes a **Website settings** section. It stores brand name, tagline, hero text, logo/hero image URLs, opening hours, phone, WhatsApp, restaurant address, Google Maps directions URL, social links and footer identity in MongoDB. The public site reads these settings from `/api/settings`, so most business details no longer need code edits.

## Product cards, add-ons and fulfilment update

The public menu now uses a dense responsive catalogue: six cards per row on large screens, five/four/three/two as the viewport becomes smaller. Product images are always shown in a square crop and every card opens a detailed product customizer.

The customizer supports size/variant selection, quantity and the official PDF extras. Regular pizza extra topping is Rs 100/150/200/250 for Small/Medium/Large/Family, Global and Premium extra topping is Rs 150/200/250 for Medium/Large/Family, and pizza extra dip sauce is Rs 100. Optional drink add-ons use the printed menu prices: 500 ML Drink Rs 139, Can Rs 139, 1 Litre Rs 199, 1.5 Litres Rs 239, Small Water Rs 79 and Large Water Rs 119. Add-on pricing is recalculated and validated by the Express server before an order is saved, so a browser cannot submit a fake add-on price.

Checkout now has first-class Delivery and Pickup modes. Delivery requires area/locality and a full address, supports landmark/instructions, server-side delivery fee calculation, minimum delivery order and optional free-delivery threshold. Pickup uses the restaurant pickup address and carries no delivery fee. Delivery/pickup availability, fee, minimum order, free-delivery threshold and ETA text can all be changed from Admin > Website settings.

## Official PDF menu source

The current menu data was rebuilt from the supplied two-page **Grand Cafe Gujrat.pdf** menu. It contains 120 products across pizza, burgers, roll & wings, pasta, sandwiches, chicken & fries, wraps & pocket, hot deals, coffee/tea, shakes, mocktails, drinks and desserts. The original PDF is included under `docs/Grand Cafe Gujrat.pdf` for reference.

Important printed-menu rules implemented in code:

- Regular Pizza: Small 7" Rs 599, Medium 10" Rs 1149, Large 13" Rs 1649, Family 16" Rs 2449.
- Global Pizza: Medium Rs 1199, Large Rs 1699, Family Rs 2549.
- Premium Pizza: Medium Rs 1399, Large Rs 1999, Family Rs 2749.
- Platinum Pizza: Medium Rs 1449, Large Rs 2099, Family Rs 2849.
- Extra topping: Regular Small Rs 100, Medium Rs 150, Large Rs 200, Family Rs 250; Global/Premium Medium Rs 150, Large Rs 200, Family Rs 250.
- Extra dip sauce for pizzas: Rs 100.
- Printed drink and water prices are used in the product add-on flow.

### Admin account after deployment
Every fresh deployment intentionally requires a new administrator. During `npm install`, the project generates a new deployment identity. The first server start for that deployment removes only the previous admin account and `/admin` shows the create-admin screen. Ordinary Node.js restarts do not reset the admin.
