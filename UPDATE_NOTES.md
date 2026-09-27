# v6.6.0 - Complete WebP Menu Images

- Assigned an individual WebP image to all 120 Grand Café menu products.
- Added Roll & Wings, Pasta, Sandwich, Chicken & Fries, Wraps & Pocket, Hot Deals, Tea, Water, and Dessert product imagery.
- All menu `image_url` values now point to local `.webp` assets under `/assets/pizzas/` or `/assets/products/`.
- Bumped the official menu image migration version so existing MongoDB products receive the completed image mapping once on deployment.
- Images remain local to the Hostinger application; MongoDB stores only their paths.

# v6.5 - Generated product image integration

- Added 50 newly generated product-specific images as optimized 900×900 WebP assets.
- Mapped burger, sandwich, ice-cream shake, margarita, mocktail, special-shake, soft-drink, hot-coffee and cold-coffee images to their exact menu items.
- Kept the 24 existing designated pizza WebP images.
- Bumped the official menu migration so existing MongoDB menu rows receive the bundled generated images once.
- Admin image edits made after this migration remain editable/persistent on ordinary restarts.
- Added `docs/product-image-map.json` for a complete mapping/audit trail.

# v4.5.0 – Product card proportions, browser-native View site link, and reviews

- Product cards no longer stretch to the tallest card in a grid row, removing the large empty gap between product name and price.
- Product image containers are forced to a true 1:1 square at every breakpoint.
- Admin **View site** is now a normal anchor link, so right-click exposes browser actions such as “Open link in new tab”.
- Added a complete customer review workflow:
  - Registered customers can review completed orders once.
  - Reviews are held for admin approval.
  - New **Reviews** tab in the admin dashboard with approve/hide/delete controls.
  - Approved reviews appear on the public homepage.
- Public review API exposes only display-safe review fields.

# v4.4.0 – Mobile menu performance

- Removed per-card scroll reveal animation that made products appear only while scrolling on phones.
- Menu cards render immediately and use real square `<img>` elements instead of CSS background images.
- First-row product images are prioritized; the rest decode asynchronously and are warmed into cache during browser idle time.
- Mobile menu page size is 16 products (desktop remains 20) to reduce DOM/image work while keeping pagination compact.
- Disabled expensive blur/hover effects on touch/mobile layouts to reduce scrolling jank.
- Future admin image uploads are automatically resized and converted to WebP in the browser before upload, dramatically reducing product image weight.
- Admin thumbnails now lazy-load and decode asynchronously.

# Grand Café 4.3.0 update

- Admin menu now loads independently from other dashboard sections so a failure in customers/orders/settings does not hide products.
- Admin `/api/admin/menu` self-heals an empty menu from the official PDF seed.
- Added **Sync official menu** control in Admin > Menu. Official product images already uploaded are preserved during sync.
- Every menu item can now be edited from the admin panel: category, name, description, all price variants, badge, visibility and product image/URL.
- Added admin product search.
- Customer-facing phone fields accept digits only (7–15 digits), with numeric mobile keyboard hints and numeric backend validation.
- Checkout delivery/order instructions textarea is taller and vertically resizable.
- Hostinger ESM-compatible `server.js` entry behavior is preserved.

## v4.6.0
- Kept all top-level menu groups on a single desktop row; smaller screens use one horizontal scroll row instead of wrapping.
- Standardized menu/category typography to Manrope and increased key UI font sizes.
- Changed the product catalogue to 4 cards per desktop row with equal horizontal and vertical spacing.
- Replaced admin category datalists with real category dropdowns for both Add and Edit Product.
- Fixed admin product description fields to a compact fixed-height horizontal layout so they no longer grow vertically.
- Made the product customizer footer a persistent, non-scrolling action area so Add to cart remains visible.
- Hot Deals now also appear correctly in the top menu category browser instead of showing 0 items, while the dedicated Deals section remains available.

## v4.7 focused fixes
- Product customization modal now reserves enough viewport space for the Add to cart footer at 100% browser zoom.
- Replaced the plain admin loading text with a branded Grand Café loader and progress animation.
- Added a Remove image control to Edit Product. The change is applied when Save product is pressed.
- Added an Add review form in Admin > Reviews.
- Added a customer review form on the public homepage. Public submissions are pending until approved in Admin > Reviews.

## v4.8.0 - Premium visual system
- Added a dark glassmorphism + soft-neumorphic visual layer across the public site and admin dashboard.
- Refined navigation, hero, category browser, product cards, modal, deals, reviews, forms and admin surfaces.
- Preserved Grand Café orange/red/yellow identity and all existing functionality.
- Reduced expensive blur/hover effects on mobile to preserve scrolling performance.
- No database, ordering, authentication, menu or deployment logic changed.

## v4.9 compact modal + appearance switch
- Reduced desktop product customizer dimensions so the quantity and Add to cart bar fit comfortably at 100% browser zoom.
- Product option area still scrolls, but the scrollbar itself is hidden on WebKit/Chromium/Firefox.
- Added a persistent Dark / Light appearance switch using localStorage.
- Theme switch is available in the public navbar, customer/account headers and admin sidebar.
- Added a warm premium light theme while preserving Grand Café orange/gold/red brand accents.

## v5.0 focused modal/light-mode patch
- Product customizer is smaller and uses a fixed two-row content layout on desktop so the quantity + Add to cart footer is always visible at 100% zoom.
- Product customizer image is now a true 1:1 square instead of stretching vertically with the modal.
- Modal scrollbar remains visually hidden while scrolling still works.
- In light mode, high-emphasis text that appears white in dark mode now uses Grand Café logo red, while secondary copy stays neutral gray and prices/accent labels keep the gold/orange brand color.


## v5.1 Light-mode selected states
- Selected main menu group is Grand Café red with white text in light mode.
- Selected subcategory and pagination controls use the same red/white state.
- Header navigation link remains visibly selected after click.
- Selected pizza/product size is red with white text in light mode.
- Selected add-ons and delivery/pickup choices use matching red/white styling.
- Dark mode behavior remains unchanged.

## v5.2.0
- Dark-mode reservation section now uses a consistent dark premium treatment.
- Light-mode active navigation pills now fill fully red with white text.
- Light-mode selected menu group cards now fill fully red with white text and white icons.
- Subcategory, pizza-size, delivery/pickup, and pagination selected states follow the same red/white treatment.
- Light-mode reservation heading uses the Grand Café red for proper contrast.

## v5.3 — Light-theme red action system
- Replaced yellow/orange CTA gradients with a Grand Café red gradient in Light Mode.
- Changed light-theme yellow/gold interface icons and star accents to brand red.
- Replaced stark white text on red selected controls with a warm ivory tone for a softer premium look.
- Dark Mode remains unchanged.

## v5.5 mobile navigation glass fix
- Mobile 3-bar navigation now opens as a fully visible frosted-glass panel instead of appearing transparent.
- Added strong background blur, saturation, glossy highlights, border depth and shadow in dark mode.
- Added a warm frosted-glass version for light mode with matching glossy depth.
- Active mobile navigation item keeps the Grand Café red treatment with light text.
- No ordering, menu, account, admin, MongoDB or deployment logic changed.


## v5.6 focused visual cleanup
- Removed the divider line between the product modal image and product information.
- Removed the white/gloss vignette overlay from product cards.
- Made the menu context/search bar light in Light Mode.
- Made the pagination control light in Light Mode while preserving the red active page.
- Reduced and normalized the reservation notes textarea height.


## v5.7
- Light mode Grand Café Signature hero card now uses a warm light surface instead of the dark glass card.
- Light mode navbar blur/frosted halo removed; navbar is now crisp, opaque and lightly shadowed.
- Dark mode and all application logic remain unchanged.


## v5.8 - Visit CTA theme polish
- Light theme: phone, Open in Google Maps, and Get directions use the Grand Café red gradient with warm ivory text/icons.
- Dark theme: the same Visit actions use the signature yellow-to-orange gradient with dark text/icons.
- Light theme: Sign in/account icon is now Grand Café red.
- No ordering, MongoDB, admin, customer, or deployment logic changed.

## v5.9 focused light-theme polish
- Hot Deal `Add deal` buttons are now Grand Café red-gradient CTAs in Light Mode.
- Hot Deal prices now use the same Manrope UI typography as the rest of the site.
- Added a theme-aware official logo asset: in Light Mode the original yellow/gold logo lettering is recolored to Grand Café red while the existing red outline remains intact. Dark Mode keeps the original red/yellow logo.
- No ordering, database, admin, customer, or deployment logic was changed.

## v6.0 — dark heading palette and cart typography
- Changed the Grand Café Cart title to the same Manrope UI font used across the site.
- Dark-mode high-emphasis headings now use the signature Grand Café yellow instead of white.
- Hero “Go Grand.” highlight now uses a deeper amber/orange gradient so it remains distinct from the other yellow headings.
- No ordering, database, admin, customer, or deployment logic changed.

## v6.1.0 — Auth and review theme polish
- Added register/login mode classes so auth hero titles can be themed independently.
- Dark register hero title now uses the Grand Café yellow/orange gradient.
- Dark login "Welcome back" hero title now uses a red brand gradient.
- Light auth hero titles use the red brand gradient.
- Sign-in/register form is now a rounded premium card in both themes with improved spacing.
- Fixed Chrome autofill blue input backgrounds in both themes.
- Light-mode review rating buttons no longer use black tiles; inactive stars use warm cream surfaces and selected stars use the red brand treatment.

## v6.2
- Dark-theme customer login hero `Welcome back.` now uses the Grand Café warm yellow/orange gradient.
- Registration hero heading sizing/spacing was adjusted so the final `d` in `remembered.` is not clipped in either theme.
- No auth logic, ordering, admin, MongoDB, or deployment behavior changed.


## v6.3 - Optimized Pizza Product Image
- Converted the supplied pizza photo to a 900×900 WEBP at optimized quality for faster menu loading.
- Added `/assets/pizza-products.webp` (~131 KB) and assigned it to all official pizza products.
- Updated client fallback image to the optimized WEBP.
- Bumped the menu version so existing MongoDB pizza products receive the new image once after deployment.
- Other product/admin images remain untouched.


## v6.4.0 - Designated pizza images
- Replaced the single shared pizza image with 24 distinct product-specific pizza images.
- Converted all generated pizza artwork to 900×900 WebP (quality 80) for faster cards and product modals.
- Updated both MongoDB seed data and the client fallback menu.
- Bumped the official menu image migration so existing MongoDB pizza records receive the designated images once.
- Added `docs/pizza-image-map.json` for exact product-to-image mapping.

## v6.7.0 — Hero highlight and Light Mode typography
- Dark theme: `Go Grand.` in the hero is now Grand Café red.
- Light theme: `Go Grand.` is now white for contrast over the hero image.
- Light theme: regular text previously forced to red is now near-black.
- Main page/section headings remain Grand Café red.
- Selected red controls/buttons keep their existing light text and red backgrounds.
- Red interface icons remain red where they are used as accents.


## v6.8
- Light theme red accents replaced with the supplied warm peach tone, while hero “Hungry?” remains red and “Go Grand.” remains white.
- Product image restored in mobile product popup.
- Hot Deals now show product images, are fully clickable, and open the same product detail/add-on popup as menu items.
- Desktop/laptop scrolling optimized by removing expensive fixed/blurred repaint layers while preserving the visual theme.


## v6.8.1 Hostinger deployment repair
- Fixed an escaped-newline CSS packaging error that could make the Vite build fail during Hostinger dependency installation.
- `postinstall` now only prepares the deployment identity; Hostinger runs `npm run build` in its normal build stage, avoiding duplicate builds during `npm install`.
- Corrected the Light Mode accent to the supplied `#36452A` color while keeping the hero “Hungry?” red.
- Retains mobile product images, clickable Hot Deals popups, and desktop scroll performance changes from v6.8.

## v6.8.2 - Charcoal + Graphite Light Theme

- Replaced the previous olive light-theme accent with a premium charcoal-to-graphite gradient: `#181B1F` → `#292D32`.
- Applied the gradient to light-theme buttons, selected tabs, selected product options, pagination, deal CTAs and other active controls.
- Applied gradient text to major light-theme headings while keeping smaller icons/labels crisp graphite.
- Kept the hero exception unchanged: `Hungry?` remains Grand Café red and `Go Grand.` remains white.
- Dark theme remains unchanged.

## v6.8.3
- Replaced the harsher charcoal/graphite light-theme treatment with a smoother smoked-slate gradient (#20252B → #343B44 → #4A5560 → #68737D).
- Fixed the light-theme navbar/menu labels that were still inheriting red.
- Removed leftover red hover glow from buttons, navigation, tabs, product options, deal buttons and pagination.
- Added neutral slate hover glow and soft grey hover surfaces for inactive controls.

## v6.8.4 — Obsidian Espresso theme polish
- Replaced the light-theme smoked-slate accent with a darker graphite-to-espresso gradient.
- Removed remaining red menu/navigation hover and glow states in light mode, including mobile navigation.
- Changed dark-theme Hot Deal “View deal” buttons to the yellow/orange CTA style.
- Changed dark-theme product-card “View & Add” buttons to the yellow/orange CTA style.
- Changed the same deal/product buttons to the dark gradient in light mode.
- Unified hover and focus glows so light mode uses neutral graphite/espresso shadows instead of red.

## v6.8.5 - Hover and navigation interaction fixes
- Product customizer add-on buttons now keep their original background and text colors on hover in both themes; hover/focus only highlights the border.
- Selected add-ons preserve their selected appearance while hovering, without the old dark/red hover inversion.
- Header navigation no longer keeps a clicked item permanently selected. The pressed style appears only while clicking/tapping and clears on release.
- Light-theme selected menu category cards now retain the graphite/espresso selected gradient on hover and no longer fall back to the legacy red hover style.

## v6.8.6 - Product customizer selection polish
- Added border-only hover/focus feedback to pizza size/variant cards in dark theme, matching the add-on interaction.
- Made selected add-on check marks high-contrast and always visible in both themes.
- Restyled selected size and add-on cards in light mode with a warm amber/espresso tint and border instead of the previous full dark fill.
- Selected size/add-on hover now preserves the selected tint and only strengthens the outline.
