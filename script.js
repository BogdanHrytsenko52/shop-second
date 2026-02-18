// ============================================================
// 1. ПІДКЛЮЧЕННЯ FIREBASE (GOOGLE DATABASE)
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ТВОЯ КОНФІГУРАЦІЯ
const firebaseConfig = {
  apiKey: "AIzaSyATJJPdiTWusShpRRZl2_KGLE4gIodM5SA",
  authDomain: "rewear-shop.firebaseapp.com",
  // Я додав цей рядок, щоб база точно працювала в Європі:
  databaseURL: "https://rewear-shop-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "rewear-shop",
  storageBucket: "rewear-shop.firebasestorage.app",
  messagingSenderId: "59460582203",
  appId: "1:59460582203:web:855853b90c262506a7d51e"
};

// Ініціалізація бази
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const productsRef = ref(db, 'products'); // Гілка з товарами

// ============================================================
// 2. НАЛАШТУВАННЯ ТА СИСТЕМА
// ============================================================

const dict = {
    en: {
        hero: "MATTE<br>OBJECTS",
        nav_sys: "SYSTEM", nav_bag: "BAG", bag_title: "YOUR BAG",
        sys_title: "SYSTEM", close: "CLOSE", subtotal: "SUBTOTAL",
        checkout: "PROCEED", add_cart: "ADD TO CART",
        s_visual: "VISUAL MODE", s_audio: "AUDIO UI", s_lang: "LOCALIZATION",
        s_curr: "CURRENCY", s_admin: "ADMIN ACCESS",
        t_matte: "MATTE BLACK", t_modern: "MODERN GREY", btn_login: "UNLOCK"
    },
    ua: {
        hero: "МАТОВИЙ<br>АРХІВ",
        nav_sys: "СИСТЕМА", nav_bag: "КОШИК", bag_title: "ВАШ КОШИК",
        sys_title: "НАЛАШТУВАННЯ", close: "ЗАКРИТИ", subtotal: "СУМА",
        checkout: "ОФОРМИТИ", add_cart: "У КОШИК",
        s_visual: "ТЕМА ДИЗАЙНУ", s_audio: "ЗВУКИ", s_lang: "МОВА",
        s_curr: "ВАЛЮТА", s_admin: "ВХІД ПРОДАВЦЯ",
        t_matte: "ГЛИБОКИЙ ЧОРНИЙ", t_modern: "ТЕХНО СІРИЙ", btn_login: "УВІЙТИ"
    },
    de: {
        hero: "MATTE<br>OBJEKTE",
        nav_sys: "SYSTEM", nav_bag: "TASCHE", bag_title: "IHRE TASCHE",
        sys_title: "EINSTELLUNGEN", close: "SCHLIEßEN", subtotal: "ZWISCHENSUMME",
        checkout: "WEITER", add_cart: "IN DEN WARENKORB",
        s_visual: "VISUELLER MODUS", s_audio: "AUDIO", s_lang: "SPRACHE",
        s_curr: "WÄHRUNG", s_admin: "VERKÄUFERZUGANG",
        t_matte: "MATTSCHWARZ", t_modern: "MODERN GRAU", btn_login: "ENTSPERREN"
    }
};

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playClick() {
    if(!window.settings.soundEnabled) return;
    if(audioCtx.state === 'suspended') audioCtx.resume();
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 600;
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    } catch(e) {}
}

const rates = { USD: 1, UAH: 41, EUR: 0.92 };
const symbols = { USD: '$', UAH: '₴', EUR: '€' };

class Settings {
    constructor() {
        this.currency = 'USD';
        this.soundEnabled = true;
    }
    setTheme(mode) {
        playClick();
        document.body.className = '';
        document.body.classList.add('theme-' + mode);
        document.getElementById('themeMatte').className = mode === 'matte' ? 'setting-card active' : 'setting-card';
        document.getElementById('themeModern').className = mode === 'modern' ? 'setting-card active' : 'setting-card';
    }
    setSound(bool) {
        this.soundEnabled = bool;
        if(bool) playClick();
        document.getElementById('soundOn').className = bool ? 'setting-card active' : 'setting-card';
        document.getElementById('soundOff').className = !bool ? 'setting-card active' : 'setting-card';
    }
    setCurrency(c) {
        playClick();
        this.currency = c;
        ['USD','UAH','EUR'].forEach(k => {
            document.getElementById('curr'+k).className = k === c ? 'setting-card active' : 'setting-card';
        });
        window.app.renderGrid();
        window.app.updateCart();
    }
    formatPrice(p) {
        const val = Math.round(p * rates[this.currency]);
        return `${symbols[this.currency]}${val}`;
    }
    reset() {
        alert("System Reset. Reloading...");
        location.reload();
    }
}

class App {
    constructor() {
        this.products = [];
        this.cart = [];
        this.currId = null;
        this.lang = 'en';
        
        // СЛУХАЄМО БАЗУ ДАНИХ (Realtime Listener)
        onValue(productsRef, (snapshot) => {
            const data = snapshot.val();
            this.products = [];
            if (data) {
                // Конвертуємо об'єкт бази в масив
                Object.keys(data).forEach(key => {
                    this.products.push({
                        dbKey: key, // Унікальний ключ Firebase
                        ...data[key]
                    });
                });
            }
            this.products.reverse(); // Нові зверху
            this.renderGrid();
        });
    }

    renderGrid() {
        const grid = document.getElementById('grid');
        const term = document.getElementById('search').value.toLowerCase();
        grid.innerHTML = '';
        const filtered = this.products.filter(p => p.name.toLowerCase().includes(term));
        document.getElementById('itemCounter').innerText = `${filtered.length} ARCHIVE UNITS`;

        filtered.forEach(p => {
            const el = document.createElement('div');
            el.className = 'card fade-in';
            const imgUrl = p.img ? `url(${p.img})` : 'none';
            const noImg = p.img ? '' : '<span style="color:var(--text-sec); font-size:10px;">NO IMG</span>';
            
            el.innerHTML = `
                <div class="card-img-box">
                    <div class="card-img" style="background-image:${imgUrl}; background-size:cover; background-position:center;"></div>
                    <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);">${noImg}</div>
                </div>
                <div class="card-info">
                    <span class="card-title">${p.name}</span>
                    <span class="card-price">${window.settings.formatPrice(p.price)}</span>
                </div>
            `;
            el.onclick = () => { playClick(); this.open(p.dbKey); };
            grid.appendChild(el);
        });
    }

    open(dbKey) {
        this.currId = dbKey;
        const p = this.products.find(x => x.dbKey === dbKey);
        if(!p) return;
        
        document.getElementById('mTitle').innerText = p.name;
        document.getElementById('mPrice').innerText = window.settings.formatPrice(p.price);
        document.getElementById('mDesc').innerText = p.desc || "No data.";
        document.getElementById('mId').innerText = p.dbKey.substring(1, 6); // Short ID
        
        const imgEl = document.getElementById('mImg');
        imgEl.src = p.img || '';
        imgEl.style.display = p.img ? 'block' : 'none';

        if(window.sysAdmin.active) {
            document.getElementById('mViewMode').style.display = 'none';
            document.getElementById('mEditMode').style.display = 'block';
            document.getElementById('mImgEditBtn').style.display = 'block';
            document.getElementById('eTitle').value = p.name;
            document.getElementById('ePrice').value = p.price;
            document.getElementById('eDesc').value = p.desc;
        } else {
            document.getElementById('mViewMode').style.display = 'block';
            document.getElementById('mEditMode').style.display = 'none';
            document.getElementById('mImgEditBtn').style.display = 'none';
        }
        window.ui.openModal();
    }

    addToCartFromModal() {
        playClick();
        const p = this.products.find(x => x.dbKey === this.currId);
        this.cart.push(p);
        this.updateCart();
        window.ui.closeModal();
        window.ui.openDrawer('cartDrawer');
    }

    updateCart() {
        const list = document.getElementById('cartList');
        const total = document.getElementById('cartTotal');
        const count = document.getElementById('cartCount');
        list.innerHTML = '';
        let sum = 0;
        
        this.cart.forEach((item, idx) => {
            sum += parseInt(item.price);
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <div class="cart-thumb" style="background-image:url(${item.img||''}); background-size:cover; background-position:center; background-color:#111;"></div>
                <div style="flex:1;">
                    <div style="font-weight:700; font-size:11px;">${item.name}</div>
                    <div style="color:var(--text-sec); font-size:10px;">${window.settings.formatPrice(item.price)}</div>
                </div>
                <div style="color:var(--text-sec); font-size:9px; cursor:pointer;" onclick="window.app.remCart(${idx})">REMOVE</div>
            `;
            list.appendChild(div);
        });
        
        total.innerText = window.settings.formatPrice(sum);
        count.innerText = `(${this.cart.length})`;
    }

    remCart(idx) { playClick(); this.cart.splice(idx, 1); this.updateCart(); }

    setLang(l) {
        playClick();
        this.lang = l;
        ['en','ua','de'].forEach(k => {
            document.getElementById('lang-'+k).className = k === l ? 'btn-outline active' : 'btn-outline';
        });
        const t = dict[l];
        document.querySelectorAll('[data-t]').forEach(el => {
            const key = el.getAttribute('data-t');
            if(t[key]) el.innerHTML = t[key];
        });
    }
}

class UI {
    constructor() {
        this.backdrop = document.getElementById('backdrop');
        this.backdrop.onclick = () => this.closeAll();
        document.getElementById('search').oninput = () => window.app.renderGrid();
    }
    openDrawer(id) { document.getElementById(id).classList.add('open'); this.backdrop.classList.add('active'); }
    closeDrawers() { playClick(); document.querySelectorAll('.drawer').forEach(d => d.classList.remove('open')); this.backdrop.classList.remove('active'); }
    openModal() { document.getElementById('productModal').classList.add('active'); }
    closeModal() { document.getElementById('productModal').classList.remove('active'); }
    closeAll() { this.closeDrawers(); this.closeModal(); }
}

class Admin {
    constructor() { this.active = false; this.tempImg = null; }
    login() {
        playClick();
        const val = document.getElementById('adminPassInput').value.trim();
        if(val === 'admin2026') {
            this.active = true;
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            window.app.renderGrid();
        } else alert('ACCESS DENIED');
    }
    logout() {
        playClick();
        this.active = false;
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('adminPassInput').value = '';
        window.app.renderGrid();
    }
    create() {
        // ВІДПРАВКА В FIREBASE
        push(productsRef, {
            name: "NEW ITEM",
            price: 0,
            desc: "Description...",
            img: null,
            createdAt: Date.now()
        });
        window.ui.closeDrawers();
    }
    updateImgPreview(input) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.tempImg = e.target.result;
            document.getElementById('mImg').src = this.tempImg;
            document.getElementById('mImg').style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
    saveChanges() {
        playClick();
        // ОНОВЛЕННЯ В FIREBASE
        const dbKey = window.app.currId;
        const updates = {
            name: document.getElementById('eTitle').value.toUpperCase(),
            price: document.getElementById('ePrice').value,
            desc: document.getElementById('eDesc').value
        };
        if(this.tempImg) updates.img = this.tempImg;

        update(ref(db, 'products/' + dbKey), updates);
        
        this.tempImg = null;
        window.ui.closeModal();
    }
    deleteCurrent() {
        playClick();
        if(confirm('DELETE PERMANENTLY?')) {
            // ВИДАЛЕННЯ З FIREBASE
            remove(ref(db, 'products/' + window.app.currId));
            window.ui.closeModal();
        }
    }
}

// Global Init
window.settings = new Settings();
window.app = new App();
window.ui = new UI();
window.sysAdmin = new Admin();