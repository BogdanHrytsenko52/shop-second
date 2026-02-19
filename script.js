import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, push, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyATJJPdiTWusShpRRZl2_KGLE4gIodM5SA",
    authDomain: "rewear-shop.firebaseapp.com",
    databaseURL: "https://rewear-shop-default-rtdb.firebaseio.com",
    projectId: "rewear-shop",
    storageBucket: "rewear-shop.firebasestorage.app",
    messagingSenderId: "59460582203",
    appId: "1:59460582203:web:855853b90c262506a7d51e"
};

const appInstance = initializeApp(firebaseConfig);
const db = getDatabase(appInstance);
const productsRef = ref(db, 'products');

const DICTIONARY = {
    en: { bag_title: "CART", subtotal: "SUBTOTAL", checkout: "PROCEED", add_cart: "ADD TO CART", close: "[CLOSE]", empty_bag: "ARCHIVE IS EMPTY" },
    ua: { bag_title: "КОШИК", subtotal: "СУМА", checkout: "ОФОРМИТИ", add_cart: "У КОШИК", close: "[ЗАКРИТИ]", empty_bag: "АРХІВ ПОРОЖНІЙ" }
};

const RATES = { USD: 1, UAH: 41, EUR: 0.92 };
const SYMBOLS = { USD: '$', UAH: '₴', EUR: '€' };

function animateHeroText() {
    const heroEl = document.getElementById('heroText');
    if(!heroEl) return;
    const lines = heroEl.innerHTML.split('<br>');
    heroEl.innerHTML = '';
    lines.forEach((line, lineIdx) => {
        const lineDiv = document.createElement('div');
        line.split('').forEach((char, charIdx) => {
            const span = document.createElement('span');
            span.innerHTML = char === ' ' ? '&nbsp;' : char;
            span.style.animationDelay = `${(lineIdx * 0.3) + (charIdx * 0.05)}s`;
            lineDiv.appendChild(span);
        });
        heroEl.appendChild(lineDiv);
    });
}

class Notificator {
    constructor() {
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.bottom = '40px';
        this.container.style.left = '40px';
        this.container.style.zIndex = '3000';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.gap = '10px';
        this.container.style.pointerEvents = 'none';
        document.body.appendChild(this.container);
    }
    show(msgKey) {
        const text = DICTIONARY[window.app.lang][msgKey] || msgKey;
        const toast = document.createElement('div');
        toast.innerText = text;
        toast.style.background = '#0F0F0F';
        toast.style.color = '#EDEDED';
        toast.style.border = '1px solid #1A1A1A';
        toast.style.padding = '16px 24px';
        toast.style.fontFamily = "'JetBrains Mono', monospace";
        toast.style.fontSize = '11px';
        toast.style.textTransform = 'uppercase';
        toast.style.letterSpacing = '1px';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.4s cubic-bezier(0.19, 1, 0.22, 1)';
        this.container.appendChild(toast);
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }
}

class SettingsManager {
    constructor() {
        this.currency = localStorage.getItem('rewear_currency') || 'EUR';
        this.theme = localStorage.getItem('rewear_theme') || 'void';
        this.init();
    }
    init() {
        this.setTheme(this.theme);
        this.setCurrency(this.currency);
    }
    setTheme(mode) {
        this.theme = mode;
        localStorage.setItem('rewear_theme', mode);
        document.body.className = '';
        document.body.classList.add('theme-' + mode);
        document.getElementById('themeVoid').className = mode === 'void' ? 'setting-card active' : 'setting-card';
        document.getElementById('themeConcrete').className = mode === 'concrete' ? 'setting-card active' : 'setting-card';
    }
    setCurrency(c) {
        this.currency = c;
        localStorage.setItem('rewear_currency', c);
        ['USD', 'UAH', 'EUR'].forEach(k => {
            const el = document.getElementById('curr' + k);
            if(el) el.className = k === c ? 'setting-card active' : 'setting-card';
        });
        if (window.app) {
            window.app.renderGrid();
            window.app.updateCartUI();
        }
    }
    formatPrice(p) {
        const val = Math.round(p * RATES[this.currency]);
        return `${SYMBOLS[this.currency]}${val}`;
    }
}

class ShopCore {
    constructor() {
        this.products = [];
        this.cart = [];
        this.currId = null;
        this.lang = localStorage.getItem('rewear_lang') || 'en';
        this.listenToCloud();
        this.setLang(this.lang);
        this.initSearch();
    }
    initSearch() {
        const searchInput = document.getElementById('search');
        if(searchInput) {
            searchInput.addEventListener('input', () => this.renderGrid());
        }
    }
    listenToCloud() {
        const loader = document.getElementById('itemCounter');
        onValue(productsRef, (snapshot) => {
            const data = snapshot.val();
            this.products = [];
            if (data) {
                Object.keys(data).forEach(key => {
                    this.products.push({ dbKey: key, ...data[key] });
                });
            }
            this.products.reverse();
            this.renderGrid();
            if(loader) loader.innerText = this.products.length;
        });
    }
    renderGrid() {
        const grid = document.getElementById('grid');
        const searchInput = document.getElementById('search');
        const term = searchInput ? searchInput.value.toLowerCase() : '';
        
        grid.innerHTML = '';
        const filtered = this.products.filter(p => p.name.toLowerCase().includes(term));
        
        filtered.forEach(p => {
            const el = document.createElement('div');
            el.className = 'card';
            const imgUrl = p.img ? `url(${p.img})` : 'none';

            el.innerHTML = `
                <div class="card-img-box" onclick="window.app.open('${p.dbKey}')">
                    <div class="card-img" style="background-image:${imgUrl};"></div>
                    <div class="card-overlay">ARCHIVE ITEM &rarr;</div>
                </div>
                <div class="card-divider"></div>
                <div class="card-info">
                    <div class="card-title">${p.name}</div>
                    <div class="card-price">${window.settings.formatPrice(p.price)}</div>
                </div>
            `;
            grid.appendChild(el);
        });
    }
    open(dbKey) {
        this.currId = dbKey;
        const p = this.products.find(x => x.dbKey === dbKey);
        if (!p) return;
        document.getElementById('mTitle').innerText = p.name;
        document.getElementById('mPrice').innerText = window.settings.formatPrice(p.price);
        document.getElementById('mId').innerText = p.dbKey.substring(1, 5).toUpperCase();

        const imgEl = document.getElementById('mImg');
        imgEl.src = p.img || '';
        imgEl.style.display = p.img ? 'block' : 'none';
        
        document.getElementById('adminDeleteBtn').style.display = (window.sysAdmin && window.sysAdmin.active) ? 'block' : 'none';
        window.ui.openModal();
    }
    addToCartFromModal() {
        const p = this.products.find(x => x.dbKey === this.currId);
        if (p) {
            this.cart.push(p);
            this.updateCartUI();
            window.notify.show('ADDED TO CART');
            window.ui.closeModal();
        }
    }
    removeFromCart(idx) {
        this.cart.splice(idx, 1);
        this.updateCartUI();
        window.notify.show('ITEM REMOVED');
    }
    checkout() {
        if (this.cart.length === 0) return;
        window.notify.show('ORDER INITIATED');
        this.cart = [];
        this.updateCartUI();
        window.ui.closeDrawers();
    }
    updateCartUI() {
        const list = document.getElementById('cartList');
        const total = document.getElementById('cartTotal');
        const count = document.getElementById('cartCount');
        list.innerHTML = '';
        let sum = 0;
        
        if (this.cart.length === 0) {
            list.innerHTML = `<div class="empty-cart-msg">${DICTIONARY[this.lang].empty_bag}</div>`;
        } else {
            this.cart.forEach((item, idx) => {
                sum += parseInt(item.price);
                const div = document.createElement('div');
                div.className = 'cart-item';
                div.innerHTML = `
                    <div class="cart-thumb" style="background-image:url(${item.img || ''});"></div>
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">${window.settings.formatPrice(item.price)}</div>
                    </div>
                    <div class="cart-item-remove" onclick="window.app.removeFromCart(${idx})">[X]</div>
                `;
                list.appendChild(div);
            });
        }
        total.innerText = window.settings.formatPrice(sum);
        count.innerText = this.cart.length;
    }
    setLang(l) {
        this.lang = l;
        localStorage.setItem('rewear_lang', l);
        ['en', 'ua'].forEach(k => {
            const el = document.getElementById('lang-' + k);
            if(el) el.className = k === l ? 'setting-card active' : 'setting-card';
        });
        const t = DICTIONARY[l];
        document.querySelectorAll('[data-t]').forEach(el => {
            const key = el.getAttribute('data-t');
            if (t[key]) el.innerHTML = t[key];
        });
        this.updateCartUI();
    }
}

class UIManager {
    constructor() {
        this.backdrop = document.getElementById('backdrop');
        this.backdrop.onclick = () => this.closeAll();
    }
    openDrawer(id) {
        document.getElementById(id).classList.add('open');
        this.backdrop.classList.add('active');
    }
    closeDrawers() {
        document.querySelectorAll('.drawer').forEach(d => d.classList.remove('open'));
        this.backdrop.classList.remove('active');
    }
    openModal() {
        document.getElementById('productModal').classList.add('active');
    }
    closeModal() {
        document.getElementById('productModal').classList.remove('active');
    }
    closeAll() {
        this.closeDrawers();
        this.closeModal();
    }
}

class AdminSystem {
    constructor() {
        this.active = false;
        this.passcode = "admin2026";
    }
    login() {
        const val = document.getElementById('adminPassInput').value.trim();
        if (val === this.passcode) {
            this.active = true;
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            document.getElementById('adminPassInput').value = '';
            window.notify.show('SYSTEM UNLOCKED');
        } else {
            window.notify.show('ACCESS DENIED');
        }
    }
    logout() {
        this.active = false;
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('adminDeleteBtn').style.display = 'none';
        window.notify.show('SYSTEM LOCKED');
    }
    createItem() {
        const name = document.getElementById('newItemName').value.trim();
        const price = document.getElementById('newItemPrice').value;
        const desc = document.getElementById('newItemDesc').value;
        const fileInput = document.getElementById('newItemImg');
        const btn = document.getElementById('btnPublish');

        if (!name || !price) {
            window.notify.show('ENTER NAME AND PRICE');
            return;
        }

        btn.innerText = "UPLOADING...";
        btn.style.pointerEvents = "none";

        let file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    let scaleSize = 1;
                    
                    if (img.width > MAX_WIDTH) {
                        scaleSize = MAX_WIDTH / img.width;
                    }
                    
                    canvas.width = img.width * scaleSize;
                    canvas.height = img.height * scaleSize;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                    this.saveToDb(name, price, desc, compressedBase64, btn);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            this.saveToDb(name, price, desc, null, btn);
        }
    }
    saveToDb(name, price, desc, imgBase64, btn) {
        push(ref(db, 'products'), {
            name: name,
            price: Number(price),
            desc: desc || "",
            img: imgBase64 || "",
            createdAt: Date.now()
        }).then(() => {
            document.getElementById('newItemName').value = '';
            document.getElementById('newItemPrice').value = '';
            document.getElementById('newItemDesc').value = '';
            document.getElementById('newItemImg').value = '';
            btn.innerText = "PUBLISH TO ARCHIVE";
            btn.style.pointerEvents = "auto";
            window.ui.closeDrawers();
            window.notify.show('PUBLISHED TO ARCHIVE');
        }).catch((error) => {
            console.error(error);
            btn.innerText = "ERROR. TRY AGAIN";
            btn.style.pointerEvents = "auto";
            window.notify.show('UPLOAD FAILED');
        });
    }
    deleteCurrentItem() {
        remove(ref(db, 'products/' + window.app.currId)).then(() => {
            window.ui.closeModal();
            window.notify.show('ITEM DELETED');
        });
    }
}

window.onload = () => {
    animateHeroText();
    window.notify = new Notificator();
    window.settings = new SettingsManager();
    window.app = new ShopCore();
    window.ui = new UIManager();
    window.sysAdmin = new AdminSystem();
};
