/*Central logic for all pages*/

// UTILS 
const formatRp = (n) => 'Rp ' + n.toLocaleString('id-ID');

const getThumb = (p) => (Array.isArray(p.image) ? p.image[0] : p.image);

const getImages = (p) => {
  if (Array.isArray(p.image)) return p.image;
  if (typeof p.image === 'string') return [p.image];
  return [];
};

const getCart = () => JSON.parse(localStorage.getItem('bluanja_cart') || '[]');
const saveCart = (cart) => localStorage.setItem('bluanja_cart', JSON.stringify(cart));

// THEME 
function initTheme() {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  const saved = localStorage.getItem('bluanja_theme') || 'light';
  applyTheme(saved, toggle);

  toggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    applyTheme(next, toggle);
    localStorage.setItem('bluanja_theme', next);
  });
}

function applyTheme(theme, toggleBtn) {
  document.documentElement.setAttribute('data-theme', theme);
  if (toggleBtn) toggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// CART BADGE 
function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const total = getCart().reduce((s, i) => s + i.qty, 0);
  badge.textContent = total;
}

// WISHLIST
const getWishlist = () => JSON.parse(localStorage.getItem('bluanja_wishlist') || '[]');
const saveWishlist = (list) => localStorage.setItem('bluanja_wishlist', JSON.stringify(list));

function toggleWishlist(id, btnEl) {
  let list = getWishlist();
  const idx = list.indexOf(id);
  if (idx > -1) {
    list.splice(idx, 1);
    btnEl.classList.remove('active');
    btnEl.title = 'Tambah ke Wishlist';
  } else {
    list.push(id);
    btnEl.classList.add('active');
    btnEl.title = 'Hapus dari Wishlist';
  }
  saveWishlist(list);
}

// PAGE: INDEX
function initIndexPage() {
  if (!document.getElementById('productsGrid')) return;

  let currentSearch = '';
  let currentCategory = 'All';

  // Search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      currentSearch = searchInput.value.toLowerCase();
      renderProducts();
    });
  }

  // Sort
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.addEventListener('change', renderProducts);

  // Filter chips
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      currentCategory = chip.textContent.trim();
      renderProducts();
    });
  });

  function renderProducts() {
    const sort = sortSelect ? sortSelect.value : 'default';
    const wishlist = getWishlist();

    let filtered = products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(currentSearch) ||
        p.category.toLowerCase().includes(currentSearch);
      const matchCat =
        currentCategory === 'All' || p.category === currentCategory;
      return matchSearch && matchCat;
    });

    if (sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') filtered.sort((a, b) => b.rating - a.rating);

    const grid = document.getElementById('productsGrid');

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:72px;color:var(--text-muted);">
          <div style="font-size:48px;margin-bottom:12px;">🔍</div>
          <p style="font-size:16px;">Produk tidak ditemukan</p>
        </div>`;
      return;
    }

    grid.innerHTML = filtered
      .map(
        (p, i) => `
      <div class="product-card fade-up" style="animation-delay:${i * 0.05}s"
           onclick="location.href='detail.html?id=${p.id}'">
        <div class="card-img-wrap">
          <img src="${getThumb(p)}" alt="${p.name}"
               style="width:100%;height:100%;object-fit:cover;"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span style="font-size:56px;display:none;align-items:center;justify-content:center;width:100%;height:100%;">📦</span>
          <button
            class="card-wish ${wishlist.includes(p.id) ? 'active' : ''}"
            title="${wishlist.includes(p.id) ? 'Hapus dari Wishlist' : 'Tambah ke Wishlist'}"
            onclick="event.stopPropagation(); toggleWishlist(${p.id}, this)">
            ${wishlist.includes(p.id) ? '♥' : '♡'}
          </button>
        </div>
        <div class="card-body">
          <div class="card-cat">${p.category}</div>
          <div class="card-name">${p.name}</div>
          <div class="card-price">${formatRp(p.price)}</div>
          <div class="card-rating">
            <span class="star">★</span> ${p.rating} <span>(${p.reviews})</span>
          </div>
          <button class="card-add-btn" onclick="event.stopPropagation(); addToCartIndex(${p.id}, this)">
            + Add to Cart
          </button>
        </div>
      </div>`
      )
      .join('');
  }

  // Tambah ke cart qty 1
  window.addToCartIndex = function (id, btn) {
    const cart = getCart();
    const idx = cart.findIndex((i) => i.id === id);
    if (idx > -1) cart[idx].qty += 1;
    else cart.push({ id, qty: 1 });
    saveCart(cart);
    updateCartBadge();
    const original = btn.textContent;
    btn.textContent = '✓ Ditambahkan!';
    setTimeout(() => (btn.textContent = original), 1200);
  };

  renderProducts();
}

// PAGE: DETAIL 
function initDetailPage() {
  if (!document.getElementById('detailName')) return;

  const params = new URLSearchParams(window.location.search);
  const product = products.find((p) => p.id === parseInt(params.get('id')));
  let qty = 1;

  window.changeQty = function (delta) {
    if (!product) return;
    qty = Math.max(1, Math.min(qty + delta, product.stock));
    document.getElementById('qtyVal').textContent = qty;
  };

  window.addToCart = function () {
    if (!product) return;
    const cart = getCart();
    const idx = cart.findIndex((i) => i.id === product.id);
    if (idx > -1) cart[idx].qty += qty;
    else cart.push({ id: product.id, qty });
    saveCart(cart);
    updateCartBadge();
    const btn = document.getElementById('addBtn');
    btn.textContent = '✓ Ditambahkan ke Keranjang!';
    setTimeout(() => (btn.innerHTML = '🛒 ADD TO CART'), 1500);
  };

  function setMainImg(src, alt) {
    document.getElementById('mainImgWrap').innerHTML = `
      <img src="${src}" alt="${alt}"
           style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius)"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <span style="font-size:80px;display:none;align-items:center;justify-content:center;width:100%;height:100%;">📦</span>
    `;
  }

  window.selectThumb = function (el, imgSrc) {
    document.querySelectorAll('.detail-thumb').forEach((t) =>
      t.classList.remove('active')
    );
    el.classList.add('active');
    setMainImg(imgSrc, product.name);
  };

  if (product) {
    const images = getImages(product);
    const starsCount = Math.round(product.rating);
    const starsHtml = '★'.repeat(starsCount) + '☆'.repeat(5 - starsCount);

    document.title = product.name + ' — BLUANJA★';
    document.getElementById('bcCategory').textContent = product.category;
    document.getElementById('bcName').textContent = product.name;
    document.getElementById('detailCat').textContent = product.category;
    document.getElementById('detailName').textContent = product.name;
    document.getElementById('detailPrice').textContent = formatRp(product.price);
    document.getElementById('detailStars').textContent = starsHtml;
    document.getElementById('detailRating').textContent = product.rating;
    document.getElementById('detailReviews').textContent = product.reviews + ' reviews';
    document.getElementById('detailDesc').textContent = product.description;
    document.getElementById('detailStock').textContent = product.stock;

    // Stock warning
    if (product.stock <= 5) {
      const stockEl = document.getElementById('detailStock');
      stockEl.style.color = '#ff7eb3';
      stockEl.textContent = product.stock + ' (hampir habis!)';
    }

    setMainImg(images[0], product.name);

    if (images.length > 1) {
      document.getElementById('thumbsRow').innerHTML = images
        .map(
          (img, i) => `
        <div class="detail-thumb ${i === 0 ? 'active' : ''}"
             onclick="selectThumb(this, '${img}')">
          <img src="${img}" alt="thumb ${i + 1}"
               style="width:100%;height:100%;object-fit:cover;border-radius:7px"
               onerror="this.style.display='none'">
        </div>`
        )
        .join('');
    }
  } else {
    document.getElementById('detailName').textContent = 'Produk tidak ditemukan';
  }
}

// PAGE: CART 
function initCartPage() {
  if (!document.getElementById('cartItemsContainer')) return;

  function updateSummary(totalItems, totalPrice) {
    document.getElementById('summaryItemLabel').textContent = `Total Produk (${totalItems} item)`;
    document.getElementById('summarySubtotal').textContent = formatRp(totalPrice);
    document.getElementById('summaryTotal').textContent = formatRp(totalPrice);
  }

  function renderCart() {
    const cart = getCart();
    const container = document.getElementById('cartItemsContainer');
    const summaryPanel = document.getElementById('summaryPanel');

    if (cart.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🛒</div>
          <h3>Keranjang Masih Kosong</h3>
          <p>Yuk, temukan produk favoritmu!</p>
          <a href="index.html">Mulai Belanja</a>
        </div>`;
      summaryPanel.style.opacity = '0.5';
      summaryPanel.style.pointerEvents = 'none';
      updateSummary(0, 0);
      updateCartBadge();
      return;
    }

    let totalItems = 0;
    let totalPrice = 0;

    container.innerHTML = cart
      .map((item) => {
        const p = products.find((x) => x.id === item.id);
        if (!p) return '';
        totalItems += item.qty;
        totalPrice += p.price * item.qty;
        const thumb = getThumb(p);
        return `
        <div class="cart-item fade-up" id="cart-item-${p.id}">
          <div class="cart-item-img">
            <img src="${thumb}" alt="${p.name}"
                 style="width:100%;height:100%;object-fit:cover;"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <span style="font-size:56px;display:none;align-items:center;justify-content:center;width:100%;height:100%;">📦</span>
          </div>
          <div class="cart-item-info">
            <div class="cart-item-cat">${p.category}</div>
            <div class="cart-item-name">${p.name}</div>
            <div class="cart-item-bottom">
              <div class="qty-control">
                <button class="qty-btn" onclick="changeCartQty(${p.id}, -1)">−</button>
                <span class="qty-val" id="qty-${p.id}">${item.qty}</span>
                <button class="qty-btn" onclick="changeCartQty(${p.id}, 1)">+</button>
              </div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
            <div class="cart-item-price" id="price-${p.id}">${formatRp(p.price * item.qty)}</div>
            <button class="cart-remove-btn" onclick="removeItem(${p.id})" title="Hapus">✕</button>
          </div>
        </div>`;
      })
      .join('');

    summaryPanel.style.opacity = '1';
    summaryPanel.style.pointerEvents = 'auto';
    document.getElementById('cartTitle').textContent = `Keranjang (${totalItems} item)`;
    updateSummary(totalItems, totalPrice);
    updateCartBadge();
  }

  window.changeCartQty = function (id, delta) {
    const cart = getCart();
    const idx = cart.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const p = products.find((x) => x.id === id);
    cart[idx].qty = Math.max(1, Math.min(cart[idx].qty + delta, p.stock));
    saveCart(cart);
    renderCart();
  };

  window.removeItem = function (id) {
    saveCart(getCart().filter((i) => i.id !== id));
    renderCart();
  };

  window.handleCheckout = function () {
    const cart = getCart();
    if (cart.length === 0) return;
    alert('✅ Pesanan berhasil dibuat! Terima kasih sudah belanja di BLUANJA★');
    localStorage.removeItem('bluanja_cart');
    renderCart();
  };

  renderCart();
}

// INIT 
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  updateCartBadge();
  initIndexPage();
  initDetailPage();
  initCartPage();
});