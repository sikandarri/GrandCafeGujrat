import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, CalendarDays, Check, CheckCircle2, ChefHat, Clock3, Coffee, Eye, EyeOff,
  Facebook, Flame, History, Instagram, LayoutDashboard, LockKeyhole, LogOut, Mail, MapPin,
  Menu as MenuIcon, MessageCircle, Minus, PackageCheck, Phone, Plus, RefreshCw, Search,
  ShieldCheck, ShoppingBag, Star, Trash2, Truck, Upload, UserPlus, UserRound, Pencil,
  UtensilsCrossed, X, Settings2, Save, Sun, Moon
} from 'lucide-react';
import fallbackMenu from './fallbackMenu.js';
import { CustomerProvider, useCustomer } from './customerAuth.jsx';

const DEFAULT_SITE_SETTINGS = {
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
const SiteSettingsContext = React.createContext(DEFAULT_SITE_SETTINGS);
const useSiteSettings = () => React.useContext(SiteSettingsContext);

const ThemeContext = React.createContext({ theme: 'dark', toggleTheme: () => {} });
const useTheme = () => React.useContext(ThemeContext);

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return localStorage.getItem('gc_theme') === 'light' ? 'light' : 'dark';
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('gc_theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f3efe8' : '#070809');
  }, [theme]);
  const toggleTheme = () => setTheme(value => value === 'dark' ? 'light' : 'dark');
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  return <button type="button" className={`theme-toggle ${compact ? 'compact' : ''}`} onClick={toggleTheme} aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`}>
    {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    {!compact && <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>}
  </button>;
}
const fmt = n => `Rs ${Number(n).toLocaleString('en-PK')}`;
const waNumber = value => String(value || '').replace(/\D/g, '');
const digitsOnly = value => String(value || '').replace(/\D/g, '').slice(0, 15);

async function optimizeImageFile(file, { maxDimension = 1200, quality = 0.82 } = {}) {
  if (!file || !file.type?.startsWith('image/') || file.type === 'image/gif') return file;
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, maxDimension / longest);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', quality));
  if (!blob) return file;
  const base = file.name.replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${base}.webp`, { type: 'image/webp', lastModified: Date.now() });
}

function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);
  useEffect(() => { api('/api/settings').then(data => setSettings({ ...DEFAULT_SITE_SETTINGS, ...data })).catch(() => {}); }, []);
  useEffect(() => { if (typeof document !== 'undefined') document.title = `${settings.brand_name} · ${settings.brand_tagline || 'Official Website'}`; }, [settings.brand_name, settings.brand_tagline]);
  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}

const STATUS_LABELS = {
  new: 'Order received',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for delivery',
  completed: 'Completed',
  cancelled: 'Cancelled'
};
const statusLabel = status => STATUS_LABELS[status] || String(status || '').replaceAll('_', ' ');

function BrandMark({ compact = false }) {
  const settings = useSiteSettings();
  const { theme } = useTheme();
  const configuredLogo = settings.logo_url || DEFAULT_SITE_SETTINGS.logo_url;
  const logoSrc = theme === 'light' && configuredLogo === DEFAULT_SITE_SETTINGS.logo_url
    ? '/assets/grand-cafe-logo-light.png'
    : configuredLogo;
  return <Link className={`brand ${compact ? 'compact' : ''}`} to="/" aria-label={`${settings.brand_name} home`}>
    <img src={logoSrc} alt={settings.brand_name || 'Grand Café'} />
  </Link>;
}

function Header({ cartCount, onCart }) {
  const [open, setOpen] = useState(false);
  const { user, isLoggedIn } = useCustomer();
  const navClick = () => setOpen(false);
  return <header className="site-header">
    <div className="nav-shell">
      <BrandMark />
      <nav className={open ? 'open' : ''}>
        <a href="#menu" onClick={navClick}>Menu</a>
        <a href="#deals" onClick={navClick}>Deals</a>
        <a href="#experience" onClick={navClick}>Experience</a>
        <a href="#reserve" onClick={navClick}>Reserve</a>
        <a href="#visit" onClick={navClick}>Visit</a>
      </nav>
      <div className="nav-actions">
        <ThemeToggle />
        <Link className="account-nav-btn" to={isLoggedIn ? '/account' : '/login'} title={isLoggedIn ? 'My account' : 'Sign in'}>
          <UserRound size={18} />
          <span>{isLoggedIn ? (user?.name?.split(' ')[0] || 'Account') : 'Sign in'}</span>
        </Link>
        <button className="cart-btn" onClick={onCart}><ShoppingBag size={18} /><span>{cartCount}</span></button>
        <button className="mobile-menu" onClick={() => setOpen(v => !v)}>{open ? <X /> : <MenuIcon />}</button>
      </div>
    </div>
  </header>;
}

function Hero({ onExplore }) {
  const settings = useSiteSettings();
  return <section className="hero">
    <div className="hero-photo" style={{ backgroundImage: `url(${settings.hero_image_url || DEFAULT_SITE_SETTINGS.hero_image_url})` }} />
    <div className="hero-overlay" />
    <div className="hero-glow g1" /><div className="hero-glow g2" />
    <div className="hero-content page-shell">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }} className="hero-copy">
        <div className="eyebrow"><Flame size={15} /> {settings.hero_eyebrow}</div>
        <h1>{settings.hero_title}<br /><span>{settings.hero_highlight}</span></h1>
        <p>{settings.hero_description}</p>
        <div className="hero-cta">
          <button className="primary" onClick={onExplore}>Explore Menu <ArrowRight size={18} /></button>
          <a className="secondary" href={`https://wa.me/${waNumber(settings.whatsapp)}`} target="_blank" rel="noreferrer"><MessageCircle size={18} /> WhatsApp Order</a>
        </div>
        <div className="hero-meta"><span><Clock3 /> {settings.opening_hours}</span><span><MapPin /> {settings.address}</span></div>
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: .92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .2, duration: .8 }} className="hero-card">
        <div className="hero-card-top"><span>{settings.brand_name.toUpperCase()} SIGNATURE</span><span className="pulse-dot" /></div>
        <div className="hero-card-title">Pizza • Burgers • Shakes</div>
        <div className="hero-card-grid">
          <div><small>Regular pizza</small><strong>from Rs 599</strong></div>
          <div><small>Burgers</small><strong>from Rs 299</strong></div>
          <div><small>Shakes</small><strong>from Rs 499</strong></div>
          <div><small>Hot deals</small><strong>from Rs 899</strong></div>
        </div>
      </motion.div>
    </div>
  </section>;
}

const MENU_GROUPS = [
  { key: 'all', label: 'All Menu', categories: [], icon: UtensilsCrossed },
  { key: 'pizza', label: 'Pizza', categories: ['Pizza · Regular', 'Pizza · Global', 'Pizza · Premium', 'Pizza · Platinum'], icon: ChefHat },
  { key: 'meals', label: 'Burgers & More', categories: ['Burgers', 'Pasta', 'Wraps & Pocket', 'Sandwich'], icon: Star },
  { key: 'chicken', label: 'Chicken & Sides', categories: ['Roll & Wings', 'Chicken & Fries'], icon: Flame },
  { key: 'cold', label: 'Shakes & Drinks', categories: ['Ice Cream Shake', 'Special Shake', 'Margarita', 'Mocktail', 'Drinks'], icon: ShoppingBag },
  { key: 'coffee', label: 'Coffee & Tea', categories: ['Coffee', 'Cold Coffee', 'Tea'], icon: Coffee },
  { key: 'sweet', label: 'Desserts', categories: ['Desserts'], icon: Star },
  { key: 'deals', label: 'Hot Deals', categories: ['Hot Deals'], icon: Flame }
];
const prettyCategory = category => category.replace('Pizza · ', '');

const FALLBACK_IMAGES = {
  pizza: '/assets/pizzas/grand-cafe-special.webp', burgers: '/assets/burger-feature.jpg', chicken: '/assets/wings-feature.jpg',
  drinks: '/assets/shake-feature.jpg', coffee: '/assets/coffee-feature.jpg'
};
const productImage = item => item.image_url || (item.category?.startsWith('Pizza') ? FALLBACK_IMAGES.pizza : item.category === 'Burgers' ? FALLBACK_IMAGES.burgers : ['Roll & Wings','Chicken & Fries','Wraps & Pocket','Sandwich','Pasta'].includes(item.category) ? FALLBACK_IMAGES.chicken : ['Coffee','Cold Coffee','Tea'].includes(item.category) ? FALLBACK_IMAGES.coffee : FALLBACK_IMAGES.drinks);
const toppingPrice = variant => /^S\b/i.test(variant) ? 100 : /^M\b/i.test(variant) ? 150 : /^L\b/i.test(variant) ? 200 : /^F\b/i.test(variant) ? 250 : 150;
const buildAddonGroups = (item, variant) => {
  const groups = [];
  const category = String(item.category || '');
  const isPizza = category.startsWith('Pizza');
  const canAddTopping = ['Pizza · Regular', 'Pizza · Global', 'Pizza · Premium'].includes(category);
  const drinkCategories = ['Ice Cream Shake','Special Shake','Margarita','Mocktail','Drinks','Coffee','Cold Coffee','Tea','Desserts'];

  if (canAddTopping) {
    groups.push({ label: 'Extra topping', items: [
      { id: 'extra-topping', name: `Extra Topping (${variant})`, price: toppingPrice(variant) }
    ]});
  }
  if (isPizza) {
    groups.push({ label: 'Extra dip', items: [
      { id: 'extra-dip', name: 'Extra Dip Sauce', price: 100 }
    ]});
  }
  if (!drinkCategories.includes(category) && category !== 'Hot Deals') {
    groups.push({ label: 'Add a drink', items: [
      { id: 'drink-500ml', name: '500 ML Drink', price: 139 },
      { id: 'drink-can', name: 'Can', price: 139 },
      { id: 'drink-1l', name: '1 Litre Drink', price: 199 },
      { id: 'drink-15l', name: '1.5 Litres Drink', price: 239 },
      { id: 'water-small', name: 'Small Water Bottle', price: 79 },
      { id: 'water-large', name: 'Large Water Bottle', price: 119 }
    ]});
  }
  return groups;
};

function MenuSection({ menu, onAdd }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 620px)').matches);
  const ITEMS_PER_PAGE = isMobile ? 16 : 20;
  const [group, setGroup] = useState('all');
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const selectedGroup = MENU_GROUPS.find(g => g.key === group) || MENU_GROUPS[0];
  const availableCategories = selectedGroup.categories.filter(c => menu.some(x => x.category === c));
  const filtered = menu.filter(item => {
    const inGroup = group === 'all' || selectedGroup.categories.includes(item.category);
    const inCategory = activeCategory === 'All' || item.category === activeCategory;
    const q = query.trim().toLowerCase();
    const matchesSearch = !q || item.name.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
    return inGroup && inCategory && matchesSearch;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const firstShown = filtered.length ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const lastShown = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);

  useEffect(() => { setPage(1); }, [group, activeCategory, query, ITEMS_PER_PAGE]);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(max-width: 620px)');
    const onChange = event => setIsMobile(event.matches);
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urls = [...new Set(pagedItems.map(productImage).filter(Boolean))];
    const warmCache = () => urls.forEach(src => {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
    });
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(warmCache, { timeout: 900 });
      return () => window.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(warmCache, 180);
    return () => window.clearTimeout(id);
  }, [pagedItems]);
  const chooseGroup = key => { setGroup(key); setActiveCategory('All'); setPage(1); };
  const goPage = next => {
    setPage(next);
    const mobile = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 620px)').matches;
    setTimeout(() => document.getElementById('menu-grid')?.scrollIntoView({ behavior: mobile ? 'auto' : 'smooth', block: 'start' }), 20);
  };

  return <section id="menu" className="menu-section page-shell section-space">
    <div className="section-heading menu-heading"><div><span className="kicker">THE GRAND MENU</span><h2>Find your craving faster.</h2></div><p>Browse a focused selection at a time. Use categories or search, then move through the menu with simple page controls.</p></div>
    <div className="menu-browser">
      <div className="category-groups" role="tablist" aria-label="Menu groups">
        {MENU_GROUPS.map(g => {
          const Icon = g.icon;
          const count = g.key === 'all' ? menu.length : menu.filter(x => g.categories.includes(x.category)).length;
          return <button key={g.key} className={group === g.key ? 'active' : ''} onClick={() => chooseGroup(g.key)} role="tab" aria-selected={group === g.key}>
            <span className="group-icon"><Icon size={18} /></span>
            <span className="group-copy"><strong>{g.label}</strong><small>{count} items</small></span>
          </button>;
        })}
      </div>
      <div className="menu-controls">
        <div className="menu-context"><strong>{selectedGroup.label}</strong><span>{filtered.length} {filtered.length === 1 ? 'item' : 'items'}</span></div>
        <label className="search"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search pizza, burger, shake..." /></label>
      </div>
      {availableCategories.length > 1 && <div className="subcategory-row">
        <button className={activeCategory === 'All' ? 'active' : ''} onClick={() => setActiveCategory('All')}>All {selectedGroup.label}</button>
        {availableCategories.map(c => <button key={c} className={activeCategory === c ? 'active' : ''} onClick={() => setActiveCategory(c)}>{prettyCategory(c)}</button>)}
      </div>}
    </div>
    <div id="menu-grid" className="menu-grid">{pagedItems.map((item, i) => <MenuCard key={item.id} item={item} index={i} onAdd={onAdd} />)}</div>
    {!filtered.length && <div className="empty"><Search size={26} /><strong>No matches found</strong><span>Try another category or a simpler search.</span></div>}
    {filtered.length > 0 && <div className="pagination-wrap">
      <div className="pagination-summary">Showing <strong>{firstShown}–{lastShown}</strong> of {filtered.length}</div>
      {totalPages > 1 && <nav className="pagination" aria-label="Menu pages">
        <button className="page-arrow" disabled={currentPage === 1} onClick={() => goPage(currentPage - 1)} aria-label="Previous page">‹</button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => <button key={n} className={currentPage === n ? 'active' : ''} onClick={() => goPage(n)} aria-current={currentPage === n ? 'page' : undefined}>{n}</button>)}
        <button className="page-arrow" disabled={currentPage === totalPages} onClick={() => goPage(currentPage + 1)} aria-label="Next page">›</button>
      </nav>}
    </div>}
  </section>;
}

function MenuCard({ item, index, onAdd }) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(item.prices || {});
  const fromPrice = Math.min(...entries.map(([,v]) => Number(v)).filter(Number.isFinite));
  const image = productImage(item);
  const openDetails = () => setOpen(true);
  return <>
    <article className="menu-card compact-product" onClick={openDetails} role="button" tabIndex={0} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && openDetails()}>
      <div className="menu-card-image square">
        <img
          src={image}
          alt={item.name}
          width="480"
          height="480"
          loading={index < 4 ? 'eager' : 'lazy'}
          fetchPriority={index < 4 ? 'high' : 'low'}
          decoding="async"
          draggable="false"
        />
        <span className="view-chip">View</span>
      </div>
      <div className="menu-card-body">
        <div className="card-top"><span className="mini-cat">{prettyCategory(item.category)}</span>{item.badge && <span className="badge">{item.badge}</span>}</div>
        <h3>{item.name}</h3>
        <div className="compact-card-bottom"><span>{entries.length > 1 ? 'From ' : ''}<strong>{fmt(fromPrice || entries[0]?.[1] || 0)}</strong></span><button type="button" onClick={e => { e.stopPropagation(); openDetails(); }}><Plus size={15}/> View & Add</button></div>
      </div>
    </article>
    <ProductModal item={item} open={open} onClose={() => setOpen(false)} onAdd={onAdd} />
  </>;
}

function ProductModal({ item, open, onClose, onAdd }) {
  const entries = Object.entries(item.prices || {});
  const [variant, setVariant] = useState(entries[0]?.[0] || 'Price');
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState([]);
  useEffect(() => { if (open) { setVariant(entries[0]?.[0] || 'Price'); setQty(1); setSelected([]); } }, [open, item.id]);
  if (!open) return null;
  const basePrice = Number(item.prices?.[variant] ?? entries[0]?.[1] ?? 0);
  const groups = buildAddonGroups(item, variant);
  const flat = groups.flatMap(g => g.items);
  const selectedAddons = selected.map(id => flat.find(x => x.id === id)).filter(Boolean);
  const addonsTotal = selectedAddons.reduce((sum, x) => sum + Number(x.price || 0), 0);
  const unitTotal = basePrice + addonsTotal;
  const toggleAddon = id => setSelected(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  return <AnimatePresence><motion.div className="product-modal-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <motion.div className="product-modal" initial={{opacity:0,y:30,scale:.97}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:20,scale:.98}}>
      <button className="product-modal-close" onClick={onClose}><X/></button>
      <div className="product-modal-image"><img src={productImage(item)} alt={item.name} width="720" height="720" decoding="async" fetchPriority="high"/></div>
      <div className="product-modal-content">
        <div className="product-modal-scroll">
          <span className="mini-cat">{prettyCategory(item.category)}</span><h2>{item.name}</h2>{item.description && <p className="product-description">{item.description}</p>}
          <div className="product-option-block"><div className="option-title"><strong>Choose option</strong><span>Required</span></div><div className="modal-variants">{entries.map(([k,v]) => <button key={k} className={variant===k?'active':''} onClick={() => {setVariant(k); setSelected([]);}}><span>{k}</span><strong>{fmt(v)}</strong></button>)}</div></div>
          {groups.map(group => <div className="product-option-block" key={group.label}><div className="option-title"><strong>{group.label}</strong><span>Optional</span></div><div className="addon-grid">{group.items.map(a => <button key={a.id} className={selected.includes(a.id)?'selected':''} onClick={() => toggleAddon(a.id)}><span className="addon-check">{selected.includes(a.id)?<Check size={13}/>:<Plus size={13}/>}</span><span><strong>{a.name}</strong><small>+ {fmt(a.price)}</small></span></button>)}</div></div>)}
        </div>
        <div className="product-modal-footer"><div className="modal-qty"><button aria-label="Decrease quantity" onClick={() => setQty(q => Math.max(1,q-1))}><Minus/></button><span>{qty}</span><button aria-label="Increase quantity" onClick={() => setQty(q => Math.min(20,q+1))}><Plus/></button></div><button className="primary add-customized" onClick={() => {onAdd(item, variant, basePrice, selectedAddons, qty); onClose();}}><span>Add to cart</span><strong>{fmt(unitTotal * qty)}</strong></button></div>
      </div>
    </motion.div>
  </motion.div></AnimatePresence>;
}

function Deals({ menu, onAdd }) {
  const deals = menu.filter(x => x.category === 'Hot Deals');
  const [selectedDeal, setSelectedDeal] = useState(null);
  return <>
    <section id="deals" className="deals section-space"><div className="page-shell">
      <div className="section-heading light"><div><span className="kicker">HOT DEALS</span><h2>More Grand. Better value.</h2></div><p>Built for students, families, birthdays and serious appetites.</p></div>
      <div className="deal-grid">{deals.map((d, i) => { const [, p] = Object.entries(d.prices)[0] || ['Price', 0]; return <motion.article whileHover={{ y: -5 }} className={`deal-card d${i % 3}`} key={d.id} role="button" tabIndex={0} onClick={() => setSelectedDeal(d)} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSelectedDeal(d)}>
        <div className="deal-card-image"><img src={productImage(d)} alt={d.name} loading="lazy" decoding="async" /></div>
        <span className="deal-index">0{i + 1}</span>
        <div className="deal-copy"><small>{d.badge}</small><h3>{d.name}</h3><p>{d.description}</p></div>
        <div className="deal-price"><strong>{fmt(p)}</strong><button type="button" onClick={e => { e.stopPropagation(); setSelectedDeal(d); }}>View deal <Plus size={16} /></button></div>
      </motion.article>; })}</div>
    </div></section>
    {selectedDeal && <ProductModal item={selectedDeal} open={Boolean(selectedDeal)} onClose={() => setSelectedDeal(null)} onAdd={onAdd} />}
  </>;
}

function Experience() {
  const settings = useSiteSettings();
  return <section id="experience" className="experience section-space page-shell">
    <div className="experience-image"><img src={settings.hero_image_url || DEFAULT_SITE_SETTINGS.hero_image_url} alt={`${settings.brand_name} storefront`} /><div className="floating-rating"><Star fill="currentColor" /> <strong>Grand energy</strong><small>From day cravings to late-night bites</small></div></div>
    <div className="experience-copy"><span className="kicker">THE EXPERIENCE</span><h2>Built to feel as bold as the food.</h2><p>{settings.brand_name} brings pizza, burgers, shakes, coffee and hangout energy together under one roof.</p>
      <div className="experience-points"><div><UtensilsCrossed /><span><strong>Big menu</strong><small>From stuffed crust pizzas to coffee and desserts.</small></span></div><div><Clock3 /><span><strong>{settings.opening_hours}</strong><small>Designed for cravings that do not end at dinner.</small></span></div><div><MapPin /><span><strong>Easy to find</strong><small>{settings.address}</small></span></div></div>
    </div>
  </section>;
}


function ReviewsSection() {
  const { user } = useCustomer();
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ customer_name: '', rating: 5, comment: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { api('/api/reviews').then(setReviews).catch(() => {}); }, []);
  useEffect(() => { if (user?.name) setForm(f => ({ ...f, customer_name: f.customer_name || user.name })); }, [user]);
  const submit = async e => {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      await api('/api/reviews', { method: 'POST', body: JSON.stringify(form) });
      setMessage('Thank you. Your review was sent for approval.');
      setForm(f => ({ customer_name: user?.name || f.customer_name, rating: 5, comment: '' }));
    } catch (err) { setMessage(err.message); } finally { setBusy(false); }
  };
  return <section className="reviews-section section-space"><div className="page-shell"><div className="section-heading"><div><span className="kicker">CUSTOMER REVIEWS</span><h2>{reviews.length ? 'What guests are saying.' : 'Share your Grand experience.'}</h2></div><p>Reviews are moderated before they appear publicly.</p></div><div className="reviews-layout"><form className="public-review-form" onSubmit={submit}><span className="kicker">LEAVE A REVIEW</span><h3>How was your visit?</h3><label>Your name<input required maxLength="120" placeholder="Your name" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })}/></label><label>Rating<div className="review-stars public-review-picker">{[1,2,3,4,5].map(n => <button type="button" key={n} className={n <= form.rating ? 'active' : ''} onClick={() => setForm({ ...form, rating: n })} aria-label={`${n} star`}><Star fill={n <= form.rating ? 'currentColor' : 'none'}/></button>)}</div></label><label>Your review<textarea required minLength="3" maxLength="1200" rows="4" placeholder="Tell us about the food, service or your overall experience..." value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })}/></label><button className="primary" disabled={busy}>{busy ? 'Submitting...' : 'Submit review'} <ArrowRight size={17}/></button>{message && <div className={`form-msg ${/thank/i.test(message) ? '' : 'error'}`}>{message}</div>}</form><div className="public-review-panel">{reviews.length ? <div className="public-review-grid">{reviews.slice(0,6).map(review => <article className="public-review-card" key={review.id}><div className="public-review-stars">{[1,2,3,4,5].map(n => <Star key={n} size={15} fill={n <= review.rating ? 'currentColor' : 'none'} />)}</div><p>“{review.comment}”</p><div><strong>{review.customer_name}</strong><small>{review.order_no === 'WEBSITE' || review.order_no === 'ADMIN' ? 'Grand Café guest' : review.order_no}</small></div></article>)}</div> : <div className="public-review-empty"><MessageCircle/><h3>No published reviews yet</h3><p>Be the first to share your experience. Your review will appear here after approval.</p></div>}</div></div></div></section>;
}
function Reserve() {
  const settings = useSiteSettings();
  const { user, authHeaders } = useCustomer();
  const [form, setForm] = useState({ name: '', phone: '', guests: 2, reservation_date: '', reservation_time: '', notes: '' });
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { if (user) setForm(f => ({ ...f, name: f.name || user.name || '', phone: f.phone || user.phone || '' })); }, [user]);
  const submit = async e => {
    e.preventDefault(); setBusy(true); setMsg('');
    try {
      await api('/api/reservations', { method: 'POST', headers: authHeaders, body: JSON.stringify(form) });
      setMsg(`Reservation request received. ${settings.brand_name} can confirm it by phone.`);
      setForm(f => ({ ...f, name: user?.name || '', phone: user?.phone || '', notes: '' }));
    } catch (err) { setMsg(err.message); } finally { setBusy(false); }
  };
  return <section id="reserve" className="reserve section-space"><div className="page-shell reserve-grid"><div><span className="kicker">RESERVE A TABLE</span><h2>Your table, your moment.</h2><p>Send a reservation request and the restaurant can confirm availability with you directly.</p><div className="reserve-note"><CalendarDays /><span><strong>Planning a birthday?</strong><small>Ask about the Birthday Special while booking.</small></span></div></div>
    <form onSubmit={submit} className="reserve-form"><div className="two"><input required placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /><input required type="tel" inputMode="numeric" pattern="[0-9]{7,15}" maxLength="15" placeholder="03001234567" value={form.phone} onChange={e => setForm({ ...form, phone: digitsOnly(e.target.value) })} /></div><div className="three"><input required min="1" max="30" type="number" value={form.guests} onChange={e => setForm({ ...form, guests: e.target.value })} /><input required type="date" value={form.reservation_date} onChange={e => setForm({ ...form, reservation_date: e.target.value })} /><input required type="time" value={form.reservation_time} onChange={e => setForm({ ...form, reservation_time: e.target.value })} /></div><textarea rows="3" placeholder="Anything we should know?" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /><button className="primary" disabled={busy}>{busy ? 'Sending...' : 'Request reservation'} <ArrowRight size={18} /></button>{msg && <div className="form-msg">{msg}</div>}</form>
  </div></section>;
}

function Visit() {
  const settings = useSiteSettings();
  return <section id="visit" className="visit section-space page-shell"><div className="visit-card"><div><span className="kicker">VISIT {settings.brand_name.toUpperCase()}</span><h2>{settings.address}</h2><p>{settings.brand_tagline}</p><div className="contact-row"><a href={`tel:${String(settings.phone).replace(/\s/g, '')}`}><Phone /> {settings.phone}</a><a href={settings.maps_url} target="_blank" rel="noreferrer"><MapPin /> Open in Google Maps</a></div></div><a className="map-button" href={settings.maps_url} target="_blank" rel="noreferrer"><MapPin size={28} /><span>Get directions<small>{settings.address}</small></span><ArrowRight /></a></div></section>;
}

function Footer() {
  const settings = useSiteSettings();
  return <footer><div className="page-shell footer-grid"><div><BrandMark compact /><p>{settings.brand_tagline}</p></div><div><strong>Explore</strong><a href="#menu">Menu</a><a href="#deals">Hot Deals</a><a href="#reserve">Reservations</a></div><div><strong>Customer</strong><Link to="/account">My account</Link><Link to="/track">Track an order</Link><Link to="/login">Sign in</Link></div><div><strong>Contact</strong><a href={`tel:${String(settings.phone).replace(/\s/g, '')}`}>{settings.phone}</a><a href={settings.maps_url} target="_blank" rel="noreferrer">{settings.address}</a><span className="socials">{settings.instagram_url && <a href={settings.instagram_url} target="_blank" rel="noreferrer"><Instagram /></a>}{settings.facebook_url && <a href={settings.facebook_url} target="_blank" rel="noreferrer"><Facebook /></a>}</span></div></div><div className="page-shell footer-bottom"><span>© 2026 {settings.footer_note || settings.brand_name}</span><Link to="/admin">Staff access</Link></div></footer>;
}

function OrderTracker({ order, compact = false }) {
  const steps = order.order_type === 'pickup'
    ? ['new', 'confirmed', 'preparing', 'ready', 'completed']
    : ['new', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed'];
  const currentIndex = steps.indexOf(order.status);
  if (order.status === 'cancelled') return <div className="tracking-cancelled"><X size={18} /> This order was cancelled.</div>;
  return <div className={`order-tracker ${compact ? 'compact' : ''}`} style={{gridTemplateColumns:`repeat(${steps.length}, minmax(0, 1fr))`}}>
    {steps.map((step, index) => {
      const done = currentIndex >= index;
      const active = currentIndex === index;
      const label = step === 'ready' && order.order_type === 'pickup' ? 'Ready for pickup' : statusLabel(step);
      return <div className={`track-step ${done ? 'done' : ''} ${active ? 'active' : ''}`} key={step}>
        <span className="track-dot">{done ? <Check size={13} /> : index + 1}</span>
        <span className="track-copy"><strong>{label}</strong>{!compact && <small>{active ? 'Current status' : done ? 'Completed' : 'Next'}</small>}</span>
      </div>;
    })}
  </div>;
}

function CartDrawer({ open, onClose, cart, setCart }) {
  const settings = useSiteSettings();
  const { user, isLoggedIn, token, authHeaders } = useCustomer();
  const [checkout, setCheckout] = useState(false);
  const defaultType = settings.delivery_enabled !== false ? 'delivery' : 'pickup';
  const [form, setForm] = useState({ customer_name: '', phone: '', order_type: defaultType, address: '', delivery_area: '', landmark: '', notes: '' });
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false); const [success, setSuccess] = useState(null);
  const subtotal = cart.reduce((sum, x) => sum + Number(x.price) * x.qty, 0);
  const configuredFee = Math.max(0, Number(settings.delivery_fee || 0));
  const freeThreshold = Math.max(0, Number(settings.free_delivery_threshold || 0));
  const deliveryFee = form.order_type === 'delivery' ? (freeThreshold > 0 && subtotal >= freeThreshold ? 0 : configuredFee) : 0;
  const total = subtotal + deliveryFee;
  const minDelivery = Math.max(0, Number(settings.minimum_delivery_order || 0));
  const deliveryBelowMin = form.order_type === 'delivery' && minDelivery > 0 && subtotal < minDelivery;
  useEffect(() => { if (user) setForm(f => ({ ...f, customer_name: user.name || '', phone: digitsOnly(user.phone || ''), address: f.address || user.default_address || '' })); }, [user]);
  useEffect(() => { if (settings.delivery_enabled === false && form.order_type === 'delivery') setForm(f => ({...f, order_type:'pickup'})); if (settings.pickup_enabled === false && form.order_type === 'pickup') setForm(f => ({...f, order_type:'delivery'})); }, [settings.delivery_enabled, settings.pickup_enabled]);
  useEffect(() => { if (!open) { setCheckout(false); setMsg(''); setSuccess(null); } }, [open]);
  const change = (idx, delta) => setCart(c => c.map((x, i) => i === idx ? { ...x, qty: Math.max(1, x.qty + delta) } : x));
  const remove = idx => setCart(c => c.filter((_,i) => i !== idx));
  const place = async e => {
    e.preventDefault(); setBusy(true); setMsg('');
    if (deliveryBelowMin) { setBusy(false); return setMsg(`Minimum delivery order is ${fmt(minDelivery)}.`); }
    try {
      const result = await api('/api/orders', { method: 'POST', headers: token ? authHeaders : {}, body: JSON.stringify({ ...form, items: cart.map(x => ({ id: x.id, variant: x.variant, qty: x.qty, addons: (x.addons || []).map(a => ({ id: a.id })) })) }) });
      setSuccess(result); setCart([]);
    } catch (err) { setMsg(err.message); } finally { setBusy(false); }
  };
  return <AnimatePresence>{open && <><motion.div className="drawer-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} /><motion.aside className="cart-drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 260 }}>
    <div className="drawer-head"><div><small>YOUR ORDER</small><h2>{success ? 'Order placed' : checkout ? 'Checkout' : `${settings.brand_name} Cart`}</h2></div><button onClick={onClose}><X /></button></div>
    {success ? <div className="checkout-success"><span className="success-icon"><CheckCircle2 /></span><h3>We received your order.</h3><p><strong>{success.order_no}</strong> · {fmt(success.total)}</p><p className="muted-copy">{success.order_type === 'delivery' ? `Delivery tracking is active. Estimated time: ${settings.delivery_eta}.` : `Pickup tracking is active. Estimated time: ${settings.pickup_eta}.`}</p>{isLoggedIn ? <Link className="primary full" to="/account" onClick={onClose}><PackageCheck size={18} /> Track in My Account</Link> : <Link className="primary full" to={`/track?order=${encodeURIComponent(success.order_no)}&phone=${encodeURIComponent(form.phone)}`} onClick={onClose}><PackageCheck size={18} /> Track this order</Link>}<button className="secondary full" onClick={onClose}>Continue browsing</button></div>
      : !checkout ? <><div className="cart-lines">{cart.length === 0 ? <div className="cart-empty"><ShoppingBag size={44} /><h3>Your cart is empty</h3><p>Pick something from the menu.</p></div> : cart.map((x, i) => <div className="cart-line" key={x.cartKey || `${x.id}-${x.variant}-${i}`}><div className="cart-line-copy"><strong>{x.name}</strong><small>{x.variant} · {fmt(x.price)} each</small>{x.addons?.length > 0 && <em>{x.addons.map(a => a.name).join(' · ')}</em>}</div><div className="cart-line-actions"><div className="qty"><button onClick={() => change(i, -1)}><Minus /></button><span>{x.qty}</span><button onClick={() => change(i, 1)}><Plus /></button></div><button className="remove-line" onClick={() => remove(i)}><Trash2 size={15}/></button></div></div>)}</div>{cart.length > 0 && <div className="cart-summary"><div><span>Subtotal</span><strong>{fmt(subtotal)}</strong></div><button className="primary full" onClick={() => setCheckout(true)}>Choose delivery or pickup <ArrowRight /></button></div>}</>
        : <form onSubmit={place} className="checkout-form"><button type="button" className="back-link" onClick={() => setCheckout(false)}>← Back to cart</button>{isLoggedIn ? <div className="checkout-account"><UserRound /><span><small>ORDERING AS</small><strong>{user?.name}</strong><em>Saved to your order history</em></span></div> : <div className="guest-account-note"><UserPlus /><span><strong>Want order history and live tracking?</strong><small><Link to="/register" onClick={onClose}>Create an account</Link> or <Link to="/login" onClick={onClose}>sign in</Link> before ordering.</small></span></div>}
          <div className="fulfilment-picker">{settings.delivery_enabled !== false && <button type="button" className={form.order_type === 'delivery' ? 'active' : ''} onClick={() => setForm({ ...form, order_type: 'delivery' })}><Truck/><span><strong>Delivery</strong><small>{settings.delivery_eta}{configuredFee > 0 ? ` · ${fmt(configuredFee)} fee` : ' · no delivery fee configured'}</small></span></button>}{settings.pickup_enabled !== false && <button type="button" className={form.order_type === 'pickup' ? 'active' : ''} onClick={() => setForm({ ...form, order_type: 'pickup' })}><ShoppingBag/><span><strong>Pickup</strong><small>{settings.pickup_eta} · no delivery fee</small></span></button>}</div>
          <input required placeholder="Your name" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} /><input required type="tel" inputMode="numeric" pattern="[0-9]{7,15}" maxLength="15" placeholder="03001234567" value={form.phone} onChange={e => setForm({ ...form, phone: digitsOnly(e.target.value) })} />
          {form.order_type === 'delivery' ? <div className="delivery-fields"><div className="delivery-info"><Truck/><span><strong>Deliver to your address</strong><small>We will use these details for dispatch and order tracking.</small></span></div><input required placeholder="Area / locality (e.g. Model Town, Jinnah Road)" value={form.delivery_area} onChange={e => setForm({ ...form, delivery_area: e.target.value })} /><textarea required rows="3" placeholder="Complete delivery address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /><input placeholder="Nearby landmark (optional)" value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })} />{deliveryBelowMin && <div className="delivery-warning">Minimum delivery order is {fmt(minDelivery)}. Add {fmt(minDelivery-subtotal)} more.</div>}</div> : <div className="pickup-box"><MapPin/><span><strong>Pickup from {settings.brand_name}</strong><small>{settings.pickup_address || settings.address}</small><em>Estimated ready time: {settings.pickup_eta}</em></span></div>}
          <textarea className="order-notes-field" rows="5" placeholder={form.order_type === 'delivery' ? 'Delivery instructions / order notes (optional)' : 'Pickup notes (optional)'} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          <div className="checkout-breakdown"><div><span>Subtotal</span><strong>{fmt(subtotal)}</strong></div>{form.order_type === 'delivery' && <div><span>Delivery fee</span><strong>{deliveryFee ? fmt(deliveryFee) : 'Free'}</strong></div>}<div className="grand-total"><span>Total</span><strong>{fmt(total)}</strong></div></div>
          <button disabled={busy || !cart.length || deliveryBelowMin} className="primary full">{busy ? 'Placing order...' : form.order_type === 'delivery' ? 'Place delivery order' : 'Place pickup order'} <ArrowRight /></button>{msg && <div className="form-msg error">{msg}</div>}</form>}
  </motion.aside></>}</AnimatePresence>;
}

function Home() {
  const [menu, setMenu] = useState(fallbackMenu); const [cart, setCart] = useState([]); const [cartOpen, setCartOpen] = useState(false);
  useEffect(() => { api('/api/menu').then(setMenu).catch(() => {}); }, []);
  const add = (item, variant, basePrice, addons = [], qty = 1) => { const addonTotal = addons.reduce((sum,a) => sum + Number(a.price || 0), 0); const price = Number(basePrice) + addonTotal; const addonKey = addons.map(a => a.id).sort().join(','); const cartKey = `${item.id}|${variant}|${addonKey}`; setCart(c => { const idx = c.findIndex(x => x.cartKey === cartKey); if (idx >= 0) return c.map((x, i) => i === idx ? { ...x, qty: x.qty + qty } : x); return [...c, { cartKey, id: item.id, name: item.name, variant, base_price: Number(basePrice), addons, price, qty }]; }); setCartOpen(true); };
  const count = cart.reduce((s, x) => s + x.qty, 0);
  return <><Header cartCount={count} onCart={() => setCartOpen(true)} /><main><Hero onExplore={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })} /><MenuSection menu={menu} onAdd={add} /><Deals menu={menu} onAdd={add} /><Experience /><ReviewsSection /><Reserve /><Visit /></main><Footer /><CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} setCart={setCart} /></>;
}

function CustomerAuthPage({ mode }) {
  const settings = useSiteSettings();
  const registerMode = mode === 'register';
  const { register, login, isLoggedIn } = useCustomer();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  if (isLoggedIn) return <Navigate to="/account" replace />;
  const submit = async e => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      if (registerMode) await register(form); else await login({ email: form.email, password: form.password });
      navigate(location.state?.from || '/account', { replace: true });
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <div className={`customer-auth-page ${registerMode ? 'register-mode' : 'login-mode'}`}>
    <div className="customer-auth-brand"><BrandMark /><div><span className="kicker">{settings.brand_name.toUpperCase()} ACCOUNT</span><h1>{registerMode ? 'Your cravings, remembered.' : 'Welcome back.'}</h1><p>{registerMode ? 'Create an account to keep your order history, save delivery details and track every order live.' : 'Sign in to reorder faster and see exactly where your current order is.'}</p><div className="auth-benefits"><span><History /> Order history</span><span><Truck /> Live order tracking</span><span><ShieldCheck /> Secure account</span></div></div></div>
    <form className="customer-auth-card" onSubmit={submit}><Link className="auth-home-link" to="/">← Back to {settings.brand_name}</Link><span className="kicker">{registerMode ? 'NEW CUSTOMER' : 'CUSTOMER LOGIN'}</span><h2>{registerMode ? 'Create your account' : 'Sign in'}</h2>{registerMode && <><label>Full name<input required autoComplete="name" placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label><label>Phone / WhatsApp<input required type="tel" inputMode="numeric" pattern="[0-9]{7,15}" maxLength="15" autoComplete="tel" placeholder="03001234567" value={form.phone} onChange={e => setForm({ ...form, phone: digitsOnly(e.target.value) })} /></label></>}<label>Email address<div className="input-icon"><Mail /><input required type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div></label><label>Password<div className="input-icon"><LockKeyhole /><input required minLength="8" type="password" autoComplete={registerMode ? 'new-password' : 'current-password'} placeholder="At least 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div></label><button className="primary full" disabled={busy}>{busy ? 'Please wait...' : registerMode ? 'Create account' : 'Sign in'} <ArrowRight /></button>{error && <div className="form-msg error">{error}</div>}<p className="auth-switch">{registerMode ? 'Already registered?' : `New to ${settings.brand_name}?`} <Link to={registerMode ? '/login' : '/register'}>{registerMode ? 'Sign in' : 'Create an account'}</Link></p></form>
  </div>;
}

function AccountOrderCard({ order, onCancelled, review, onReviewed }) {
  const { authHeaders } = useCustomer();
  const [busy, setBusy] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const canCancel = ['new', 'confirmed'].includes(order.status);
  const canReview = order.status === 'completed' && !review;
  const cancel = async () => {
    if (!confirm(`Cancel order ${order.order_no}?`)) return;
    setBusy(true); setError('');
    try { const updated = await api(`/api/customer/orders/${order.id}/cancel`, { method: 'PATCH', headers: authHeaders, body: '{}' }); onCancelled(updated); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const submitReview = async e => {
    e.preventDefault(); setReviewBusy(true); setError('');
    try {
      const saved = await api('/api/customer/reviews', { method: 'POST', headers: authHeaders, body: JSON.stringify({ order_id: order.id, rating, comment }) });
      onReviewed(saved); setReviewOpen(false); setComment('');
    } catch (err) { setError(err.message); } finally { setReviewBusy(false); }
  };
  return <article className="account-order-card">
    <div className="account-order-head"><div><span className="order-number">{order.order_no}</span><h3>{new Date(order.created_at).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}</h3><small>{order.order_type === 'delivery' ? 'Delivery order' : 'Pickup order'}</small></div><span className={`status-pill status-${order.status}`}>{statusLabel(order.status)}</span></div>
    <OrderTracker order={order} />
    <div className="account-order-items">{order.items.map((item, i) => <div key={`${item.id}-${i}`}><span><strong>{item.qty}×</strong> {item.name}<small>{item.variant}{item.addons?.length ? ` · ${item.addons.map(a => a.name).join(' · ')}` : ''}</small></span><b>{fmt(item.line_total)}</b></div>)}</div>
    {order.address && <p className="account-order-address"><MapPin /> <span>{order.delivery_area && <strong>{order.delivery_area}</strong>}{order.address}{order.landmark && <small>Landmark: {order.landmark}</small>}</span></p>}
    <div className="account-order-foot"><div><small>Total</small><strong>{fmt(order.total)}</strong></div><div className="account-order-actions">{canReview && <button className="secondary review-order-btn" onClick={() => setReviewOpen(v => !v)}><Star size={15}/> Review order</button>}{canCancel && <button className="soft-danger" disabled={busy} onClick={cancel}>{busy ? 'Cancelling...' : 'Cancel order'}</button>}</div></div>
    {review && <div className="submitted-review"><div>{[1,2,3,4,5].map(n => <Star key={n} size={14} fill={n <= review.rating ? 'currentColor' : 'none'} />)}</div><p>{review.comment}</p><small>{review.approved ? 'Published on website' : 'Waiting for approval'}</small></div>}
    {reviewOpen && <form className="order-review-form" onSubmit={submitReview}><strong>How was your order?</strong><div className="review-stars">{[1,2,3,4,5].map(n => <button type="button" key={n} className={n <= rating ? 'active' : ''} onClick={() => setRating(n)} aria-label={`${n} star`}><Star fill={n <= rating ? 'currentColor' : 'none'} /></button>)}</div><textarea required minLength="3" maxLength="1200" rows="3" placeholder="Tell us about the food and service..." value={comment} onChange={e => setComment(e.target.value)} /><button className="primary" disabled={reviewBusy}>{reviewBusy ? 'Submitting...' : 'Submit review'}</button></form>}
    {error && <div className="form-msg error">{error}</div>}
  </article>;
}

function AccountPage() {
  const settings = useSiteSettings();
  const { user, loading, isLoggedIn, logout, token, authHeaders, updateProfile } = useCustomer();
  const [orders, setOrders] = useState([]); const [reviews, setReviews] = useState([]); const [busy, setBusy] = useState(true); const [error, setError] = useState(''); const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({ name: '', phone: '', default_address: '' });
  useEffect(() => { if (user) setProfile({ name: user.name || '', phone: digitsOnly(user.phone || ''), default_address: user.default_address || '' }); }, [user]);
  const loadOrders = async (quiet = false) => {
    if (!token) return;
    if (!quiet) setBusy(true);
    try { const [orderRows, reviewRows] = await Promise.all([api('/api/customer/orders', { headers: authHeaders }), api('/api/customer/reviews', { headers: authHeaders })]); setOrders(orderRows); setReviews(reviewRows); setError(''); }
    catch (err) { setError(err.message); }
    finally { if (!quiet) setBusy(false); }
  };
  useEffect(() => { if (token) loadOrders(); }, [token]);
  useEffect(() => { if (!token) return undefined; const timer = setInterval(() => loadOrders(true), 20000); return () => clearInterval(timer); }, [token]);
  if (loading) return <div className="customer-page-loading">Loading your {settings.brand_name} account...</div>;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/account' }} />;
  const saveProfile = async e => { e.preventDefault(); try { await updateProfile(profile); setEditing(false); } catch (err) { setError(err.message); } };
  const updateCancelled = updated => setOrders(list => list.map(o => o.id === updated.id ? updated : o));
  const addReview = saved => setReviews(list => [saved, ...list]);
  return <div className="account-page">
    <header className="account-header page-shell"><BrandMark compact /><div><ThemeToggle compact /><Link to="/">Back to menu</Link><button onClick={logout}><LogOut size={16} /> Sign out</button></div></header>
    <main className="page-shell account-main">
      <section className="account-welcome"><div><span className="kicker">MY {settings.brand_name.toUpperCase()}</span><h1>Hi, {user?.name?.split(' ')[0]}.</h1><p>Your orders, live status and saved details are all here.</p></div><button className="refresh-btn" onClick={() => loadOrders()}><RefreshCw size={16} /> Refresh orders</button></section>
      <div className="account-layout">
        <aside className="profile-card"><div className="profile-avatar"><UserRound /></div><h3>{user?.name}</h3><p>{user?.email}</p><span>{user?.phone}</span>{user?.default_address && <small><MapPin /> {user.default_address}</small>}<button className="secondary full" onClick={() => setEditing(v => !v)}>{editing ? 'Close' : 'Edit profile'}</button>{editing && <form className="profile-form" onSubmit={saveProfile}><input required value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="Name" /><input required type="tel" inputMode="numeric" pattern="[0-9]{7,15}" maxLength="15" value={profile.phone} onChange={e => setProfile({ ...profile, phone: digitsOnly(e.target.value) })} placeholder="03001234567" /><textarea rows="3" value={profile.default_address} onChange={e => setProfile({ ...profile, default_address: e.target.value })} placeholder="Default delivery address" /><button className="primary full">Save details</button></form>}<div className="profile-security"><ShieldCheck /><span><strong>Secure account</strong><small>Your password is stored as a protected hash.</small></span></div></aside>
        <section className="orders-panel"><div className="orders-panel-head"><div><span className="kicker">ORDER HISTORY</span><h2>{orders.length ? `${orders.length} order${orders.length === 1 ? '' : 's'}` : 'Your orders'}</h2></div><span className="live-refresh"><i /> Live status refresh</span></div>{error && <div className="form-msg error">{error}</div>}{busy ? <div className="account-empty">Loading orders...</div> : orders.length ? orders.map(order => <AccountOrderCard key={order.id} order={order} onCancelled={updateCancelled} review={reviews.find(r => r.order_id === order.id)} onReviewed={addReview} />) : <div className="account-empty"><ShoppingBag /><h3>No orders yet</h3><p>Your next online order will automatically appear here.</p><Link className="primary" to="/#menu">Explore the menu</Link></div>}</section>
      </div>
    </main>
  </div>;
}

function TrackOrderPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [orderNo, setOrderNo] = useState(params.get('order') || '');
  const [phone, setPhone] = useState(params.get('phone') || '');
  const [order, setOrder] = useState(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const lookup = async e => {
    e?.preventDefault(); setBusy(true); setError('');
    try { setOrder(await api(`/api/orders/track/${encodeURIComponent(orderNo.trim())}?phone=${encodeURIComponent(phone.trim())}`)); }
    catch (err) { setOrder(null); setError(err.message); } finally { setBusy(false); }
  };
  useEffect(() => { if (orderNo && phone) lookup(); }, []);
  return <div className="track-page"><header className="account-header page-shell"><BrandMark compact /><div><ThemeToggle compact /><Link to="/">Back to menu</Link><Link to="/login">Customer sign in</Link></div></header><main className="track-shell"><div className="track-intro"><span className="kicker">ORDER TRACKING</span><h1>Where is my order?</h1><p>Enter the order number and the same phone number used at checkout.</p></div><form className="track-form" onSubmit={lookup}><label>Order number<input required placeholder="GC12345678" value={orderNo} onChange={e => setOrderNo(e.target.value.toUpperCase())} /></label><label>Phone number<input required type="tel" inputMode="numeric" pattern="[0-9]{7,15}" maxLength="15" placeholder="03001234567" value={phone} onChange={e => setPhone(digitsOnly(e.target.value))} /></label><button className="primary" disabled={busy}>{busy ? 'Checking...' : 'Track order'} <PackageCheck size={18} /></button></form>{error && <div className="form-msg error">{error}</div>}{order && <article className="public-track-card"><div className="public-track-head"><div><small>ORDER</small><h2>{order.order_no}</h2><span>{order.order_type} · {fmt(order.total)}</span></div><span className={`status-pill status-${order.status}`}>{statusLabel(order.status)}</span></div><OrderTracker order={order} /><div className="account-order-items">{order.items.map((item, i) => <div key={i}><span><strong>{item.qty}×</strong> {item.name}<small>{item.variant}{item.addons?.length ? ` · ${item.addons.map(a => a.name).join(' · ')}` : ''}</small></span><b>{fmt(item.line_total)}</b></div>)}</div><button className="secondary" onClick={() => lookup()}><RefreshCw size={16} /> Refresh status</button></article>}</main></div>;
}

function AuthCard({ hasAdmin, canCreateAdmin, onAuth }) {
  const [setup, setSetup] = useState(Boolean(canCreateAdmin)); const [form, setForm] = useState({ name: '', email: '', password: '' }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async e => { e.preventDefault(); setBusy(true); setErr(''); try { const data = await api(setup ? '/api/admin/setup' : '/api/admin/login', { method: 'POST', body: JSON.stringify(form) }); localStorage.setItem('gc_admin_token', data.token); onAuth(data.token); } catch (error) { setErr(error.message); } finally { setBusy(false); } };
  return <div className="admin-auth"><div className="auth-art"><BrandMark /><h1>Grand Café<br />Control Room</h1><p>Manage the menu, orders, availability and reservation requests from one place.</p></div><form onSubmit={submit} className="auth-card"><span className="kicker">{setup ? 'ADMIN SETUP' : 'STAFF ACCESS'}</span><h2>{setup ? (hasAdmin ? 'Create a new admin' : 'Create admin for this deployment') : 'Welcome back'}</h2>{setup && hasAdmin && <div className="form-msg setup-note">Creating a new admin replaces the current administrator for this deployment.</div>}{setup && <input required placeholder="Admin name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />}<input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /><input required minLength="8" type="password" placeholder="Password (8+ characters)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /><button disabled={busy} className="primary full">{busy ? 'Please wait...' : setup ? 'Create admin' : 'Sign in'} <ArrowRight /></button>{err && <div className="form-msg error">{err}</div>}{hasAdmin && <button type="button" className="text-btn" onClick={() => { setSetup(!setup); setErr(''); }}>{setup ? 'Use existing admin login' : 'Create a new admin'}</button>}</form></div>;
}

function Admin() {
  const [token, setToken] = useState(localStorage.getItem('gc_admin_token') || '');
  const [adminStatus, setAdminStatus] = useState(null);
  const [tab, setTab] = useState('menu');
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SITE_SETTINGS);
  const nav = useNavigate();
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  useEffect(() => { api('/api/admin/status').then(setAdminStatus).catch(() => setAdminStatus({ hasAdmin: true, canCreateAdmin: false })); }, []);
  const load = async () => {
    if (!token) return;
    const jobs = [
      ['/api/admin/menu', data => setItems(Array.isArray(data) ? data : [])],
      ['/api/admin/orders', data => setOrders(Array.isArray(data) ? data : [])],
      ['/api/admin/customers', data => setCustomers(Array.isArray(data) ? data : [])],
      ['/api/admin/reservations', data => setReservations(Array.isArray(data) ? data : [])],
      ['/api/admin/reviews', data => setReviews(Array.isArray(data) ? data : [])],
      ['/api/admin/settings', data => setSiteSettings({ ...DEFAULT_SITE_SETTINGS, ...data })]
    ];
    const results = await Promise.allSettled(jobs.map(([path]) => api(path, { headers: authHeaders })));
    let authFailed = false;
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') jobs[index][1](result.value);
      else {
        console.error(`Admin load failed for ${jobs[index][0]}:`, result.reason);
        if (/auth|session|token/i.test(result.reason?.message || '')) authFailed = true;
      }
    });
    if (authFailed) { localStorage.removeItem('gc_admin_token'); setToken(''); }
  };
  useEffect(() => { load(); }, [token]);
  if (adminStatus === null) return <div className="admin-loading"><div className="grand-loader"><div className="grand-loader-glow"/><BrandMark compact/><span className="kicker">GRAND CAFÉ CONTROL ROOM</span><h2>Preparing your dashboard</h2><div className="grand-loader-track"><i/></div><p>Loading menu, orders and settings…</p></div></div>;
  if (!token) return <AuthCard hasAdmin={adminStatus.hasAdmin} canCreateAdmin={adminStatus.canCreateAdmin} onAuth={t => { setToken(t); setAdminStatus(v => ({ ...v, hasAdmin: true })); }} />;
  const logout = () => { localStorage.removeItem('gc_admin_token'); setToken(''); };
  return <div className="admin-layout">
    <aside className="admin-sidebar">
      <BrandMark compact />
      <div className="admin-nav">
        <button className={tab === 'menu' ? 'active' : ''} onClick={() => setTab('menu')}><UtensilsCrossed /> Menu</button>
        <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}><ShoppingBag /> Orders <span>{orders.filter(x => x.status === 'new').length}</span></button>
        <button className={tab === 'customers' ? 'active' : ''} onClick={() => setTab('customers')}><UserRound /> Customers</button>
        <button className={tab === 'reserve' ? 'active' : ''} onClick={() => setTab('reserve')}><CalendarDays /> Reservations</button>
        <button className={tab === 'reviews' ? 'active' : ''} onClick={() => setTab('reviews')}><MessageCircle /> Reviews {reviews.some(x => !x.approved) && <span>{reviews.filter(x => !x.approved).length}</span>}</button>
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}><Settings2 /> Website settings</button>
      </div>
      <div className="sidebar-bottom"><ThemeToggle /><a href="/"><Eye /> View site</a><button onClick={logout}><LogOut /> Sign out</button></div>
    </aside>
    <main className="admin-main">
      {tab === 'menu' && <AdminMenu items={items} setItems={setItems} token={token} />}
      {tab === 'orders' && <AdminOrders orders={orders} setOrders={setOrders} token={token} />}
      {tab === 'customers' && <AdminCustomers customers={customers} />}
      {tab === 'reserve' && <AdminReservations rows={reservations} setRows={setReservations} token={token} />}
      {tab === 'reviews' && <AdminReviews reviews={reviews} setReviews={setReviews} token={token} />}
      {tab === 'settings' && <AdminSettings settings={siteSettings} setSettings={setSiteSettings} token={token} />}
    </main>
  </div>;
}

function AdminSettings({ settings, setSettings, token }) {
  const [form, setForm] = useState({ ...DEFAULT_SITE_SETTINGS, ...settings });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { setForm({ ...DEFAULT_SITE_SETTINGS, ...settings }); }, [settings]);
  const headers = { Authorization: `Bearer ${token}` };
  const change = (key, value) => setForm(v => ({ ...v, [key]: value }));
  const upload = async (file, key) => {
    const optimized = await optimizeImageFile(file, { maxDimension: key === 'hero_image_url' ? 1600 : 1000, quality: key === 'hero_image_url' ? 0.84 : 0.86 });
    const fd = new FormData(); fd.append('image', optimized);
    const res = await fetch('/api/admin/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed');
    change(key, data.url);
  };
  const save = async e => {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      const saved = await api('/api/admin/settings', { method: 'PUT', headers, body: JSON.stringify(form) });
      setSettings({ ...DEFAULT_SITE_SETTINGS, ...saved });
      setMessage('Website settings saved. Refresh the public site to see every change.');
    } catch (err) { setMessage(err.message); } finally { setBusy(false); }
  };
  return <div className="settings-admin">
    <div className="admin-head"><div><span className="kicker">WEBSITE CONTROL</span><h1>Brand & website settings</h1><p>Change the public website identity, contact details, directions and hero content without editing code.</p></div></div>
    <form className="settings-form" onSubmit={save}>
      <section className="settings-panel"><div className="settings-panel-title"><span>01</span><div><h3>Brand identity</h3><p>Name, tagline and visual assets.</p></div></div><div className="settings-fields two-col">
        <label>Brand name<input required value={form.brand_name} onChange={e => change('brand_name', e.target.value)} /></label>
        <label>Brand tagline<input value={form.brand_tagline} onChange={e => change('brand_tagline', e.target.value)} /></label>
        <label>Logo URL<input value={form.logo_url} onChange={e => change('logo_url', e.target.value)} /></label>
        <label className="settings-upload">Upload new logo<input type="file" accept="image/*" onChange={e => e.target.files[0] && upload(e.target.files[0], 'logo_url').catch(err => setMessage(err.message))} /><span><Upload size={17}/> Choose image</span></label>
      </div></section>

      <section className="settings-panel"><div className="settings-panel-title"><span>02</span><div><h3>Hero section</h3><p>Control the first impression customers see.</p></div></div><div className="settings-fields two-col">
        <label>Small heading<input value={form.hero_eyebrow} onChange={e => change('hero_eyebrow', e.target.value)} /></label>
        <label>Opening hours<input value={form.opening_hours} onChange={e => change('opening_hours', e.target.value)} /></label>
        <label>Main heading<input value={form.hero_title} onChange={e => change('hero_title', e.target.value)} /></label>
        <label>Highlighted heading<input value={form.hero_highlight} onChange={e => change('hero_highlight', e.target.value)} /></label>
        <label className="full-field">Hero description<textarea rows="3" value={form.hero_description} onChange={e => change('hero_description', e.target.value)} /></label>
        <label>Hero image URL<input value={form.hero_image_url} onChange={e => change('hero_image_url', e.target.value)} /></label>
        <label className="settings-upload">Upload hero image<input type="file" accept="image/*" onChange={e => e.target.files[0] && upload(e.target.files[0], 'hero_image_url').catch(err => setMessage(err.message))} /><span><Upload size={17}/> Choose image</span></label>
      </div></section>

      <section className="settings-panel"><div className="settings-panel-title"><span>03</span><div><h3>Contact & directions</h3><p>Used across the hero, visit section and footer.</p></div></div><div className="settings-fields two-col">
        <label>Phone number<input value={form.phone} onChange={e => change('phone', e.target.value)} /></label>
        <label>WhatsApp number<input value={form.whatsapp} onChange={e => change('whatsapp', e.target.value)} /></label>
        <label className="full-field">Restaurant address<input value={form.address} onChange={e => change('address', e.target.value)} /></label>
        <label className="full-field">Google Maps / directions URL<input value={form.maps_url} onChange={e => change('maps_url', e.target.value)} /></label>
      </div></section>

      <section className="settings-panel"><div className="settings-panel-title"><span>04</span><div><h3>Delivery & pickup</h3><p>Control fulfilment methods, fees, minimums and estimated times.</p></div></div><div className="settings-fields two-col">
        <label className="toggle-field"><span>Delivery enabled</span><input type="checkbox" checked={form.delivery_enabled !== false} onChange={e => change('delivery_enabled', e.target.checked)} /></label>
        <label className="toggle-field"><span>Pickup enabled</span><input type="checkbox" checked={form.pickup_enabled !== false} onChange={e => change('pickup_enabled', e.target.checked)} /></label>
        <label>Delivery fee (Rs)<input type="number" min="0" value={form.delivery_fee} onChange={e => change('delivery_fee', Number(e.target.value))} /></label>
        <label>Minimum delivery order (Rs)<input type="number" min="0" value={form.minimum_delivery_order} onChange={e => change('minimum_delivery_order', Number(e.target.value))} /></label>
        <label>Free delivery above (Rs)<input type="number" min="0" value={form.free_delivery_threshold} onChange={e => change('free_delivery_threshold', Number(e.target.value))} /></label>
        <label>Delivery ETA<input value={form.delivery_eta} onChange={e => change('delivery_eta', e.target.value)} placeholder="35–50 min" /></label>
        <label>Pickup ETA<input value={form.pickup_eta} onChange={e => change('pickup_eta', e.target.value)} placeholder="20–30 min" /></label>
        <label className="full-field">Pickup address<input value={form.pickup_address} onChange={e => change('pickup_address', e.target.value)} /></label>
      </div></section>

      <section className="settings-panel"><div className="settings-panel-title"><span>05</span><div><h3>Social & footer</h3><p>Optional social links and footer identity.</p></div></div><div className="settings-fields two-col">
        <label>Instagram URL<input value={form.instagram_url} onChange={e => change('instagram_url', e.target.value)} placeholder="https://instagram.com/..." /></label>
        <label>Facebook URL<input value={form.facebook_url} onChange={e => change('facebook_url', e.target.value)} placeholder="https://facebook.com/..." /></label>
        <label className="full-field">Footer name / copyright label<input value={form.footer_note} onChange={e => change('footer_note', e.target.value)} /></label>
      </div></section>

      <div className="settings-savebar"><div>{message && <span className={/saved/i.test(message) ? 'success-text' : 'error-text'}>{message}</span>}</div><button className="primary" disabled={busy}><Save size={18}/>{busy ? 'Saving...' : 'Save website settings'}</button></div>
    </form>
  </div>;
}

function AdminMenu({ items, setItems, token }) {
  const blank = { category: 'Burgers', name: '', description: '', prices: { Price: 0 }, badge: '', image_url: '', available: true };
  const [form, setForm] = useState(blank);
  const [priceText, setPriceText] = useState('Price: 0');
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editPriceText, setEditPriceText] = useState('');
  const [editBusy, setEditBusy] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const categories = Array.from(new Set([...MENU_GROUPS.flatMap(g => g.categories), ...items.map(x => x.category)].filter(Boolean))).sort();
  const headers = { Authorization: `Bearer ${token}` };
  const parsePrices = value => {
    const prices = {};
    String(value || '').split(',').forEach(p => {
      const idx = p.indexOf(':');
      if (idx < 1) return;
      const k = p.slice(0, idx).trim();
      const v = Number(p.slice(idx + 1).trim().replace(/,/g, ''));
      if (k && Number.isFinite(v)) prices[k] = v;
    });
    return prices;
  };
  const pricesToText = prices => Object.entries(prices || {}).map(([k, v]) => `${k}: ${v}`).join(', ');
  const create = async e => {
    e.preventDefault(); setBusy(true);
    try {
      const prices = parsePrices(priceText);
      if (!Object.keys(prices).length) throw new Error('Add at least one valid price, for example Price: 699');
      const data = await api('/api/admin/menu', { method: 'POST', headers, body: JSON.stringify({ ...form, prices }) });
      setItems(x => [...x, data]); setForm(blank); setPriceText('Price: 0');
    } catch (err) { alert(err.message); } finally { setBusy(false); }
  };
  const toggle = async item => {
    const available = !item.available;
    await api(`/api/admin/menu/${item.id}/availability`, { method: 'PATCH', headers, body: JSON.stringify({ available }) });
    setItems(x => x.map(y => y.id === item.id ? { ...y, available } : y));
  };
  const remove = async item => {
    if (!confirm(`Delete ${item.name}?`)) return;
    await api(`/api/admin/menu/${item.id}`, { method: 'DELETE', headers });
    setItems(x => x.filter(y => y.id !== item.id));
  };
  const upload = async (file, applyUrl) => {
    const optimized = await optimizeImageFile(file, { maxDimension: 1000, quality: 0.82 });
    const fd = new FormData(); fd.append('image', optimized);
    const res = await fetch('/api/admin/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
    const d = await res.json();
    if (!res.ok) throw new Error(d.message || 'Upload failed');
    applyUrl(d.url);
    return d.url;
  };
  const startEdit = item => {
    setEditing(item);
    setEditForm({ category: item.category, name: item.name, description: item.description || '', badge: item.badge || '', image_url: item.image_url || '', available: item.available !== false });
    setEditPriceText(pricesToText(item.prices));
  };
  const saveEdit = async e => {
    e.preventDefault();
    if (!editing || !editForm) return;
    setEditBusy(true);
    try {
      const prices = parsePrices(editPriceText);
      if (!Object.keys(prices).length) throw new Error('Add at least one valid price.');
      const updated = await api(`/api/admin/menu/${editing.id}`, { method: 'PUT', headers, body: JSON.stringify({ ...editForm, prices }) });
      setItems(list => list.map(item => item.id === updated.id ? updated : item));
      setEditing(null); setEditForm(null);
    } catch (err) { alert(err.message); } finally { setEditBusy(false); }
  };
  const syncOfficialMenu = async () => {
    if (!confirm('Restore/synchronize all official PDF menu products? Existing custom product images are preserved.')) return;
    setSyncBusy(true);
    try {
      const data = await api('/api/admin/menu/sync', { method: 'POST', headers, body: '{}' });
      setItems(data);
    } catch (err) { alert(err.message); } finally { setSyncBusy(false); }
  };
  const filteredItems = items.filter(item => {
    const q = query.trim().toLowerCase();
    return !q || `${item.name} ${item.category} ${item.description || ''}`.toLowerCase().includes(q);
  });
  return <div>
    <div className="admin-head menu-admin-head"><div><span className="kicker">MENU MANAGER</span><h1>{items.length} menu items</h1><p>Every live website product is managed here, including prices, descriptions, visibility and images.</p></div><button className="secondary admin-sync-btn" onClick={syncOfficialMenu} disabled={syncBusy}><RefreshCw size={16}/>{syncBusy ? 'Syncing...' : 'Sync official menu'}</button></div>
    <div className="admin-menu-search"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products or categories"/><span>{filteredItems.length} shown</span></div>
    <div className="admin-split">
      <form className="admin-form" onSubmit={create}><h3>Add menu item</h3><select className="admin-category-select" required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select><input required placeholder="Item name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /><textarea className="admin-description-field" rows="3" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /><input placeholder={'Prices, e.g. S 7": 599, M 10": 1149'} value={priceText} onChange={e => setPriceText(e.target.value)} /><input placeholder="Badge (optional)" value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} /><input placeholder="Image URL (optional)" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })}/><label className="upload-box"><Upload /> {form.image_url ? 'Replace uploaded image' : 'Upload item image'}<input type="file" accept="image/*" onChange={e => e.target.files[0] && upload(e.target.files[0], url => setForm(f => ({ ...f, image_url: url }))).catch(x => alert(x.message))} /></label><button disabled={busy} className="primary full">{busy ? 'Adding...' : 'Add item'}</button></form>
      <div className="admin-list">{filteredItems.length ? filteredItems.map(item => <div className="admin-item" key={item.id}>{item.image_url ? <img src={item.image_url} alt={item.name} loading="lazy" decoding="async" /> : <div className="admin-thumb"><UtensilsCrossed /></div>}<div className="admin-item-copy"><small>{item.category}</small><strong>{item.name}</strong><span>{Object.entries(item.prices || {}).map(([k, v]) => `${k} ${fmt(v)}`).join(' · ')}</span></div><button title="Edit product" className="edit-icon" onClick={() => startEdit(item)}><Pencil /></button><button title="Toggle visibility" className={item.available ? 'visibility on' : 'visibility'} onClick={() => toggle(item)}>{item.available ? <Eye /> : <EyeOff />}</button><button title="Delete product" className="danger-icon" onClick={() => remove(item)}><Trash2 /></button></div>) : <div className="empty"><UtensilsCrossed/><h3>No products found</h3><p>Try another search or use “Sync official menu” to restore the PDF menu.</p></div>}</div>
    </div>
    {editing && editForm && <div className="admin-edit-backdrop" onMouseDown={e => e.target === e.currentTarget && setEditing(null)}><form className="admin-edit-modal" onSubmit={saveEdit}><div className="admin-edit-title"><div><span className="kicker">EDIT PRODUCT</span><h2>{editing.name}</h2></div><button type="button" className="modal-close" onClick={() => setEditing(null)}><X/></button></div><div className="admin-edit-grid"><div className="admin-edit-image">{editForm.image_url ? <img src={editForm.image_url} alt={editForm.name} decoding="async"/> : <div><UtensilsCrossed/><span>No image</span></div>}<label className="upload-box"><Upload/> Upload / replace image<input type="file" accept="image/*" onChange={e => e.target.files[0] && upload(e.target.files[0], url => setEditForm(f => ({ ...f, image_url: url }))).catch(x => alert(x.message))}/></label>{editForm.image_url && <button type="button" className="remove-product-image" onClick={() => setEditForm(f => ({ ...f, image_url: '' }))}><Trash2 size={15}/> Remove image</button>}<input placeholder="Image URL" value={editForm.image_url} onChange={e => setEditForm(f => ({ ...f, image_url: e.target.value }))}/></div><div className="admin-edit-fields"><label>Category<select className="admin-category-select" required value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></label><label>Product name<input required value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}/></label><label>Description<textarea className="admin-description-field" rows="3" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}/></label><label>Prices<input value={editPriceText} onChange={e => setEditPriceText(e.target.value)} placeholder="Price: 699"/></label><label>Badge<input value={editForm.badge} onChange={e => setEditForm(f => ({ ...f, badge: e.target.value }))} placeholder="Optional"/></label><label className="admin-availability"><input type="checkbox" checked={editForm.available} onChange={e => setEditForm(f => ({ ...f, available: e.target.checked }))}/><span>Visible on website</span></label></div></div><div className="admin-edit-actions"><button type="button" className="secondary" onClick={() => setEditing(null)}>Cancel</button><button className="primary" disabled={editBusy}><Save size={17}/>{editBusy ? 'Saving...' : 'Save product'}</button></div></form></div>}
  </div>;
}

function AdminOrders({ orders, setOrders, token }) {
  const headers = { Authorization: `Bearer ${token}` };
  const update = async (o, status) => { const updated = await api(`/api/admin/orders/${o.id}/status`, { method: 'PATCH', headers, body: JSON.stringify({ status }) }); setOrders(x => x.map(y => y.id === o.id ? updated : y)); };
  const statuses = ['new', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'];
  return <div><div className="admin-head"><div><span className="kicker">ORDER DESK</span><h1>Recent orders</h1></div></div><div className="order-grid">{orders.length ? orders.map(o => <article className="order-card" key={o.id}><div className="order-top"><div><small>{o.order_no}</small><h3>{o.customer_name}</h3><span>{o.phone} · {o.order_type}{o.customer_id ? ' · registered customer' : ''}</span></div><select className="order-status-select" value={o.status} onChange={e => update(o, e.target.value)}>{statuses.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}</select></div><div className="order-items">{o.items.map((i, k) => <div key={k}><span>{i.qty}× {i.name} <small>{i.variant}{i.addons?.length ? ` · ${i.addons.map(a => a.name).join(' · ')}` : ''}</small></span><strong>{fmt(i.line_total)}</strong></div>)}</div>{o.address && <p className="order-address"><MapPin /> <span>{o.delivery_area && <strong>{o.delivery_area}</strong>}{o.address}{o.landmark && <small>Landmark: {o.landmark}</small>}</span></p>}<div className="order-total"><span>{o.delivery_fee ? `Total · delivery ${fmt(o.delivery_fee)}` : 'Total'}</span><strong>{fmt(o.total)}</strong></div></article>) : <div className="empty">No orders yet.</div>}</div></div>;
}

function AdminCustomers({ customers }) {
  return <div><div className="admin-head"><div><span className="kicker">CUSTOMER ACCOUNTS</span><h1>{customers.length} registered customers</h1></div></div><div className="customer-admin-grid">{customers.length ? customers.map(c => <article className="customer-admin-card" key={c.id}><div className="customer-admin-avatar"><UserRound /></div><div className="customer-admin-copy"><h3>{c.name}</h3><p>{c.email}</p><span>{c.phone}</span>{c.default_address && <small><MapPin /> {c.default_address}</small>}</div><div className="customer-admin-stats"><div><strong>{c.order_count || 0}</strong><small>Orders</small></div><div><strong>{fmt(c.total_spent || 0)}</strong><small>Total spent</small></div></div></article>) : <div className="empty">No customer accounts yet.</div>}</div></div>;
}

function AdminReviews({ reviews, setReviews, token }) {
  const headers = { Authorization: `Bearer ${token}` };
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ customer_name: '', rating: 5, comment: '', approved: true });
  const setApproval = async (review, approved) => {
    const updated = await api(`/api/admin/reviews/${review.id}/approval`, { method: 'PATCH', headers, body: JSON.stringify({ approved }) });
    setReviews(list => list.map(r => r.id === review.id ? updated : r));
  };
  const remove = async review => {
    if (!confirm(`Delete review from ${review.customer_name}?`)) return;
    await api(`/api/admin/reviews/${review.id}`, { method: 'DELETE', headers });
    setReviews(list => list.filter(r => r.id !== review.id));
  };
  const create = async e => {
    e.preventDefault(); setBusy(true);
    try {
      const saved = await api('/api/admin/reviews', { method: 'POST', headers, body: JSON.stringify(form) });
      setReviews(list => [saved, ...list]);
      setForm({ customer_name: '', rating: 5, comment: '', approved: true });
      setShowAdd(false);
    } catch (err) { alert(err.message); } finally { setBusy(false); }
  };
  const pending = reviews.filter(r => !r.approved).length;
  return <div><div className="admin-head"><div><span className="kicker">CUSTOMER REVIEWS</span><h1>{reviews.length} reviews</h1><p>{pending ? `${pending} waiting for approval.` : 'All reviews are moderated.'}</p></div><button className="primary admin-add-review-btn" onClick={() => setShowAdd(v => !v)}><Plus size={17}/>{showAdd ? 'Close form' : 'Add review'}</button></div>{showAdd && <form className="admin-review-create" onSubmit={create}><div className="admin-review-create-head"><div><span className="kicker">MANUAL REVIEW</span><h3>Add a customer review</h3></div></div><input required maxLength="120" placeholder="Customer name" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })}/><div className="review-stars admin-review-picker">{[1,2,3,4,5].map(n => <button type="button" key={n} className={n <= form.rating ? 'active' : ''} onClick={() => setForm({ ...form, rating: n })} aria-label={`${n} star`}><Star fill={n <= form.rating ? 'currentColor' : 'none'}/></button>)}</div><textarea required minLength="3" maxLength="1200" rows="4" placeholder="Review text" value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })}/><label className="admin-review-publish"><input type="checkbox" checked={form.approved} onChange={e => setForm({ ...form, approved: e.target.checked })}/><span>Publish immediately</span></label><button className="primary" disabled={busy}><Plus size={16}/>{busy ? 'Adding...' : 'Add review'}</button></form>}<div className="admin-review-grid">{reviews.length ? reviews.map(review => <article className="admin-review-card" key={review.id}><div className="admin-review-top"><div><strong>{review.customer_name}</strong><small>{review.order_no} · {new Date(review.created_at).toLocaleDateString('en-PK')}</small></div><span className={review.approved ? 'review-state approved' : 'review-state'}>{review.approved ? 'Published' : 'Pending'}</span></div><div className="admin-review-stars">{[1,2,3,4,5].map(n => <Star key={n} size={16} fill={n <= review.rating ? 'currentColor' : 'none'} />)}</div><p>{review.comment}</p><div className="admin-review-actions"><button className="secondary" onClick={() => setApproval(review, !review.approved)}>{review.approved ? <EyeOff size={15}/> : <Eye size={15}/>} {review.approved ? 'Hide' : 'Approve'}</button><button className="danger-review" onClick={() => remove(review)}><Trash2 size={15}/> Delete</button></div></article>) : <div className="empty"><MessageCircle/><h3>No reviews yet</h3><p>Website and completed-order reviews will appear here.</p></div>}</div></div>;
}
function AdminReservations({ rows, setRows, token }) {
  const headers = { Authorization: `Bearer ${token}` };
  const update = async (r, status) => { await api(`/api/admin/reservations/${r.id}/status`, { method: 'PATCH', headers, body: JSON.stringify({ status }) }); setRows(x => x.map(y => y.id === r.id ? { ...y, status } : y)); };
  return <div><div className="admin-head"><div><span className="kicker">TABLES</span><h1>Reservation requests</h1></div></div><div className="reservation-list">{rows.length ? rows.map(r => <div className="reservation-card" key={r.id}><div className="date-block"><strong>{String(r.reservation_date).slice(0, 10)}</strong><span>{String(r.reservation_time).slice(0, 5)}</span></div><div><h3>{r.name}</h3><p>{r.phone} · {r.guests} guests</p>{r.notes && <small>{r.notes}</small>}</div><select className="reservation-status-select" value={r.status} onChange={e => update(r, e.target.value)}>{['pending', 'confirmed', 'completed', 'cancelled'].map(s => <option key={s}>{s}</option>)}</select></div>) : <div className="empty">No reservation requests yet.</div>}</div></div>;
}

function AppRoutes() {
  return <Routes>
    <Route path="/admin" element={<Admin />} />
    <Route path="/login" element={<CustomerAuthPage mode="login" />} />
    <Route path="/register" element={<CustomerAuthPage mode="register" />} />
    <Route path="/account" element={<AccountPage />} />
    <Route path="/track" element={<TrackOrderPage />} />
    <Route path="*" element={<Home />} />
  </Routes>;
}

export default function App() {
  return <ThemeProvider><SiteSettingsProvider><CustomerProvider><AppRoutes /></CustomerProvider></SiteSettingsProvider></ThemeProvider>;
}
