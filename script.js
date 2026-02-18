import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyATJJPdiTWusShpRRZl2_KGLE4gIodM5SA",
    authDomain: "rewear-shop.firebaseapp.com",
    // 👇 ЦЕЙ РЯДОК Я ДОДАВ. ЯКЩО НЕ ПРАЦЮЄ, ЗАМІНИ НА СВІЙ З FIREBASE КОНСОЛІ
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
        hero: "MATTE<br>OBJECTS",
        nav_sys: "SYSTEM",
        nav_bag: "BAG",
        bag_title: "YOUR BAG",
        sys_title: "SYSTEM",
        close: "CLOSE",
        subtotal: "SUBTOTAL",
        checkout: "PROCEED",
        add_cart: "ADD TO CART",
        s_visual: "VISUAL MODE",
        s_audio: "AUDIO UI",
        s_lang: "LOCALIZATION",
        s_curr: "CURRENCY",
        s_admin: "ADMIN ACCESS",
        t_matte: "MATTE BLACK",
        t_modern: "MODERN GREY",
        btn_login: "UNLOCK",
        empty_bag: "YOUR BAG IS EMPTY",
        item_added: "ITEM ADDED TO BAG",
        item_removed: "ITEM REMOVED",
        access_denied: "ACCESS DENIED",
        access_granted: "ADMIN ACCESS GRANTED",
        saved: "CHANGES SAVED TO CLOUD",
        deleted: "ITEM DELETED PERMANENTLY",
        fill_data: "PLEASE FILL ALL FIELDS"
    },
    ua: {
        hero: "МАТОВИЙ<br>АРХІВ",
        nav_sys: "СИСТЕМА",
        nav_bag: "КОШИК",
        bag_title: "ВАШ КОШИК",
        sys_title: "НАЛАШТУВАННЯ",
        close: "ЗАКРИТИ",
        subtotal: "СУМА",
        checkout: "ОФОРМИТИ",
        add_cart: "У КОШИК",
        s_visual: "ТЕМА ДИЗАЙНУ",
        s_audio: "ЗВУКИ",
        s_lang: "МОВА",
        s_curr: "ВАЛЮТА",
        s_admin: "ВХІД ПРОДАВЦЯ",
        t_matte: "ГЛИБОКИЙ ЧОРНИЙ",
        t_modern: "ТЕХНО СІРИЙ",
        btn_login: "УВІЙТИ",
        empty_bag: "КОШИК ПОРОЖНІЙ",
        item_added: "ТОВАР ДОДАНО",
        item_removed: "ТОВАР ВИДАЛЕНО",
        access_denied: "ДОСТУП ЗАБОРОНЕНО",
        access_granted: "РЕЖИМ ПРОДАВЦЯ АКТИВНИЙ",
        saved: "ЗБЕРЕЖЕНО В ХМАРУ",
        deleted: "ТОВАР ВИДАЛЕНО НАЗАВЖДИ",
        fill_data: "ЗАПОВНІТЬ ВСІ ПОЛЯ"
    },
    de: {
        hero: "MATTE<br>OBJEKTE",
        nav_sys: "SYSTEM",
        nav_bag: "TASCHE",
        bag_title: "IHRE TASCHE",
        sys_title: "EINSTELLUNGEN",
        close: "SCHLIEßEN",
        subtotal: "ZWISCHENSUMME",
        checkout: "WEITER",
        add_cart: "IN DEN WARENKORB",
        s_visual: "VISUELLER MODUS",
        s_audio: "AUDIO",
        s_lang: "SPRACHE",
        s_curr: "WÄHRUNG",
        s_admin: "VERKÄUFERZUGANG",
        t_matte: "MATTSCHWARZ",
        t_modern: "MODERN GRAU",
        btn_login: "ENTSPERREN",
        empty_bag: "TASCHE IST LEER",
        item_added: "ZUM WARENKORB HINZUGEFÜGT",
        item_removed: "ARTIKEL ENTFERNT",
        access_denied: "ZUGRIFF VERWEIGERT",
        access_granted: "ADMINISTRATOR ZUGRIFF",
        saved: "IN DER CLOUD GESPEICHERT",
        deleted: "DAUERHAFT GELÖSCHT",
        fill_data: "BITTE ALLE FELDER AUSFÜLLEN"
    }
};

const RATES = {
    USD: 1,
    UAH: 41,
    EUR: 0.92
};

const SYMBOLS = {
    USD: '$',
    UAH: '₴',
    EUR: '€'
};

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
        setTimeout(() => {
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(this.ctx.destination);
            osc2.frequency.value = 1200;
            gain2.gain.setValueAtTime(0.02, this.ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
            osc2.start();
            osc2.stop(this.ctx.currentTime + 0.1);
        }, 50);
    }

    toggle(bool) {
        this.enabled = bool;
        localStorage.setItem('rewear_sound', bool);
        if (bool) this.success();
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
    }

    listenToCloud() {
        const loader = document.getElementById('itemCounter');
        onValue(productsRef, (snapshot) => {
            const data = snapshot.val();
            this.products = [];
            if (data) {
                Object.keys(data).forEach(key => {
                    this.products.push({
                        dbKey: key,
                        ...data[key]
                    });
                });
            }
            this.products.reverse();
            this.renderGrid();
            loader.innerText = `${this.products.length} ARCHIVE UNITS`;
        });
    }

    renderGrid() {
        const grid = document.getElementById('grid');
        const term = document.getElementById('search').value.toLowerCase();
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
                    <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);">${noImg}</div>
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

        if (window.sysAdmin.active) {
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
        document.getElementById('search').oninput = () => window.app.renderGrid();
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
        this.tempImg = null;
        this.passcode = "admin2026";
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
            window.app.renderGrid();
        } else {
            window.audio.error();
            window.notify.show('access_denied');
        }
    }

    logout() {
        this.active = false;
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        window.audio.click();
        window.app.renderGrid();
    }

    create() {
        push(productsRef, {
            name: "NEW ITEM",
            price: 0,
            desc: "Description...",
            img: null,
            createdAt: Date.now()
        }).then(() => {
            window.audio.success();
            window.notify.show('saved');
            window.ui.closeDrawers();
        });
    }

    updateImgPreview(input) {
        const file = input.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.tempImg = e.target.result;
                document.getElementById('mImg').src = this.tempImg;
                document.getElementById('mImg').style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }

    saveChanges() {
        const name = document.getElementById('eTitle').value.trim();
        const price = document.getElementById('ePrice').value;
        
        if (!name || !price) {
            window.audio.error();
            window.notify.show('fill_data');
            return;
        }

        const dbKey = window.app.currId;
        const updates = {
            name: name.toUpperCase(),
            price: price,
            desc: document.getElementById('eDesc').value
        };
        
        if (this.tempImg) {
            updates.img = this.tempImg;
        }

        update(ref(db, 'products/' + dbKey), updates).then(() => {
            this.tempImg = null;
            window.audio.success();
            window.notify.show('saved');
            window.ui.closeModal();
        });
    }

    deleteCurrent() {
        if (confirm('CONFIRM DELETE?')) {
            remove(ref(db, 'products/' + window.app.currId)).then(() => {
                window.audio.click();
                window.notify.show('deleted');
                window.ui.closeModal();
            });
        }
    }
}

// ГЛОБАЛЬНІ ЗМІННІ ДЛЯ ДОСТУПУ З HTML
window.onload = () => {
    window.audio = new AudioController();
    window.notify = new Notificator();
    window.settings = new SettingsManager();
    window.app = new ShopCore();
    window.ui = new UIManager();
    window.sysAdmin = new AdminSystem();
};