import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { initDb, syncOfficialMenu, Admin, Customer, MenuItem, Order, Reservation, Review, SiteSettings, defaultSiteSettings } from './db.js';
import { requireAdmin, signAdmin, signCustomer, requireCustomer, optionalCustomer } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
// Hostinger Node.js Web Apps expect the production service on port 3000 unless PORT is injected.
// Keep 5000 as the convenient localhost fallback.
const PORT = Number(process.env.PORT || (IS_PRODUCTION ? 3000 : 5000));
const HOST = process.env.HOST || '0.0.0.0';
const uploadDir = process.env.UPLOAD_DIR || path.resolve(__dirname, '../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: IS_PRODUCTION ? (process.env.PUBLIC_ORIGIN || true) : true }));
app.use('/api/', rateLimit({ windowMs: 60_000, limit: 180, standardHeaders: true, legacyHeaders: false }));
app.use('/uploads', express.static(uploadDir, { maxAge: '7d' }));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${crypto.randomBytes(5).toString('hex')}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype))
});

function apiDoc(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  const id = obj._id ? String(obj._id) : obj.id ? String(obj.id) : undefined;
  delete obj._id;
  delete obj.__v;
  return { id, ...obj };
}

function customerToApi(doc) {
  const customer = apiDoc(doc);
  if (!customer) return null;
  delete customer.password_hash;
  return customer;
}

function menuToApi(doc) {
  const item = apiDoc(doc);
  return {
    ...item,
    prices: item?.prices && typeof item.prices === 'object' ? item.prices : {},
    available: Boolean(item?.available)
  };
}

function orderToApi(doc) {
  const order = apiDoc(doc);
  if (!order) return null;
  if (order.customer_id) order.customer_id = String(order.customer_id);
  return order;
}

const cleanEmail = value => String(value || '').trim().toLowerCase();
const cleanPhone = value => String(value || '').replace(/\D/g, '').slice(0, 15);
const phoneDigits = value => cleanPhone(value);
const validPhone = value => /^\d{7,15}$/.test(cleanPhone(value));
const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const toppingPriceForVariant = variant => /^S\b/i.test(variant) ? 100 : /^M\b/i.test(variant) ? 150 : /^L\b/i.test(variant) ? 200 : /^F\b/i.test(variant) ? 250 : 150;
function allowedAddonsForItem(item, variant) {
  const allowed = new Map();
  const category = String(item.category || '');
  const isPizza = category.startsWith('Pizza');
  const canAddTopping = ['Pizza · Regular', 'Pizza · Global', 'Pizza · Premium'].includes(category);

  if (canAddTopping) {
    allowed.set('extra-topping', { id: 'extra-topping', name: `Extra Topping (${variant})`, price: toppingPriceForVariant(variant) });
  }
  if (isPizza) {
    allowed.set('extra-dip', { id: 'extra-dip', name: 'Extra Dip Sauce', price: 100 });
  }

  const drinkCategories = ['Ice Cream Shake','Special Shake','Margarita','Mocktail','Drinks','Coffee','Cold Coffee','Tea','Desserts'];
  if (!drinkCategories.includes(category) && category !== 'Hot Deals') {
    const drinks = [
      ['drink-500ml','500 ML Drink',139],
      ['drink-can','Can',139],
      ['drink-1l','1 Litre Drink',199],
      ['drink-15l','1.5 Litres Drink',239],
      ['water-small','Small Water Bottle',79],
      ['water-large','Large Water Bottle',119]
    ];
    drinks.forEach(([id,name,price]) => allowed.set(id,{id,name,price}));
  }
  return allowed;
}

app.get('/api/health', (_req, res) => res.json({
  ok: true,
  brand: 'Grand Café',
  database: mongoose.connection.readyState === 1 ? 'mongodb-connected' : 'mongodb-disconnected'
}));


app.get('/api/settings', async (_req, res) => {
  try {
    const row = await SiteSettings.findOne({ site_id: 'main' }).lean();
    res.json(row ? apiDoc(row) : defaultSiteSettings);
  } catch (e) {
    console.error(e);
    res.json(defaultSiteSettings);
  }
});

app.get('/api/menu', async (_req, res) => {
  try {
    const rows = await MenuItem.find({ available: true }).sort({ sort_order: 1, _id: 1 }).lean();
    res.json(rows.map(menuToApi));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Menu is temporarily unavailable.' });
  }
});

app.get('/api/reviews', async (_req, res) => {
  try {
    const rows = await Review.find({ approved: true }).sort({ created_at: -1 }).limit(12).lean();
    res.json(rows.map(row => ({
      id: String(row._id),
      customer_name: row.customer_name,
      order_no: row.order_no,
      rating: row.rating,
      comment: row.comment,
      created_at: row.created_at
    })));
  } catch (e) {
    console.error(e);
    res.json([]);
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const customer_name = String(req.body.customer_name || '').trim();
    const rating = Number(req.body.rating || 0);
    const comment = String(req.body.comment || '').trim();
    if (!customer_name || customer_name.length > 120) return res.status(400).json({ message: 'Enter your name.' });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ message: 'Choose a rating from 1 to 5 stars.' });
    if (comment.length < 3 || comment.length > 1200) return res.status(400).json({ message: 'Write a short review.' });
    const row = await Review.create({
      customer_id: new mongoose.Types.ObjectId(),
      order_id: new mongoose.Types.ObjectId(),
      order_no: 'WEBSITE',
      customer_name,
      rating,
      comment,
      approved: false
    });
    res.status(201).json({ ok: true, id: String(row._id), message: 'Review submitted for approval.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Could not submit your review.' });
  }
});

/* Customer accounts */
app.post('/api/auth/register', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = cleanEmail(req.body.email);
    const phone = cleanPhone(req.body.phone);
    const password = String(req.body.password || '');
    if (!name || !validEmail(email) || !validPhone(phone) || password.length < 8) {
      return res.status(400).json({ message: 'Name, valid email, a numeric phone number (7–15 digits) and an 8+ character password are required.' });
    }
    const existing = await Customer.findOne({ email }).lean();
    if (existing) return res.status(409).json({ message: 'An account with this email already exists. Please sign in.' });
    const password_hash = await bcrypt.hash(password, 12);
    const customer = await Customer.create({ name, email, phone, password_hash });
    const user = customerToApi(customer);
    res.status(201).json({ token: signCustomer(user), user });
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ message: 'An account with this email already exists.' });
    console.error(e);
    res.status(500).json({ message: 'Could not create your account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = cleanEmail(req.body.email);
    const password = String(req.body.password || '');
    const customer = await Customer.findOne({ email, active: true });
    if (!customer || !(await bcrypt.compare(password, customer.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const user = customerToApi(customer);
    res.json({ token: signCustomer(user), user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Could not sign you in.' });
  }
});

app.get('/api/auth/me', requireCustomer, async (req, res) => {
  const customer = await Customer.findById(req.customer.id);
  if (!customer || !customer.active) return res.status(401).json({ message: 'Account not available.' });
  res.json({ user: customerToApi(customer) });
});

app.put('/api/auth/profile', requireCustomer, async (req, res) => {
  const name = String(req.body.name || '').trim();
  const phone = cleanPhone(req.body.phone);
  const default_address = String(req.body.default_address || '').trim();
  if (!name || !validPhone(phone)) return res.status(400).json({ message: 'Name and a numeric phone number (7–15 digits) are required.' });
  const customer = await Customer.findByIdAndUpdate(req.customer.id, { name, phone, default_address }, { new: true, runValidators: true });
  if (!customer) return res.status(404).json({ message: 'Account not found.' });
  res.json({ user: customerToApi(customer) });
});

app.get('/api/customer/orders', requireCustomer, async (req, res) => {
  const rows = await Order.find({ customer_id: req.customer.id }).sort({ created_at: -1 }).limit(100).lean();
  res.json(rows.map(orderToApi));
});

app.get('/api/customer/orders/:id', requireCustomer, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Order not found.' });
  const row = await Order.findOne({ _id: req.params.id, customer_id: req.customer.id }).lean();
  if (!row) return res.status(404).json({ message: 'Order not found.' });
  res.json(orderToApi(row));
});

app.patch('/api/customer/orders/:id/cancel', requireCustomer, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Order not found.' });
  const row = await Order.findOne({ _id: req.params.id, customer_id: req.customer.id });
  if (!row) return res.status(404).json({ message: 'Order not found.' });
  if (!['new', 'confirmed'].includes(row.status)) return res.status(400).json({ message: 'This order can no longer be cancelled online.' });
  row.status = 'cancelled';
  row.status_history.push({ status: 'cancelled', at: new Date() });
  await row.save();
  res.json(orderToApi(row));
});

app.get('/api/customer/reviews', requireCustomer, async (req, res) => {
  const rows = await Review.find({ customer_id: req.customer.id }).sort({ created_at: -1 }).lean();
  res.json(rows.map(apiDoc));
});

app.post('/api/customer/reviews', requireCustomer, async (req, res) => {
  try {
    const orderId = String(req.body.order_id || '');
    const rating = Number(req.body.rating || 0);
    const comment = String(req.body.comment || '').trim();
    if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).json({ message: 'Choose a valid completed order.' });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 3) return res.status(400).json({ message: 'Choose 1–5 stars and write a short review.' });
    const order = await Order.findOne({ _id: orderId, customer_id: req.customer.id, status: 'completed' }).lean();
    if (!order) return res.status(400).json({ message: 'Reviews can be submitted only for completed orders.' });
    const existing = await Review.exists({ order_id: order._id });
    if (existing) return res.status(409).json({ message: 'You already reviewed this order.' });
    const customer = await Customer.findById(req.customer.id).lean();
    const row = await Review.create({
      customer_id: req.customer.id,
      order_id: order._id,
      order_no: order.order_no,
      customer_name: customer?.name || order.customer_name,
      rating,
      comment,
      approved: false
    });
    res.status(201).json(apiDoc(row));
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ message: 'You already reviewed this order.' });
    console.error(e);
    res.status(500).json({ message: 'Could not submit your review.' });
  }
});

app.get('/api/orders/track/:orderNo', async (req, res) => {
  const phone = phoneDigits(req.query.phone);
  if (phone.length < 7) return res.status(400).json({ message: 'Enter the phone number used for this order.' });
  const row = await Order.findOne({ order_no: String(req.params.orderNo || '').trim().toUpperCase() }).lean();
  if (!row || phoneDigits(row.phone) !== phone) return res.status(404).json({ message: 'Order not found. Check the order number and phone.' });
  res.json(orderToApi(row));
});

/* Admin authentication and tools */
app.get('/api/admin/status', async (_req, res) => {
  try {
    const count = await Admin.countDocuments();
    res.json({
      hasAdmin: count > 0,
      canCreateAdmin: !IS_PRODUCTION || count === 0,
      environment: IS_PRODUCTION ? 'production' : 'development'
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Could not check admin status.' });
  }
});

app.post('/api/admin/setup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 8) {
      return res.status(400).json({ message: 'Name, email and an 8+ character password are required.' });
    }
    const existingAdmin = await Admin.exists({});
    if (IS_PRODUCTION && existingAdmin) return res.status(403).json({ message: 'Admin setup has already been completed.' });
    if (!IS_PRODUCTION && existingAdmin) await Admin.deleteMany({});
    const normalizedEmail = cleanEmail(email);
    const hash = await bcrypt.hash(password, 12);
    const admin = await Admin.create({ name: String(name).trim(), email: normalizedEmail, password_hash: hash });
    const token = signAdmin({ id: String(admin._id), email: normalizedEmail });
    res.status(201).json({ token, admin: { id: String(admin._id), name: admin.name, email: admin.email } });
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ message: 'An admin account with this email already exists.' });
    console.error(e);
    res.status(500).json({ message: 'Could not create the admin account.' });
  }
});

app.post('/api/admin/login', async (req, res) => {
  const email = cleanEmail(req.body.email);
  const password = String(req.body.password || '');
  const admin = await Admin.findOne({ email });
  if (!admin || !(await bcrypt.compare(password, admin.password_hash))) return res.status(401).json({ message: 'Invalid email or password.' });
  res.json({ token: signAdmin({ id: String(admin._id), email: admin.email }), admin: { id: String(admin._id), name: admin.name, email: admin.email } });
});


app.get('/api/admin/settings', requireAdmin, async (_req, res) => {
  const row = await SiteSettings.findOne({ site_id: 'main' }).lean();
  res.json(row ? apiDoc(row) : defaultSiteSettings);
});

app.put('/api/admin/settings', requireAdmin, async (req, res) => {
  const stringKeys = [
    'brand_name', 'brand_tagline', 'hero_eyebrow', 'hero_title', 'hero_highlight',
    'hero_description', 'phone', 'whatsapp', 'address', 'maps_url', 'opening_hours',
    'instagram_url', 'facebook_url', 'logo_url', 'hero_image_url', 'footer_note',
    'delivery_eta', 'pickup_eta', 'pickup_address'
  ];
  const numberKeys = ['delivery_fee', 'minimum_delivery_order', 'free_delivery_threshold'];
  const booleanKeys = ['delivery_enabled', 'pickup_enabled'];
  const payload = {};
  for (const key of stringKeys) if (Object.prototype.hasOwnProperty.call(req.body, key)) payload[key] = String(req.body[key] ?? '').trim();
  for (const key of numberKeys) if (Object.prototype.hasOwnProperty.call(req.body, key)) payload[key] = Math.max(0, Number(req.body[key] || 0));
  for (const key of booleanKeys) if (Object.prototype.hasOwnProperty.call(req.body, key)) payload[key] = Boolean(req.body[key]);
  if (!payload.brand_name) return res.status(400).json({ message: 'Brand name is required.' });
  const row = await SiteSettings.findOneAndUpdate(
    { site_id: 'main' },
    { $set: payload, $setOnInsert: { site_id: 'main' } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.json(apiDoc(row));
});

app.get('/api/admin/customers', requireAdmin, async (_req, res) => {
  const customers = await Customer.find({}).sort({ created_at: -1 }).limit(500).lean();
  const counts = await Order.aggregate([{ $match: { customer_id: { $ne: null } } }, { $group: { _id: '$customer_id', count: { $sum: 1 }, total_spent: { $sum: '$total' } } }]);
  const byCustomer = new Map(counts.map(x => [String(x._id), x]));
  res.json(customers.map(c => {
    const safe = customerToApi(c);
    const stats = byCustomer.get(String(c._id));
    return { ...safe, order_count: stats?.count || 0, total_spent: stats?.total_spent || 0 };
  }));
});

app.get('/api/admin/menu', requireAdmin, async (_req, res) => {
  let rows = await MenuItem.find({}).sort({ sort_order: 1, _id: 1 }).lean();
  if (!rows.length) {
    await syncOfficialMenu();
    rows = await MenuItem.find({}).sort({ sort_order: 1, _id: 1 }).lean();
  }
  res.json(rows.map(menuToApi));
});

app.post('/api/admin/menu/sync', requireAdmin, async (_req, res) => {
  await syncOfficialMenu();
  const rows = await MenuItem.find({}).sort({ sort_order: 1, _id: 1 }).lean();
  res.json(rows.map(menuToApi));
});

app.post('/api/admin/menu', requireAdmin, async (req, res) => {
  const { category, name, description = '', prices = {}, badge = '', image_url = '', available = true } = req.body;
  if (!category || !name || !prices || typeof prices !== 'object' || Array.isArray(prices)) return res.status(400).json({ message: 'Category, name and prices are required.' });
  const max = await MenuItem.findOne({}).sort({ sort_order: -1 }).select('sort_order').lean();
  const row = await MenuItem.create({ category: String(category).trim(), name: String(name).trim(), description: String(description || ''), prices, badge: String(badge || ''), image_url: String(image_url || ''), available: Boolean(available), sort_order: Number(max?.sort_order || 0) + 1 });
  res.status(201).json(menuToApi(row));
});

app.put('/api/admin/menu/:id', requireAdmin, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Item not found.' });
  const { category, name, description = '', prices = {}, badge = '', image_url = '', available = true } = req.body;
  const row = await MenuItem.findByIdAndUpdate(req.params.id, { category: String(category || '').trim(), name: String(name || '').trim(), description: String(description || ''), prices, badge: String(badge || ''), image_url: String(image_url || ''), available: Boolean(available) }, { new: true, runValidators: true });
  if (!row) return res.status(404).json({ message: 'Item not found.' });
  res.json(menuToApi(row));
});

app.patch('/api/admin/menu/:id/availability', requireAdmin, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Item not found.' });
  const row = await MenuItem.findByIdAndUpdate(req.params.id, { available: Boolean(req.body.available) }, { new: true });
  if (!row) return res.status(404).json({ message: 'Item not found.' });
  res.json({ ok: true });
});

app.delete('/api/admin/menu/:id', requireAdmin, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Item not found.' });
  const row = await MenuItem.findByIdAndDelete(req.params.id);
  if (!row) return res.status(404).json({ message: 'Item not found.' });
  res.json({ ok: true });
});

app.post('/api/admin/upload', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Choose a JPG, PNG, WEBP or GIF image.' });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

app.get('/api/admin/reviews', requireAdmin, async (_req, res) => {
  const rows = await Review.find({}).sort({ created_at: -1 }).limit(500).lean();
  res.json(rows.map(apiDoc));
});

app.post('/api/admin/reviews', requireAdmin, async (req, res) => {
  const customer_name = String(req.body.customer_name || '').trim();
  const rating = Number(req.body.rating || 0);
  const comment = String(req.body.comment || '').trim();
  const approved = req.body.approved !== false;
  if (!customer_name || customer_name.length > 120) return res.status(400).json({ message: 'Customer name is required.' });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ message: 'Choose a rating from 1 to 5 stars.' });
  if (comment.length < 3 || comment.length > 1200) return res.status(400).json({ message: 'Review text is required.' });
  const row = await Review.create({
    customer_id: new mongoose.Types.ObjectId(),
    order_id: new mongoose.Types.ObjectId(),
    order_no: 'ADMIN',
    customer_name,
    rating,
    comment,
    approved
  });
  res.status(201).json(apiDoc(row));
});

app.patch('/api/admin/reviews/:id/approval', requireAdmin, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Review not found.' });
  const row = await Review.findByIdAndUpdate(req.params.id, { approved: Boolean(req.body.approved) }, { new: true, runValidators: true });
  if (!row) return res.status(404).json({ message: 'Review not found.' });
  res.json(apiDoc(row));
});

app.delete('/api/admin/reviews/:id', requireAdmin, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Review not found.' });
  const row = await Review.findByIdAndDelete(req.params.id);
  if (!row) return res.status(404).json({ message: 'Review not found.' });
  res.json({ ok: true });
});

/* Orders */
app.post('/api/orders', optionalCustomer, async (req, res) => {
  try {
    const { order_type = 'delivery', address = '', delivery_area = '', landmark = '', notes = '', items = [] } = req.body;
    let customer_name = String(req.body.customer_name || '').trim();
    let phone = cleanPhone(req.body.phone);
    let customer = null;

    if (req.customer?.id) {
      customer = await Customer.findById(req.customer.id);
      if (customer?.active) {
        customer_name = customer_name || customer.name;
        phone = phone || customer.phone;
      }
    }

    if (!customer_name || !validPhone(phone) || !Array.isArray(items) || !items.length) return res.status(400).json({ message: 'Customer name, a numeric phone number (7–15 digits), and at least one item are required.' });
    const site = await SiteSettings.findOne({ site_id: 'main' }).lean();
    const wantsPickup = order_type === 'pickup';
    if (wantsPickup && site?.pickup_enabled === false) return res.status(400).json({ message: 'Pickup is currently unavailable.' });
    if (!wantsPickup && site?.delivery_enabled === false) return res.status(400).json({ message: 'Delivery is currently unavailable.' });
    if (!wantsPickup && (!String(address).trim() || !String(delivery_area).trim())) return res.status(400).json({ message: 'Delivery area and complete address are required.' });

    const ids = [...new Set(items.map(i => String(i.id || '')).filter(id => mongoose.Types.ObjectId.isValid(id)))];
    if (!ids.length) return res.status(400).json({ message: 'Invalid cart.' });
    const rows = await MenuItem.find({ _id: { $in: ids }, available: true }).lean();
    const byId = new Map(rows.map(r => [String(r._id), r]));
    let subtotal = 0;
    const cleanItems = [];

    for (const line of items) {
      const id = String(line.id || '');
      const row = byId.get(id);
      if (!row) throw new Error('One of the selected menu items is unavailable.');
      const prices = row.prices || {};
      const variant = String(line.variant || Object.keys(prices)[0] || 'Price');
      const basePrice = Number(prices[variant]);
      const qty = Math.max(1, Math.min(20, Number(line.qty || 1)));
      if (!Number.isFinite(basePrice)) throw new Error(`Invalid option for ${row.name}.`);
      const allowedAddons = allowedAddonsForItem(row, variant);
      const requestedIds = [...new Set((Array.isArray(line.addons) ? line.addons : []).map(a => String(a?.id || '')).filter(Boolean))];
      const addons = requestedIds.map(addonId => allowedAddons.get(addonId)).filter(Boolean);
      if (addons.length !== requestedIds.length) throw new Error(`Invalid add-on selected for ${row.name}.`);
      const addonTotal = addons.reduce((sum, addon) => sum + Number(addon.price || 0), 0);
      const unit = basePrice + addonTotal;
      subtotal += unit * qty;
      cleanItems.push({ id, name: row.name, variant, base_price: basePrice, addons, qty, unit_price: unit, line_total: unit * qty });
    }

    const minimumDelivery = Math.max(0, Number(site?.minimum_delivery_order || 0));
    if (!wantsPickup && minimumDelivery > 0 && subtotal < minimumDelivery) return res.status(400).json({ message: `Minimum delivery order is Rs ${minimumDelivery.toLocaleString('en-PK')}.` });
    const configuredFee = Math.max(0, Number(site?.delivery_fee || 0));
    const freeThreshold = Math.max(0, Number(site?.free_delivery_threshold || 0));
    const deliveryFee = wantsPickup ? 0 : (freeThreshold > 0 && subtotal >= freeThreshold ? 0 : configuredFee);
    const total = subtotal + deliveryFee;
    const orderNo = `GC${Date.now().toString().slice(-8)}`;
    const order = await Order.create({
      order_no: orderNo,
      customer_id: customer?._id || null,
      customer_name,
      phone,
      order_type: wantsPickup ? 'pickup' : 'delivery',
      address: wantsPickup ? '' : String(address || '').trim(),
      delivery_area: wantsPickup ? '' : String(delivery_area || '').trim(),
      landmark: wantsPickup ? '' : String(landmark || '').trim(),
      notes: String(notes || '').trim(),
      items: cleanItems,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      status: 'new',
      status_history: [{ status: 'new', at: new Date() }]
    });

    if (customer) {
      const updates = {};
      if (phone && phone !== customer.phone) updates.phone = phone;
      if (!wantsPickup && address && String(address).trim() !== customer.default_address) updates.default_address = String(address).trim();
      if (Object.keys(updates).length) await Customer.findByIdAndUpdate(customer._id, updates);
    }

    res.status(201).json(orderToApi(order));
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message || 'Could not place the order.' });
  }
});

app.get('/api/admin/orders', requireAdmin, async (_req, res) => {
  const rows = await Order.find({}).sort({ created_at: -1 }).limit(200).lean();
  res.json(rows.map(orderToApi));
});

app.patch('/api/admin/orders/:id/status', requireAdmin, async (req, res) => {
  const allowed = ['new', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'];
  const status = String(req.body.status || '');
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status.' });
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Order not found.' });
  const row = await Order.findById(req.params.id);
  if (!row) return res.status(404).json({ message: 'Order not found.' });
  if (row.status !== status) {
    row.status = status;
    row.status_history.push({ status, at: new Date() });
    await row.save();
  }
  res.json(orderToApi(row));
});

/* Reservations */
app.post('/api/reservations', optionalCustomer, async (req, res) => {
  let { name, phone, guests, reservation_date, reservation_time, notes = '' } = req.body;
  let customer = null;
  if (req.customer?.id) {
    customer = await Customer.findById(req.customer.id);
    if (customer?.active) {
      name = name || customer.name;
      phone = phone || customer.phone;
    }
  }
  if (!name || !validPhone(phone) || !guests || !reservation_date || !reservation_time) return res.status(400).json({ message: 'Please complete all reservation fields and use a numeric phone number (7–15 digits).' });
  await Reservation.create({ customer_id: customer?._id || null, name: String(name).trim(), phone: cleanPhone(phone), guests: Math.max(1, Math.min(30, Number(guests))), reservation_date: String(reservation_date), reservation_time: String(reservation_time), notes: String(notes || '').trim() });
  res.status(201).json({ ok: true, message: 'Reservation request received.' });
});

app.get('/api/admin/reservations', requireAdmin, async (_req, res) => {
  const rows = await Reservation.find({}).sort({ reservation_date: -1, reservation_time: -1, created_at: -1 }).limit(200).lean();
  res.json(rows.map(apiDoc));
});

app.patch('/api/admin/reservations/:id/status', requireAdmin, async (req, res) => {
  const allowed = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Invalid status.' });
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Reservation not found.' });
  const row = await Reservation.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!row) return res.status(404).json({ message: 'Reservation not found.' });
  res.json({ ok: true });
});

const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { maxAge: '7d', index: false }));
  app.get(/^(?!\/api\/|\/uploads\/).*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

let dbRetryTimer = null;

async function connectDatabaseWithRetry() {
  try {
    await initDb();
    console.log('Database initialization complete.');
    if (dbRetryTimer) {
      clearTimeout(dbRetryTimer);
      dbRetryTimer = null;
    }
  } catch (err) {
    console.error('MongoDB initialization failed:', err.message);
    // Keep the web process alive so Hostinger can serve the React app and health endpoint.
    // Retry the database connection instead of letting the platform return a generic 503.
    dbRetryTimer = setTimeout(connectDatabaseWithRetry, 15000);
  }
}

async function start() {
  if (IS_PRODUCTION && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
    throw new Error('JWT_SECRET is required in production and should be at least 32 characters.');
  }

  app.listen(PORT, HOST, () => {
    console.log(`Grand Café server listening on http://${HOST}:${PORT}`);
    connectDatabaseWithRetry();
  });
}

start().catch(err => {
  console.error('Server startup failed:', err.message);
  process.exit(1);
});
