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
    en: { bag_title: "CART", subtotal: "SUBTOTAL", checkout: "PROCEED", add_cart: "ADD TO CART", close: "CLOSE", empty_bag: "ARCHIVE IS EMPTY" },
    ua: { bag_title: "КОШИК", subtotal: "СУМА", checkout: "ОФОРМИТИ", add_cart: "У КОШИК", close: "ЗАКРИТИ", empty_bag: "АРХІВ ПОРОЖНІЙ" },
    de: { bag_title: "WARENKORB", subtotal: "ZWISCHENSUMME", checkout: "WEITER", add_cart: "ZUM WARENKORB", close: "SCHLIEßEN", empty_bag: "LEER" }
};

const RATES = { USD: 1, UAH: 41, EUR: 0.92 };
const SYMBOLS = { USD: '$', UAH: '₴', EUR: '€' };

// Text Animation Logic (Split letters for CSS fade-in)
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
            // Stagger animation delay
            span.style.animationDelay = `${(lineIdx * 0.3) + (charIdx * 0.05)}s`;
            lineDiv.appendChild(span);
        });
        heroEl.appendChild(lineDiv);
    });
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
            document.getElementById('curr' + k).className = k === c ? 'setting-card active' : 'setting-card';
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
            loader.innerText = this.products.length;
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
            
            // Extracting logic: if your DB doesn't have size/cond, we hardcode fallback matching your requested style
            const size = p.size || 'M'; 
            const cond = p.condition || '8.5';

            el.innerHTML = `
                <div class="card-img-box" onclick="window.app.open('${p.dbKey}')">
                    <div class="card-img" style="background-image:${imgUrl}; background-size:cover; background-position:center;"></div>
                    <div class="card-overlay">ARCHIVE ITEM &rarr;</div>
                </div>
                <div class="card-info">
                    <div class="card-title">${p.name}</div>
                    <div class="card-meta">Size ${size}</div>
                    <div class="card-meta">Condition ${cond}</div>
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
        
        const d = new Date(p.createdAt || Date.now());
        document.getElementById('mDate').innerText = `${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;

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
            window.ui.closeModal();
        }
    }
    removeFromCart(idx) {
        this.cart.splice(idx, 1);
        this.updateCartUI();
    }
    checkout() {
        if (this.cart.length === 0) return;
        alert("ARCHIVE ORDER INITIATED");
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
            list.innerHTML = `<div style="padding-top:40px; color:var(--text-sec); font-family:var(--font-mono); font-size:11px;">${DICTIONARY[this.lang].empty_bag}</div>`;
        } else {
            this.cart.forEach((item, idx) => {
                sum += parseInt(item.price);
                const div = document.createElement('div');
                div.className = 'cart-item';
                div.innerHTML = `
                    <div class="cart-thumb" style="background-image:url(${item.img || ''}); background-size:cover; background-position:center;"></div>
                    <div style="flex:1; display:flex; flex-direction:column; justify-content:center;">
                        <div style="font-weight:500; font-size:13px; margin-bottom:8px; text-transform:uppercase;">${item.name}</div>
                        <div style="color:var(--accent); font-family:var(--font-mono); font-size:12px;">${window.settings.formatPrice(item.price)}</div>
                    </div>
                    <div class="link-hover" style="color:var(--text-sec); font-size:20px; display:flex; align-items:center;" onclick="window.app.removeFromCart(${idx})">&times;</div>
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
        }
    }
    logout() {
        this.active = false;
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('adminDeleteBtn').style.display = 'none';
    }
    createItem() {
        const name = document.getElementById('newItemName').value.trim();
        const price = document.getElementById('newItemPrice').value;
        const desc = document.getElementById('newItemDesc').value;
        const fileInput = document.getElementById('newItemImg');
        const btn = document.getElementById('btnPublish');

        if (!name || !price) return;

        btn.innerText = "UPLOADING...";
        let file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => this.saveToDb(name, price, desc, e.target.result, btn);
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
            createdAt: Date.now(),
            size: "M", // Mocked for design
            condition: "8.5" // Mocked for design
        }).then(() => {
            document.getElementById('newItemName').value = '';
            document.getElementById('newItemPrice').value = '';
            document.getElementById('newItemDesc').value = '';
            document.getElementById('newItemImg').value = '';
            btn.innerText = "PUBLISH TO ARCHIVE";
            window.ui.closeDrawers();
        });
    }
    deleteCurrentItem() {
        if (confirm('DELETE FROM ARCHIVE?')) {
            remove(ref(db, 'products/' + window.app.currId)).then(() => {
                window.ui.closeModal();
            });
        }
    }
}

// INIT
window.onload = () => {
    animateHeroText();
    window.settings = new SettingsManager();
    window.app = new ShopCore();
    window.ui = new UIManager();
    window.sysAdmin = new AdminSystem();
};
