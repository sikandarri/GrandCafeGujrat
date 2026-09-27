import mongoose from 'mongoose';
import seedMenu from './seedMenu.js';

const timestampOptions = {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: false
};


export const defaultSiteSettings = {
  site_id: 'main',
  menu_version: 'grand-cafe-pdf-2026-09-v2-pizza-webp',
  brand_name: 'Grand Café',
  brand_tagline: 'Hungry? Go Grand.',
  hero_eyebrow: "GUJRAT'S GRAND CRAVING",
  hero_title: 'Hungry?',
  hero_highlight: 'Go Grand.',
  hero_description: 'Bold pizza. Loaded burgers. Cold shakes. Late-night coffee. One premium digital home for the full Grand Café experience.',
  phone: '+92 324 7882222',
  whatsapp: '923247882222',
  address: 'Jinnah Road, Gujrat',
  maps_url: 'https://maps.app.goo.gl/HDDGawf6aBHimvtB9?g_st=ac',
  opening_hours: 'Open daily · late night',
  instagram_url: '',
  facebook_url: '',
  logo_url: '/assets/grand-cafe-logo.png',
  hero_image_url: '/assets/grand-cafe-storefront.jpg',
  footer_note: 'Grand Café Gujrat',
  delivery_enabled: true,
  pickup_enabled: true,
  delivery_fee: 0,
  minimum_delivery_order: 0,
  free_delivery_threshold: 0,
  delivery_eta: '35–50 min',
  pickup_eta: '20–30 min',
  pickup_address: 'Jinnah Road, Gujrat'
};

const siteSettingsSchema = new mongoose.Schema({
  site_id: { type: String, required: true, unique: true, default: 'main' },
  menu_version: { type: String, default: '', maxlength: 80 },
  brand_name: { type: String, required: true, trim: true, maxlength: 120 },
  brand_tagline: { type: String, default: '', maxlength: 200 },
  hero_eyebrow: { type: String, default: '', maxlength: 160 },
  hero_title: { type: String, default: '', maxlength: 120 },
  hero_highlight: { type: String, default: '', maxlength: 120 },
  hero_description: { type: String, default: '', maxlength: 700 },
  phone: { type: String, default: '', maxlength: 60 },
  whatsapp: { type: String, default: '', maxlength: 60 },
  address: { type: String, default: '', maxlength: 300 },
  maps_url: { type: String, default: '', maxlength: 700 },
  opening_hours: { type: String, default: '', maxlength: 200 },
  instagram_url: { type: String, default: '', maxlength: 700 },
  facebook_url: { type: String, default: '', maxlength: 700 },
  logo_url: { type: String, default: '/assets/grand-cafe-logo.png', maxlength: 700 },
  hero_image_url: { type: String, default: '/assets/grand-cafe-storefront.jpg', maxlength: 700 },
  footer_note: { type: String, default: '', maxlength: 200 },
  delivery_enabled: { type: Boolean, default: true },
  pickup_enabled: { type: Boolean, default: true },
  delivery_fee: { type: Number, default: 0, min: 0 },
  minimum_delivery_order: { type: Number, default: 0, min: 0 },
  free_delivery_threshold: { type: Number, default: 0, min: 0 },
  delivery_eta: { type: String, default: '35–50 min', maxlength: 80 },
  pickup_eta: { type: String, default: '20–30 min', maxlength: 80 },
  pickup_address: { type: String, default: '', maxlength: 300 }
}, timestampOptions);

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 190 },
  password_hash: { type: String, required: true }
}, timestampOptions);

const deploymentStateSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
  deployment_id: { type: String, required: true, trim: true, maxlength: 120 }
}, timestampOptions);

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 190 },
  phone: { type: String, required: true, trim: true, maxlength: 40 },
  password_hash: { type: String, required: true },
  default_address: { type: String, default: '', maxlength: 500 },
  active: { type: Boolean, default: true }
}, timestampOptions);

const menuItemSchema = new mongoose.Schema({
  category: { type: String, required: true, trim: true, maxlength: 120 },
  name: { type: String, required: true, trim: true, maxlength: 190 },
  description: { type: String, default: '' },
  prices: { type: mongoose.Schema.Types.Mixed, required: true, default: {} },
  badge: { type: String, default: '', maxlength: 80 },
  image_url: { type: String, default: '', maxlength: 500 },
  available: { type: Boolean, default: true, index: true },
  sort_order: { type: Number, default: 0, index: true }
}, timestampOptions);

menuItemSchema.index({ category: 1, sort_order: 1 });

const orderAddonSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 }
}, { _id: false, versionKey: false });

const orderItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  variant: { type: String, required: true },
  base_price: { type: Number, min: 0 },
  addons: { type: [orderAddonSchema], default: [] },
  qty: { type: Number, required: true, min: 1, max: 20 },
  unit_price: { type: Number, required: true, min: 0 },
  line_total: { type: Number, required: true, min: 0 }
}, { _id: false, versionKey: false });

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  at: { type: Date, default: Date.now }
}, { _id: false, versionKey: false });

const orderSchema = new mongoose.Schema({
  order_no: { type: String, required: true, unique: true, index: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null, index: true },
  customer_name: { type: String, required: true, trim: true, maxlength: 120 },
  phone: { type: String, required: true, trim: true, maxlength: 40 },
  order_type: { type: String, enum: ['delivery', 'pickup'], default: 'delivery' },
  address: { type: String, default: '' },
  delivery_area: { type: String, default: '', maxlength: 180 },
  landmark: { type: String, default: '', maxlength: 240 },
  notes: { type: String, default: '' },
  items: { type: [orderItemSchema], required: true },
  subtotal: { type: Number, required: true, min: 0 },
  delivery_fee: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['new', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'],
    default: 'new',
    index: true
  },
  status_history: { type: [statusHistorySchema], default: () => [{ status: 'new', at: new Date() }] }
}, timestampOptions);

const reservationSchema = new mongoose.Schema({
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  phone: { type: String, required: true, trim: true, maxlength: 40 },
  guests: { type: Number, required: true, min: 1, max: 30 },
  reservation_date: { type: String, required: true },
  reservation_time: { type: String, required: true },
  notes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  }
}, timestampOptions);


const reviewSchema = new mongoose.Schema({
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true, index: true },
  order_no: { type: String, required: true, trim: true, maxlength: 40 },
  customer_name: { type: String, required: true, trim: true, maxlength: 120 },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, maxlength: 1200 },
  approved: { type: Boolean, default: false, index: true }
}, timestampOptions);

export const SiteSettings = mongoose.models.SiteSettings || mongoose.model('SiteSettings', siteSettingsSchema);
export const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
export const DeploymentState = mongoose.models.DeploymentState || mongoose.model('DeploymentState', deploymentStateSchema);
export const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
export const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);
export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export const Reservation = mongoose.models.Reservation || mongoose.model('Reservation', reservationSchema);
export const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

const OFFICIAL_MENU_VERSION = 'grand-cafe-pdf-2026-09-v5-complete-webp-product-images';
const officialMenuAliases = {
  'Toronto Pizza (NEW)': ['Toronto Pizza']
};

export async function syncOfficialMenu() {
  for (const [sort_order, item] of seedMenu.entries()) {
    const aliases = officialMenuAliases[item.name] || [];
    let row = await MenuItem.findOne({ name: { $in: [item.name, ...aliases] } });
    if (!row) {
      await MenuItem.create({
        category: item.category,
        name: item.name,
        description: item.description || '',
        prices: item.prices || {},
        badge: item.badge || '',
        image_url: item.image_url || '',
        available: true,
        sort_order
      });
      continue;
    }
    const preservedImage = row.image_url || item.image_url || '';
    const officialBundledImage = (item.image_url?.startsWith('/assets/pizzas/') || item.image_url?.startsWith('/assets/products/')) ? item.image_url : '';
    row.category = item.category;
    row.name = item.name;
    row.description = item.description || '';
    row.prices = item.prices || {};
    row.badge = item.badge || '';
    // v5 migration: place the complete optimized WebP product image set at each exact menu item.
    // This migration runs once per menu version. Admin image edits made afterwards are preserved
    // on normal restarts because syncOfficialMenu() is not rerun until the menu version changes.
    row.image_url = officialBundledImage || preservedImage;
    row.sort_order = sort_order;
    await row.save();
  }
  console.log(`Synchronized ${seedMenu.length} official PDF menu items.`);
}

export async function initDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required. Use a MongoDB Atlas connection string in production.');

  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || undefined,
    serverSelectionTimeoutMS: 15000,
    maxPoolSize: 10
  });

  const settings = await SiteSettings.findOneAndUpdate(
    { site_id: 'main' },
    { $setOnInsert: defaultSiteSettings },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Reset the admin exactly once for each freshly deployed release.
  // Customer accounts, orders, reservations, menu and website settings are preserved.
  const deploymentId = String(process.env.ADMIN_DEPLOYMENT_ID || '').trim();
  if (deploymentId) {
    const state = await DeploymentState.findOne({ key: 'admin-deployment' }).lean();
    if (!state || state.deployment_id !== deploymentId) {
      const removed = await Admin.deleteMany({});
      await DeploymentState.findOneAndUpdate(
        { key: 'admin-deployment' },
        { $set: { deployment_id: deploymentId } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`New deployment detected. Cleared ${removed.deletedCount || 0} previous admin account(s). A new admin must be created.`);
    }
  }

  const count = await MenuItem.countDocuments();
  if (count === 0 || settings.menu_version !== OFFICIAL_MENU_VERSION) {
    await syncOfficialMenu();
    await SiteSettings.updateOne({ site_id: 'main' }, { $set: { menu_version: OFFICIAL_MENU_VERSION } });
  }

  // Migrate only the previous built-in logo path. Custom admin-uploaded logos are preserved.
  await SiteSettings.updateOne(
    { site_id: 'main', $or: [{ logo_url: '/assets/grand-cafe-logo.svg' }, { logo_url: '' }, { logo_url: null }] },
    { $set: { logo_url: '/assets/grand-cafe-logo.png' } }
  );

  console.log(`MongoDB connected: ${mongoose.connection.name}`);
  return mongoose.connection;
}

export async function closeDb() {
  await mongoose.disconnect();
}
