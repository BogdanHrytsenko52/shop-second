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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const productsRef = ref(db, 'products');

const DICTIONARY = {
    en: {
        hero: "MATTE<br>OBJECTS", nav_sys: "SYSTEM", nav_bag: "BAG", bag_title: "YOUR BAG", sys_title: "SYSTEM", close: "CLOSE",
        subtotal: "SUBTOTAL", checkout: "PROCEED", add_cart: "ADD TO CART", s_visual: "VISUAL MODE", s_audio: "AUDIO UI",
        s_lang: "LOCALIZATION", s_curr: "CURRENCY", t_matte: "MATTE BLACK", t_modern: "MODERN GREY", s_admin: "ADMIN ACCESS", btn_login: "UNLOCK",
        empty_bag: "YOUR BAG IS EMPTY", item_added: "ITEM ADDED TO BAG", item_removed: "ITEM REMOVED",
        order_success: "ORDER RECEIVED (DEMO)", access_granted: "ADMIN ACCESS GRANTED", access_denied: "ACCESS DENIED", saved: "PUBLISHED TO CLOUD", deleted: "ITEM DELETED"
    },
    ua: {
        hero: "МАТОВИЙ<br>АРХІВ", nav_sys: "СИСТЕМА", nav_bag: "КОШИК", bag_title: "ВАШ КОШИК", sys_title: "НАЛАШТУВАННЯ", close: "ЗАКРИТИ",
        subtotal: "СУМА", checkout: "ОФОРМИТИ", add_cart: "У КОШИК", s_visual: "ТЕМА ДИЗАЙНУ", s_audio: "ЗВУКИ",
        s_lang: "МОВА", s_curr: "ВАЛЮТА", t_matte: "ГЛИБОКИЙ ЧОРНИЙ", t_modern: "ТЕХНО СІРИЙ", s_admin: "ВХІД ПРОДАВЦЯ", btn_login: "УВІЙТИ",
        empty_bag: "КОШИК ПОРОЖНІЙ", item_added: "ТОВАР ДОДАНО", item_removed: "ТОВАР ВИДАЛЕНО",
        order_success: "ЗАМОВЛЕННЯ ПРИЙНЯТО (ДЕМО)", access_granted: "РЕЖИМ ПРОДАВЦЯ АКТИВНИЙ", access_denied: "ДОСТУП ЗАБОРОНЕНО", saved: "ТОВАР ОПУБЛІКОВАНО", deleted: "ТОВАР ВИДАЛЕНО"
    },
    de: {
        hero: "MATTE<br>OBJEKTE", nav_sys: "SYSTEM", nav_bag: "TASCHE", bag_title: "IHRE TASCHE", sys_title: "EINSTELLUNGEN", close: "SCHLIEßEN",
        subtotal: "ZWISCHENSUMME", checkout: "WEITER", add_cart: "IN DEN WARENKORB", s_visual: "VISUELLER MODUS", s_audio: "AUDIO",
        s_lang: "SPRACHE", s_curr: "WÄHRUNG", t_matte: "MATTSCHWARZ", t_modern: "MODERN GRAU", s_admin: "VERKÄUFERZUGANG", btn_login: "ENTSPERREN",
        empty_bag: "TASCHE IST LEER", item_added: "ZUM WARENKORB HINZUGEFÜGT", item_removed: "ARTIKEL ENTFERNT",
        order_success: "BESTELLUNG AUFGENOMMEN", access_granted: "ADMINISTRATOR ZUGRIFF", access_denied: "ZUGRIFF VERWEIGERT", saved: "VERÖFFENTLICHT", deleted: "GELÖSCHT"
    }
};

const RATES = { USD: 1, UAH: 41, EUR: 0.92 };
const SYMBOLS = { USD: '$', UAH: '₴', EUR: '€' };

class AudioController {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = localStorage.getItem('rewear_sound') === 'false' ? false : true;
    }
    click() {
        if (!this.enabled) return;
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.frequency.value = 600;
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }
    error() {
        if (!this.enabled) return;
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.frequency.value = 150;
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }
    success() {
        if (!this.enabled) return;
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }
    toggle(bool) {
        this.enabled = bool;
        localStorage.setItem('rewear_sound', bool);
    }
    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
}

class Notificator {
    constructor() {
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.bottom = '30px';
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
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
        toast.style.background = '#fff';
        toast.style.color = '#000';
        toast.style.padding = '12px 24px';
        toast.style.fontSize = '10px';
        toast.style.fontWeight = '700';
        toast.style.letterSpacing = '1px';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s cubic-bezier(0.19, 1, 0.22, 1)';
        this.container.appendChild(toast);
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

class SettingsManager {
    constructor() {
        this.currency = localStorage.getItem('rewear_currency') || 'USD';
        this.theme = localStorage.getItem('rewear_theme') || 'matte';
        this.init();
    }
    init() {
        this.setTheme(this.theme, false);
        this.setCurrency(this.currency, false);
        const soundState = localStorage.getItem('rewear_sound') === 'false' ? false : true;
        this.updateSoundUI(soundState);
    }
    setTheme(mode, notify = true) {
        if (notify) window.audio.click();
        this.theme = mode;
        localStorage.setItem('rewear_theme', mode);
        document.body.className = '';
        document.body.classList.add('theme-' + mode);
        document.getElementById('themeMatte').className = mode === 'matte' ? 'setting-card active' : 'setting-card';
        document.getElementById('themeModern').className = mode === 'modern' ? 'setting-card active' : 'setting-card';
    }
    setCurrency(c, notify = true) {
        if (notify) window.audio.click();
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
    setSound(bool) {
        window.audio.toggle(bool);
        this.updateSoundUI(bool);
        if (bool) window.audio.click();
    }
    updateSoundUI(bool) {
        document.getElementById('soundOn').className = bool ? 'setting-card active' : 'setting-card';
        document.getElementById('soundOff').className = !bool ? 'setting-card active' : 'setting-card';
    }
    formatPrice(p) {
        const val = Math.round(p * RATES[this.currency]);
        return `${SYMBOLS[this.currency]}${val}`;
    }
    reset() {
        if (confirm('SYSTEM RESET REQUESTED. CONFIRM?')) {
            localStorage.clear();
            location.reload();
        }
    }
}

class ShopCore {
    constructor() {
        this.products = [];
        this.cart = [];
        this.currId = null;
        this.lang = localStorage.getItem('rewear_lang') || 'en';
        this.listenToCloud();
        this.setLang(this.lang, false);
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
            loader.innerText = `${this.products.length} ARCHIVE UNITS`;
        }, (error) => {
            console.error(error);
            loader.innerText = "OFFLINE MODE";
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
            el.className = 'card fade-in';
            const imgUrl = p.img ? `url(${p.img})` : 'none';
            const noImg = p.img ? '' : '<span style="color:var(--text-sec); font-size:10px;">NO IMG</span>';
            el.innerHTML = `
                <div class="card-img-box">
                    <div class="card-img" style="background-image:${imgUrl}; background-size:cover; background-position:center;"></div>
                    <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); pointer-events:none;">${noImg}</div>
                </div>
                <div class="card-info">
                    <span class="card-title">${p.name}</span>
                    <span class="card-price">${window.settings.formatPrice(p.price)}</span>
                </div>
            `;
            el.onclick = () => {
                window.audio.click();
                this.open(p.dbKey);
            };
            grid.appendChild(el);
        });
    }
    open(dbKey) {
        this.currId = dbKey;
        const p = this.products.find(x => x.dbKey === dbKey);
        if (!p) return;
        document.getElementById('mTitle').innerText = p.name;
        document.getElementById('mPrice').innerText = window.settings.formatPrice(p.price);
        document.getElementById('mDesc').innerText = p.desc || "No description available.";
        document.getElementById('mId').innerText = p.dbKey.substring(1, 8).toUpperCase();
        const imgEl = document.getElementById('mImg');
        imgEl.src = p.img || '';
        imgEl.style.display = p.img ? 'block' : 'none';
        
        // Показувати кнопку видалення тільки якщо адмін онлайн
        document.getElementById('adminDeleteBtn').style.display = (window.sysAdmin && window.sysAdmin.active) ? 'block' : 'none';
        
        window.ui.openModal();
    }
    addToCartFromModal() {
        const p = this.products.find(x => x.dbKey === this.currId);
        if (p) {
            this.cart.push(p);
            this.updateCartUI();
            window.audio.success();
            window.notify.show('item_added');
            window.ui.closeModal();
        }
    }
    removeFromCart(idx) {
        this.cart.splice(idx, 1);
        this.updateCartUI();
        window.audio.click();
        window.notify.show('item_removed');
    }
    checkout() {
        if (this.cart.length === 0) return;
        window.audio.success();
        window.notify.show('order_success');
        this.cart = [];
        this.updateCartUI();
        window.ui.closeDrawers();
    }
    updateCartUI() {
        const list = document.getElementById('cartList');
        const total = document.getElementById('cartTotal');
        const count = document.getElementById('cartCount');
        const checkoutBtn = document.querySelector('#cartDrawer .btn');
        list.innerHTML = '';
        let sum = 0;
        if (this.cart.length === 0) {
            list.innerHTML = `<div style="text-align:center; padding-top:50px; color:var(--text-sec); font-size:10px;">${DICTIONARY[this.lang].empty_bag}</div>`;
            checkoutBtn.style.opacity = '0.5';
            checkoutBtn.style.pointerEvents = 'none';
        } else {
            checkoutBtn.style.opacity = '1';
            checkoutBtn.style.pointerEvents = 'auto';
            this.cart.forEach((item, idx) => {
                sum += parseInt(item.price);
                const div = document.createElement('div');
                div.className = 'cart-item';
                div.innerHTML = `
                    <div class="cart-thumb" style="background-image:url(${item.img || ''}); background-size:cover; background-position:center; background-color:#111;"></div>
                    <div style="flex:1;">
                        <div style="font-weight:700; font-size:11px; margin-bottom:5px;">${item.name}</div>
                        <div style="color:var(--text-sec); font-size:10px;">${window.settings.formatPrice(item.price)}</div>
                    </div>
                    <div style="color:var(--text-sec); font-size:9px; cursor:pointer;" onclick="window.app.removeFromCart(${idx})">×</div>
                `;
                list.appendChild(div);
            });
        }
        total.innerText = window.settings.formatPrice(sum);
        count.innerText = `(${this.cart.length})`;
    }
    setLang(l, notify = true) {
        if (notify) window.audio.click();
        this.lang = l;
        localStorage.setItem('rewear_lang', l);
        ['en', 'ua', 'de'].forEach(k => {
            document.getElementById('lang-' + k).className = k === l ? 'btn-outline active' : 'btn-outline';
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
        window.audio.click();
        document.getElementById(id).classList.add('open');
        this.backdrop.classList.add('active');
    }
    closeDrawers() {
        window.audio.click();
        document.querySelectorAll('.drawer').forEach(d => d.classList.remove('open'));
        this.backdrop.classList.remove('active');
    }
    openModal() {
        document.getElementById('productModal').classList.add('active');
    }
    closeModal() {
        window.audio.click();
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
        this.passcode = "admin2026"; // Ваш пароль
    }
    
    login() {
        const val = document.getElementById('adminPassInput').value.trim();
        if (val === this.passcode) {
            this.active = true;
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            document.getElementById('adminPassInput').value = '';
            window.audio.success();
            window.notify.show('access_granted');
        } else {
            window.audio.error();
            window.notify.show('access_denied');
        }
    }
    
    logout() {
        this.active = false;
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('adminDeleteBtn').style.display = 'none';
        window.audio.click();
    }

    createItem() {
        const name = document.getElementById('newItemName').value.trim();
        const price = document.getElementById('newItemPrice').value;
        const desc = document.getElementById('newItemDesc').value;
        const fileInput = document.getElementById('newItemImg');
        const btn = document.getElementById('btnPublish');

        if (!name || !price) {
            window.audio.error();
            alert(window.app.lang === 'ua' ? "Введіть назву та ціну!" : "Enter name and price!");
            return;
        }

        btn.innerText = "UPLOADING...";
        btn.style.pointerEvents = "none";

        let file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.saveToDb(name, price, desc, e.target.result, btn);
            };
            reader.readAsDataURL(file);
        } else {
            this.saveToDb(name, price, desc, null, btn);
        }
    }

    saveToDb(name, price, desc, imgBase64, btn) {
        push(ref(db, 'products'), {
            name: name.toUpperCase(),
            price: Number(price),
            desc: desc || "",
            img: imgBase64 || "",
            createdAt: Date.now()
        }).then(() => {
            window.audio.success();
            document.getElementById('newItemName').value = '';
            document.getElementById('newItemPrice').value = '';
            document.getElementById('newItemDesc').value = '';
            document.getElementById('newItemImg').value = '';
            btn.innerText = "PUBLISH ITEM";
            btn.style.pointerEvents = "auto";
            window.ui.closeDrawers();
            window.notify.show('saved');
        }).catch((error) => {
            console.error(error);
            window.audio.error();
            btn.innerText = "ERROR! CHECK RULES";
            btn.style.pointerEvents = "auto";
            alert("Помилка запису. Перевірте Firebase Rules (дозволи).");
        });
    }

    deleteCurrentItem() {
        if (confirm(window.app.lang === 'ua' ? 'Точно видалити цей товар?' : 'Confirm deletion?')) {
            remove(ref(db, 'products/' + window.app.currId)).then(() => {
                window.audio.click();
                window.ui.closeModal();
                window.notify.show('deleted');
            });
        }
    }
}

// GLOBAL INIT
window.onload = () => {
    window.audio = new AudioController();
    window.notify = new Notificator();
    window.settings = new SettingsManager();
    window.app = new ShopCore();
    window.ui = new UIManager();
    window.sysAdmin = new AdminSystem();
};
