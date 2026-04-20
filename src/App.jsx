import { useState, useEffect, useContext, createContext } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useNavigate,
  useParams,
} from 'react-router-dom';

const CartContext = createContext();

function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const savedCart = localStorage.getItem('shopkart_cart');
    const savedWishlist = localStorage.getItem('shopkart_wishlist');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch {}
    }
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch {}
    }
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function addToCart(product) {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const next = existing
        ? prev.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...prev, { ...product, quantity: 1 }];
      localStorage.setItem('shopkart_cart', JSON.stringify(next));
      return next;
    });
    showToast('Added to cart!');
  }

  function removeFromCart(id) {
    setCartItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      localStorage.setItem('shopkart_cart', JSON.stringify(next));
      return next;
    });
  }

  function updateQty(id, delta) {
    setCartItems((prev) => {
      const next = prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0);
      localStorage.setItem('shopkart_cart', JSON.stringify(next));
      return next;
    });
  }

  function toggleWishlist(product) {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      const next = exists
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, product];
      localStorage.setItem('shopkart_wishlist', JSON.stringify(next));
      showToast(exists ? 'Removed from wishlist' : 'Saved to wishlist!');
      return next;
    });
  }

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQty,
        wishlist,
        toggleWishlist,
        cartCount,
        showToast,
      }}
    >
      {children}
      {toast && <div className="toast">{toast}</div>}
    </CartContext.Provider>
  );
}

function Stars({ rating }) {
  const full = Math.round(rating);
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <i
          key={i}
          className={i <= full ? 'fas fa-star' : 'far fa-star'}
        ></i>
      ))}
    </span>
  );
}

const PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: '$0 – $20', min: 0, max: 20 },
  { label: '$20 – $100', min: 20, max: 100 },
  { label: '$100 – $500', min: 100, max: 500 },
  { label: '$500+', min: 500, max: Infinity },
];

const SORT_OPTIONS = [
  { label: 'Default', value: 'default' },
  { label: 'Price: Low → High', value: 'price_asc' },
  { label: 'Price: High → Low', value: 'price_desc' },
  { label: 'Rating', value: 'rating' },
];

function NavBar() {
  const { cartCount, wishlist } = useContext(CartContext);
  return (
    <nav>
      <Link to="/" className="nav-brand">
        ShopKart
      </Link>
      <div className="nav-links">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            'nav-link' + (isActive ? ' active' : '')
          }
        >
          Products
        </NavLink>
        <NavLink
          to="/wishlist"
          className={({ isActive }) =>
            'nav-link' + (isActive ? ' active' : '')
          }
        >
          <i className="fas fa-heart" style={{ marginRight: '4px' }}></i>
          Wishlist{' '}
          {wishlist.length > 0 && (
            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>
              ({wishlist.length})
            </span>
          )}
        </NavLink>
        <NavLink to="/cart" className="nav-cart">
          <i className="fas fa-shopping-bag"></i>
          Cart
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </NavLink>
      </div>
    </nav>
  );
}

function Banner({ searchQuery, setSearchQuery }) {
  return (
    <div className="banner">
      <h1 className="banner-title">
        Discover <span>Premium</span> Products
      </h1>
      <p className="banner-sub">
        Browse thousands of curated items across all categories
      </p>
      <div className="search-bar-wrap">
        <i className="fas fa-search search-icon"></i>
        <input
          className="search-bar"
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>
  );
}

function ProductCard({ product }) {
  const { addToCart, toggleWishlist, wishlist } = useContext(CartContext);
  const navigate = useNavigate();
  const inWishlist = wishlist.some((p) => p.id === product.id);

  return (
    <div className="product-card">
      <div
        className="product-img-wrap"
        onClick={() => navigate(`/products/${product.id}`)}
      >
        <img className="product-img" src={product.image} alt={product.title} />
        <button
          className={'wishlist-btn' + (inWishlist ? ' active' : '')}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
        >
          <i className={inWishlist ? 'fas fa-heart' : 'far fa-heart'}></i>
        </button>
      </div>
      <div className="product-body">
        <div className="product-category">{product.category}</div>
        <div className="product-title">{product.title}</div>
        <div className="product-rating">
          <Stars rating={product.rating.rate} />
          <span className="rating-val">({product.rating.count})</span>
        </div>
        <div className="product-price">${product.price.toFixed(2)}</div>
        <button className="add-cart-btn" onClick={() => addToCart(product)}>
          <i className="fas fa-cart-plus" style={{ marginRight: '6px' }}></i>
          Add to Cart
        </button>
      </div>
    </div>
  );
}

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState('default');
  const [priceRange, setPriceRange] = useState(0);

  useEffect(() => {
    async function getData() {
      setLoading(true);
      const response = await fetch('https://fakestoreapi.com/products');
      const data = await response.json();
      setProducts(data);
      const cats = ['all', ...new Set(data.map((p) => p.category))];
      setCategories(cats);
      setLoading(false);
    }
    getData();
  }, []);

  const range = PRICE_RANGES[priceRange];
  const displayed = products
    .filter((p) => {
      const matchCat = activeCategory === 'all' || p.category === activeCategory;
      const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPrice = p.price >= range.min && p.price < range.max;
      return matchCat && matchSearch && matchPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating.rate - a.rating.rate;
      return 0;
    });

  return (
    <div>
      <Banner searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <div className="page-wrap">
        <div className="tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={'tab-btn' + (activeCategory === cat ? ' active' : '')}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'all' ? 'All Products' : cat}
            </button>
          ))}
        </div>

        <div className="section-label">Price Range</div>
        <div className="price-filters">
          {PRICE_RANGES.map((r, i) => (
            <button
              key={r.label}
              className={'price-btn' + (priceRange === i ? ' active' : '')}
              onClick={() => setPriceRange(i)}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="controls">
          <span className="filter-label">{displayed.length} products</span>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>Loading products...
          </div>
        ) : displayed.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">No products found</div>
            <p>Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="product-grid">
            {displayed.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart, toggleWishlist, wishlist } = useContext(CartContext);
  const navigate = useNavigate();

  useEffect(() => {
    async function getData() {
      setLoading(true);
      const response = await fetch(`https://fakestoreapi.com/products/${id}`);
      const data = await response.json();
      setProduct(data);
      setLoading(false);
    }
    getData();
  }, [id]);

  if (loading)
    return (
      <div className="page-wrap">
        <div className="loading">
          <div className="spinner"></div>Loading...
        </div>
      </div>
    );
  if (!product) return null;

  const inWishlist = wishlist.some((p) => p.id === product.id);

  return (
    <div className="page-wrap">
      <button className="back-btn" onClick={() => navigate('/')}> 
        <i className="fas fa-arrow-left"></i> Back to Products
      </button>
      <div className="detail-wrap">
        <div className="detail-img-wrap">
          <img className="detail-img" src={product.image} alt={product.title} />
        </div>
        <div>
          <div className="detail-category">{product.category}</div>
          <div className="detail-title">{product.title}</div>
          <div className="product-rating" style={{ marginBottom: '0.8rem' }}>
            <Stars rating={product.rating.rate} />
            <span className="rating-val">
              {product.rating.rate} ({product.rating.count} reviews)
            </span>
          </div>
          <div className="detail-price">${product.price.toFixed(2)}</div>
          <p className="detail-desc">{product.description}</p>
          <div className="detail-actions">
            <button className="btn-primary" onClick={() => addToCart(product)}>
              <i className="fas fa-cart-plus" style={{ marginRight: '6px' }}></i>
              Add to Cart
            </button>
            <button
              className="btn-secondary"
              onClick={() => toggleWishlist(product)}
            >
              <i
                className={inWishlist ? 'fas fa-heart' : 'far fa-heart'}
                style={{ marginRight: '6px' }}
              ></i>
              {inWishlist ? 'Wishlisted' : 'Wishlist'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartPage() {
  const { cartItems, removeFromCart, updateQty } = useContext(CartContext);
  const navigate = useNavigate();

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  if (cartItems.length === 0)
    return (
      <div className="page-wrap">
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <div className="empty-title">Your cart is empty</div>
          <p style={{ marginBottom: '1.5rem' }}>
            Start browsing and add items to your cart
          </p>
          <button className="btn-primary" onClick={() => navigate('/')}>Browse Products</button>
        </div>
      </div>
    );

  return (
    <div className="page-wrap">
      <div className="page-title">Shopping Cart</div>
      <div className="cart-wrap">
        {cartItems.map((item) => (
          <div className="cart-item" key={item.id}>
            <img className="cart-item-img" src={item.image} alt={item.title} />
            <div className="cart-item-info">
              <div className="cart-item-title">{item.title}</div>
              <div className="cart-item-price">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
            <div className="qty-controls">
              <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>
                −
              </button>
              <span className="qty-val">{item.quantity}</span>
              <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>
                +
              </button>
            </div>
            <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
              <i className="fas fa-trash"></i>
            </button>
          </div>
        ))}

        <div className="cart-summary">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Tax (8%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button className="checkout-btn" onClick={() => navigate('/checkout')}>
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

function WishlistPage() {
  const { wishlist } = useContext(CartContext);
  const navigate = useNavigate();

  if (wishlist.length === 0)
    return (
      <div className="page-wrap">
        <div className="empty-state">
          <div className="empty-icon">🤍</div>
          <div className="empty-title">No saved items yet</div>
          <p style={{ marginBottom: '1.5rem' }}>
            Click the heart on any product to save it
          </p>
          <button className="btn-primary" onClick={() => navigate('/')}>Browse Products</button>
        </div>
      </div>
    );

  return (
    <div className="page-wrap">
      <div className="page-title">Your Wishlist</div>
      <div className="wishlist-grid">
        {wishlist.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

function CheckoutPage() {
  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <div className="page-wrap">
      <div className="checkout-page">
        <div className="checkout-card">
          <div className="checkout-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="page-title" style={{ marginBottom: '0.5rem' }}>
            Order Summary
          </div>
          <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
            Review your order before placing it
          </p>

          {cartItems.map((item) => (
            <div
              key={item.id}
              className="summary-row"
              style={{
                borderBottom: '1px solid var(--border)',
                paddingBottom: '0.5rem',
                marginBottom: '0.5rem',
                color: 'var(--ink)',
              }}
            >
              <span style={{ maxWidth: '70%', textAlign: 'left' }}>
                {item.title} × {item.quantity}
              </span>
              <span style={{ fontWeight: 600 }}>
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}

          <div
            style={{
              marginTop: '1rem',
              background: 'var(--ink)',
              borderRadius: '12px',
              padding: '1rem',
            }}
          >
            <div className="summary-row" style={{ color: '#ccc' }}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row" style={{ color: '#ccc' }}>
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ marginTop: '1.5rem', width: '100%', padding: '0.9rem' }}
            onClick={() => navigate('/')}
          >
            <i className="fas fa-check" style={{ marginRight: '6px' }}></i>
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
