/**
 * Dummy/mock data for UI only - tailor / stitched clothing focus
 * Random images per content via Picsum Photos (seed = content key)
 * @format
 */

// Random but deterministic image per seed (picsum.photos) - different seed = different image per content
const pic = (seed, w, h) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const bannerSlides = [
  {
    id: '1',
    image: pic('car', 800, 400),
    title: 'CUSTOM STITCHED WEAR',
    tagline: 'Coats. Shalwar Kameez. Perfect Fit.',
    cta: 'Shop Now',
  },
  {
    id: '2',
    image: pic('tailor-workshop', 800, 400),
    title: 'BEST TAILORS NEAR YOU',
    tagline: 'Verified. Skilled. On time.',
    cta: 'Book Tailor',
  },
  {
    id: '3',
    image: pic('design-fabric', 800, 400),
    title: 'DESIGN YOUR OUTFIT',
    tagline: 'Fabric. Style. Stitching.',
    cta: 'Get Started',
  },
];

export const categories = [
  { id: '1', name: 'Coats', image: pic('coats-category', 300, 300) },
  { id: '2', name: 'Shalwar Kameez', image: pic('shalwar-category', 300, 300) },
  { id: '3', name: 'Pants', image: pic('pants-category', 300, 300) },
  { id: '4', name: 'Shirts', image: pic('shirts-category', 300, 300) },
];

export const secondaryBanner = {
  image: pic('new-collection-banner', 800, 320),
  title: 'New Stitched Collection',
  tagline: 'Fresh designs from top tailors',
  subtext: 'Explore latest arrivals',
};

export const tailors = [
  { id: '1', name: 'Rashid Tailors', image: pic('tailor-1', 120, 120) },
  { id: '2', name: 'Bilal Master', image: pic('tailor-2', 120, 120) },
  { id: '3', name: 'Sana Stitching', image: pic('tailor-3', 120, 120) },
  { id: '4', name: 'Hassan Darzi', image: pic('tailor-4', 120, 120) },
  { id: '5', name: 'Zainab Couture', image: pic('tailor-5', 120, 120) },
  { id: '6', name: 'Ali Tailoring', image: pic('tailor-6', 120, 120) },
];

export const products = [
  {
    id: '1',
    sellerName: 'Rashid Tailors',
    sellerType: 'verified tailor',
    sellerAvatar: pic('seller-rashid', 40, 40),
    image: pic('product-wool-coat', 400, 400),
    title: 'Stitched Wool Coat',
    location: 'Lahore',
    price: 'PKR 8,500',
  },
  {
    id: '2',
    sellerName: 'Bilal Master',
    sellerType: 'verified tailor',
    sellerAvatar: pic('seller-bilal', 40, 40),
    image: pic('product-shalwar-kameez', 400, 400),
    title: 'Embroidered Shalwar Kameez',
    location: 'Karachi',
    price: 'PKR 12,000',
  },
  {
    id: '3',
    sellerName: 'Sana Stitching',
    sellerType: 'verified tailor',
    sellerAvatar: pic('seller-sana', 40, 40),
    image: pic('product-churidar', 400, 400),
    title: 'Formal Churidar Set',
    location: 'Islamabad',
    price: 'PKR 9,200',
  },
  {
    id: '4',
    sellerName: 'Hassan Darzi',
    sellerType: 'verified tailor',
    sellerAvatar: pic('seller-hassan', 40, 40),
    image: pic('product-shirt', 400, 400),
    title: 'Custom Fit Shirt',
    location: 'Faisalabad',
    price: 'PKR 3,500',
  },
];

export const chats = [
  { id: '1', name: 'Ahmed', lastMessage: 'When will my coat be ready?', time: '2m', avatar: pic('chat-1', 48, 48) },
  { id: '2', name: 'Fatima', lastMessage: 'I need a trial for the shalwar kameez', time: '15m', avatar: pic('chat-2', 48, 48) },
  { id: '3', name: 'Usman', lastMessage: 'Measurement done, when to collect?', time: '1h', avatar: pic('chat-3', 48, 48) },
  { id: '4', name: 'Ayesha', lastMessage: 'Can you add embroidery on the collar?', time: '2h', avatar: pic('chat-4', 48, 48) },
  { id: '5', name: 'Imran', lastMessage: 'Order ready for pickup', time: 'Yesterday', avatar: pic('chat-5', 48, 48) },
];

export const notifications = [
  { id: '1', title: 'New message', body: 'Ahmed sent you a message about his coat order', time: '2m ago', read: false },
  { id: '2', title: 'Order ready', body: 'Shalwar kameez for Fatima is ready for trial', time: '1h ago', read: true },
  { id: '3', title: 'Measurement reminder', body: 'Usman\'s measurement is pending', time: '3h ago', read: true },
  { id: '4', title: 'New order', body: 'Ayesha placed an order for 2 stitched shirts', time: '5h ago', read: false },
  { id: '5', title: 'Review', body: 'Imran left a 5-star review for your tailoring', time: '1d ago', read: true },
];

// Wishlist - product-like items
export const wishlistItems = [
  { id: 'w1', ...products[0] },
  { id: 'w2', ...products[1] },
  { id: 'w3', ...products[3] },
];

// Cart - item with qty and price
export const cartItems = [
  { id: 'c1', product: products[0], qty: 1, price: 'PKR 8,500' },
  { id: 'c2', product: products[1], qty: 2, price: 'PKR 12,000' },
  { id: 'c3', product: products[2], qty: 1, price: 'PKR 9,200' },
];

// Default address for place order (dummy)
export const defaultAddress = {
  fullName: 'Ali Khan',
  phone: '+92 300 1234567',
  address: '123 Main Street, Block A',
  city: 'Lahore',
  area: 'Gulberg',
};

// Sellers (from tailors) - for seller profile
export const sellers = tailors.map((t) => ({ id: t.id, name: t.name, image: t.image }));

// Products by seller (dummy - repeat/expand for 10 per seller)
function getSellerProducts(sellerName, count = 10) {
  const base = products.filter((p) => p.sellerName === sellerName);
  if (base.length === 0) return [];
  const result = [];
  for (let i = 0; i < count; i++) {
    const p = base[i % base.length];
    result.push({ ...p, id: `${p.id}-${i}` });
  }
  return result;
}
export { getSellerProducts };
