// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('open', !open);
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  toggle.setAttribute('aria-expanded', 'false');
  nav.classList.remove('open');
}));

// Contact form: demo only — nothing is sent anywhere.
const form = document.getElementById('contact-form');
const thanks = document.getElementById('thank-you');
const error = document.getElementById('form-error');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!form.checkValidity()) {
    error.hidden = false;
    form.querySelector(':invalid').focus();
    return;
  }
  error.hidden = true;
  const name = form.name.value.trim().split(' ')[0];
  thanks.querySelector('.thank-you-title').textContent = `Thank you, ${name}! ☕`;
  form.hidden = true;
  thanks.hidden = false;
  thanks.focus();
});

// ---------- Order ahead (demo only — nothing is sent) ----------
const MENU = [
  { group: 'Coffee', drink: true, items: [
    ['Espresso', 3.00], ['Cappuccino', 4.50], ['Marigold Latte', 5.25], ['Honey Marigold Latte', 5.25, true], ['Cold Brew', 4.75] ] },
  { group: 'Tea & Other Drinks', drink: true, items: [
    ['Spiced Chai Latte', 4.75], ['Earl Grey Pot', 3.50], ['Hot Chocolate', 4.25] ] },
  { group: 'Bakes', drink: false, items: [
    ['Butter Croissant', 3.75], ['Cinnamon Roll', 4.25], ['Blueberry Muffin', 3.50], ['Banana Bread Slice', 3.95] ] },
];
const LARGE_EXTRA = 0.75;
const money = n => '$' + n.toFixed(2);

const dialog = document.getElementById('order-dialog');
const orderForm = document.getElementById('order-form');
const itemsBox = document.getElementById('order-items');
const timeSel = document.getElementById('order-time');
const totalEl = document.getElementById('order-total');
const orderError = document.getElementById('order-error');
const confirmBox = document.getElementById('order-confirm');

// Build item rows
let idx = 0;
MENU.forEach(cat => {
  const fs = document.createElement('fieldset');
  fs.className = 'order-group';
  fs.innerHTML = `<legend>${cat.group}</legend>`;
  cat.items.forEach(([name, price, seasonal]) => {
    const id = 'qty-' + (idx++);
    const row = document.createElement('div');
    row.className = 'order-row';
    const opts = Array.from({ length: 11 }, (_, n) => `<option value="${n}">${n}</option>`).join('');
    row.innerHTML = `<label for="${id}"><span class="item-name">${name}${seasonal ? ' <span class="tag">Seasonal</span>' : ''}</span> <span class="order-price">${money(price)}</span></label>
      <select id="${id}" class="qty" data-name="${name}" data-price="${price}" data-drink="${cat.drink}" aria-label="Quantity of ${name}">${opts}</select>`;
    fs.appendChild(row);
  });
  itemsBox.appendChild(fs);
});

// Pickup times: ASAP + 15-minute slots
timeSel.innerHTML = '<option value="ASAP">As soon as possible (about 10 min)</option>';
for (let m = 7 * 60 + 15; m <= 19 * 60 + 45; m += 15) {
  const h = Math.floor(m / 60), mm = String(m % 60).padStart(2, '0');
  const label = `${((h + 11) % 12) + 1}:${mm} ${h < 12 ? 'am' : 'pm'}`;
  timeSel.add(new Option(label, label));
}

function readOrder() {
  const large = document.getElementById('order-size').value === 'large';
  const lines = [];
  let total = 0;
  itemsBox.querySelectorAll('.qty').forEach(sel => {
    const q = +sel.value;
    if (!q) return;
    const unit = +sel.dataset.price + (large && sel.dataset.drink === 'true' ? LARGE_EXTRA : 0);
    total += unit * q;
    lines.push({ name: sel.dataset.name, q, sub: unit * q, drink: sel.dataset.drink === 'true' });
  });
  return { lines, total, large };
}
function updateTotal() {
  const { lines, total } = readOrder();
  totalEl.textContent = money(total);
  itemsBox.querySelectorAll('.order-row').forEach(r => r.classList.toggle('chosen', +r.querySelector('select').value > 0));
  if (lines.length) orderError.hidden = true;
}
orderForm.addEventListener('change', updateTotal);
orderForm.addEventListener('input', updateTotal);

function resetOrder() {
  orderForm.reset();
  orderForm.hidden = false;
  confirmBox.hidden = true;
  orderError.hidden = true;
  updateTotal();
}
document.getElementById('open-order').addEventListener('click', () => {
  if (!confirmBox.hidden) resetOrder();
  dialog.showModal();
  document.body.classList.add('modal-open');
});
const closeDialog = () => dialog.close();
document.getElementById('close-order').addEventListener('click', closeDialog);
document.getElementById('confirm-done').addEventListener('click', closeDialog);
dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
// Click on the backdrop (outside the panel) closes; Esc is native to <dialog>
dialog.addEventListener('click', e => { if (e.target === dialog) closeDialog(); });

orderForm.addEventListener('submit', e => {
  e.preventDefault();
  const { lines, total, large } = readOrder();
  const name = document.getElementById('order-name').value.trim();
  const problems = [];
  if (!lines.length) problems.push('choose at least one item');
  if (!name) problems.push('add a name for the order');
  if (problems.length) {
    orderError.textContent = 'Almost there! Please ' + problems.join(' and ') + '.';
    orderError.hidden = false;
    (lines.length ? document.getElementById('order-name') : itemsBox.querySelector('select')).focus();
    return;
  }
  const time = timeSel.value;
  const milk = document.getElementById('order-milk').value;
  const hasDrink = lines.some(l => l.drink);
  document.getElementById('confirm-title').textContent = `Thanks, ${name.split(' ')[0]}! Your order is in.`;
  document.getElementById('confirm-when').textContent =
    (time === 'ASAP' ? 'It’ll be ready in about 10 minutes.' : `It’ll be ready for pickup at ${time}.`) +
    (hasDrink ? ` Drinks: ${large ? 'large' : 'regular'}, ${milk.toLowerCase()}.` : '');
  const list = document.getElementById('confirm-list');
  list.innerHTML = '';
  lines.forEach(l => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${l.q} × ${l.name}</span><span>${money(l.sub)}</span>`;
    list.appendChild(li);
  });
  document.getElementById('confirm-total').textContent = money(total);
  orderForm.hidden = true;
  confirmBox.hidden = false;
  confirmBox.focus();
});
updateTotal();
