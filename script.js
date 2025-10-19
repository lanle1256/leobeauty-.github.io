/* script.js
 - Quản lý giỏ hàng bằng localStorage (key: 'pastelCart')
 - Cung cấp: addToCart, renderCart, updateCartCount, clearCart, checkout
*/

const CART_KEY = 'pastelCart';

/* --- Helpers --- */
function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Lỗi đọc giỏ hàng', e);
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function formatVND(number) {
  return number.toLocaleString('vi-VN') + '₫';
}

/* --- Cart operations --- */
function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart(cart);
  updateCartCount();
  showToast('Đã thêm vào giỏ hàng 💚');
}

function removeFromCart(id) {
  let cart = getCart();
  cart = cart.filter(item => item.id !== id);
  saveCart(cart);
  updateCartCount();
  renderCart(); // if on cart page
}

function changeQty(id, qty) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, qty);
  saveCart(cart);
  updateCartCount();
  renderCart();
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartCount();
  renderCart();
}

function checkout() {
  const cart = getCart();
  if (cart.length === 0) {
    alert('Giỏ hàng rỗng.');
    return;
  }
  // demo: chỉ clear cart và thông báo
  const total = cart.reduce((s, it) => s + it.price * it.qty, 0);
  alert(`Cảm ơn bạn! Tổng thanh toán: ${formatVND(total)}\n(Đây là bản demo — không thanh toán thật.)`);
  clearCart();
}

/* --- UI --- */
function updateCartCount() {
  const countEl = document.getElementById('cart-count');
  if (!countEl) return;
  const cart = getCart();
  const totalQty = cart.reduce((s, it) => s + it.qty, 0);
  countEl.textContent = totalQty;
}

function showToast(text = 'Đã thêm vào giỏ') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = text;
  toast.style.display = 'block';
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.style.display = 'none';
  }, 1800);
}

/* --- Render cart page --- */
function renderCart() {
  const container = document.getElementById('cart-container');
  if (!container) return;
  const cart = getCart();
  if (cart.length === 0) {
    container.innerHTML = `<p>Giỏ hàng trống. <a href="products.html">Xem sản phẩm</a></p>`;
    return;
  }

  // Build table
  let html = `<table class="cart-table"><thead>
    <tr><th>Sản phẩm</th><th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th><th></th></tr>
  </thead><tbody>`;

  cart.forEach(item => {
    html += `<tr data-id="${item.id}">
      <td style="display:flex;gap:12px;align-items:center">
        <img class="cart-item-img" src="${item.image}" alt="${escapeHtml(item.name)}">
        <div>
          <div style="font-weight:700;color:#064124">${escapeHtml(item.name)}</div>
        </div>
      </td>
      <td>${formatVND(item.price)}</td>
      <td>
        <input type="number" min="1" value="${item.qty}" style="width:70px;padding:6px;border-radius:6px;border:1px solid #e6f2ea" data-qty>
      </td>
      <td style="font-weight:700;color:#064124">${formatVND(item.price * item.qty)}</td>
      <td><button class="btn ghost" data-remove>Loại</button></td>
    </tr>`;
  });

  const total = cart.reduce((s, it) => s + it.price * it.qty, 0);

  html += `</tbody></table>
    <div style="margin-top:12px;display:flex;justify-content:flex-end;align-items:center;gap:18px">
      <div style="font-weight:800;color:#063f2a">Tổng: ${formatVND(total)}</div>
    </div>`;

  container.innerHTML = html;

  // Attach events
  container.querySelectorAll('button[data-remove]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      const id = row.getAttribute('data-id');
      removeFromCart(id);
    });
  });

  container.querySelectorAll('input[data-qty]').forEach(input => {
    input.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10) || 1;
      const row = e.target.closest('tr');
      const id = row.getAttribute('data-id');
      changeQty(id, val);
    });
  });
}

/* escape helper for safety when injecting text */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* --- Event wiring on pages --- */
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();

  // Attach add-to-cart buttons (products.html)
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.product-card');
      const product = {
        id: card.getAttribute('data-id'),
        name: card.getAttribute('data-name'),
        price: Number(card.getAttribute('data-price')),
        image: card.getAttribute('data-image')
      };
      addToCart(product);
    });
  });

  // Header cart links updated (in case cart changed)
  const cartLinks = document.querySelectorAll('.cart-link');
  cartLinks.forEach(a => a.addEventListener('click', () => updateCartCount()));

  // Toast for generic add (some pages may call showToast)
  // Clear / checkout buttons on cart page
  const clearBtn = document.getElementById('clear-cart');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn xoá toàn bộ giỏ hàng?')) clearCart();
    });
  }
  const checkoutBtn = document.getElementById('checkout');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => checkout());
  }

  // If on cart page, render the cart
  if (document.getElementById('cart-container')) {
    renderCart();
  }

  // Contact form demo
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const sendBtn = document.getElementById('send-message');
    sendBtn.addEventListener('click', () => {
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const message = document.getElementById('message').value.trim();
      if (!name || !email || !message) {
        alert('Vui lòng điền đầy đủ thông tin.');
        return;
      }
      alert('Cảm ơn ' + name + '! Tin nhắn của bạn đã được gửi (demo).');
      contactForm.reset();
    });
  }

  // Xử lý đặt hàng với thông tin người mua
  const orderForm = document.getElementById('order-form');
  if (orderForm) {
    orderForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = document.getElementById('buyer-name').value.trim();
      const email = document.getElementById('buyer-email').value.trim();
      const phone = document.getElementById('buyer-phone').value.trim();
      const address = document.getElementById('buyer-address').value.trim();
      const payment = document.getElementById('buyer-payment').value;
      const cart = getCart();

      if (!name || !email || !phone || !address || !payment) {
        alert('Vui lòng điền đầy đủ thông tin.');
        return;
      }
      if (cart.length === 0) {
        alert('Giỏ hàng rỗng.');
        return;
      }

      // Demo: chỉ hiển thị thông tin, không gửi đi đâu cả
      let info = `Cảm ơn bạn ${name}!\nEmail: ${email}\nSĐT: ${phone}\nĐịa chỉ: ${address}\nThanh toán: ${payment === 'cod' ? 'COD' : 'Chuyển khoản'}\nTổng tiền: ${formatVND(cart.reduce((s, it) => s + it.price * it.qty, 0))}\n(Đây là bản demo — không thanh toán thật.)`;
      alert(info);
      clearCart();
      orderForm.reset();
      renderCart();
    });
  }
});
