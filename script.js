const DB_KEY = 'rewear_v9_db';

const initialData = [
    { id: 1, name: "HELMUT LANG 1999 COAT", price: 850, desc: "Classic archival bondage parka.", img: null },
    { id: 2, name: "RICK OWENS GEOBASKET", price: 1200, desc: "Short tongue, blistered leather.", img: null },
    { id: 3, name: "RAF SIMONS BOMBER", price: 1800, desc: "Riot Riot Riot collection.", img: null }
];

// СЛОВНИК (ПОВНИЙ ПЕРЕКЛАД ВСІХ КНОПОК)
const dict = {
    en: {
        hero: "MATTE<br>OBJECTS",
        nav_sys: "SYSTEM", nav_bag: "BAG",
        bag_title: "YOUR BAG", sys_title: "SYSTEM",
        close: "CLOSE", subtotal: "SUBTOTAL", checkout: "PROCEED", add_cart: "ADD TO CART",
        s_visual: "VISUAL MODE", s_audio: "AUDIO UI", s_lang: "LOCALIZATION", s_curr: "CURRENCY", s_admin: "ADMIN ACCESS",
        t_matte: "MATTE BLACK", t_modern: "MODERN GREY", btn_login: "UNLOCK"
    },
    ua: {
        hero: "МАТОВИЙ<br>АРХІВ",
        nav_sys: "НАЛАШТУВАННЯ", nav_bag: "КОШИК",
        bag_title: "ВАШ КОШИК", sys_title: "СИСТЕМА",
        close: "ЗАКРИТИ", subtotal: "СУМА", checkout: "ОФОРМИТИ", add_cart: "У КОШИК",
        s_visual: "ТЕМА ДИЗАЙНУ", s_audio: "ЗВУКИ", s_lang: "МОВА", s_curr: "ВАЛЮТА", s_admin: "ВХІД ПРОДАВЦЯ",
        t_matte: "ГЛИБОКИЙ ЧОРНИЙ", t_modern: "ТЕХНО СІРИЙ", btn_login: "УВІЙТИ"
    },
    de: {
        hero: "MATTE<br>OBJEKTE",
        nav_sys: "EINSTELLUNGEN", nav_bag: "TASCHE",
        bag_title: "IHRE TASCHE", sys_title: "SYSTEM",
        close: "SCHLIEßEN", subtotal: "ZWISCHENSUMME", checkout: "WEITER", add_cart: "IN DEN WARENKORB",
        s_visual: "VISUELLER MODUS", s_audio: "AUDIO", s_lang: "SPRACHE", s_curr: "WÄHRUNG", s_admin: "VERKÄUFERZUGANG",
        t_matte: "MATTSCHWARZ", t_modern: "MODERN GRAU", btn_login: "ENTSPERREN"
    }
};

// AUDIO ENGINE
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playClick() {
    if(!settings.soundEnabled) return;
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
        this.theme = 'matte';
    }
    
    setTheme(mode) {
        playClick();
        this.theme = mode;
        document.body.className = '';
        document.body.classList.add('theme-' + mode);
        document.getElementById('themeMatte').className = mode === 'matte' ? 'setting-card active' : 'setting-card';
        document.getElementById('themeModern').className = mode === 'modern' ? 'setting-card active' : 'setting-card';
    }

    setSound(bool) {
        this.soundEnabled = bool;
        if(bool) playClick(); // Sound feedback only when turning ON
        document.getElementById('soundOn').className = bool ? 'setting-card active' : 'setting-card';
        document.getElementById('soundOff').className = !bool ? 'setting-card active' : 'setting-card';
    }

    setCurrency(c) {
        playClick();
        this.currency = c;
        ['USD','UAH','EUR'].forEach(k => {
            document.getElementById('curr'+k).className = k === c ? 'setting-card active' : 'setting-card';
        });
        app.renderGrid();
        app.updateCart();
    }

    formatPrice(p) {
        const val = Math.round(p * rates[this.currency]);
        return `${symbols[this.currency]}${val}`;
    }

    reset() {
        if(confirm('RESET SYSTEM DATA?')) {
            localStorage.removeItem(DB_KEY);
            location.reload();
        }
    }
}

class App {
    constructor() {
        this.products = JSON.parse(localStorage.getItem(DB_KEY)) || initialData;
        this.cart = [];
        this.currId = null;
        this.lang = 'en';
        this.renderGrid();
    }

    save() { localStorage.setItem(DB_KEY, JSON.stringify(this.products)); }
    
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
                    <span class="card-price">${settings.formatPrice(p.price)}</span>
                </div>
            `;
            el.onclick = () => { playClick(); this.open(p.id); };
            grid.appendChild(el);
        });
    }

    open(id) {
        this.currId = id;
        const p = this.products.find(x => x.id === id);
        if(!p) return;
        
        document.getElementById('mTitle').innerText = p.name;
        document.getElementById('mPrice').innerText = settings.formatPrice(p.price);
        document.getElementById('mDesc').innerText = p.desc || "No data.";
        document.getElementById('mId').innerText = p.id;
        
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
        ui.openModal();
    }

    addToCartFromModal() {
        playClick();
        const p = this.products.find(x => x.id === this.currId);
        this.cart.push(p);
        this.updateCart();
        ui.closeModal();
        ui.openDrawer('cartDrawer');
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
                    <div style="color:var(--text-sec); font-size:10px;">${settings.formatPrice(item.price)}</div>
                </div>
                <div style="color:var(--text-sec); font-size:9px; cursor:pointer;" onclick="app.remCart(${idx})">REMOVE</div>
            `;
            list.appendChild(div);
        });
        
        total.innerText = settings.formatPrice(sum);
        count.innerText = `(${this.cart.length})`;
    }

    remCart(idx) { playClick(); this.cart.splice(idx, 1); this.updateCart(); }

    setLang(l) {
        playClick();
        this.lang = l;
        
        // Buttons Update
        ['en','ua','de'].forEach(k => {
            document.getElementById('lang-'+k).className = k === l ? 'btn-outline active' : 'btn-outline';
        });

        // Translate Interface
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
        document.getElementById('search').oninput = () => app.renderGrid();
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
            app.renderGrid();
        } else alert('DENIED');
    }
    logout() {
        playClick();
        this.active = false;
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('adminPassInput').value = '';
        app.renderGrid();
    }
    create() {
        const id = Date.now();
        app.products.unshift({ id, name: "NEW ENTRY", price: 0, desc: "Details pending...", img: null });
        app.save();
        app.renderGrid();
        app.open(id);
        ui.closeDrawers();
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
        const p = app.products.find(x => x.id === app.currId);
        if(p) {
            p.name = document.getElementById('eTitle').value.toUpperCase();
            p.price = document.getElementById('ePrice').value;
            p.desc = document.getElementById('eDesc').value;
            if(this.tempImg) p.img = this.tempImg;
            app.save(); app.renderGrid(); ui.closeModal(); this.tempImg = null;
        }
    }
    deleteCurrent() {
        playClick();
        if(confirm('DELETE PERMANENTLY?')) {
            app.products = app.products.filter(x => x.id !== app.currId);
            app.save(); app.renderGrid(); ui.closeModal();
        }
    }
}

window.onload = () => {
    window.settings = new Settings();
    window.app = new App();
    window.ui = new UI();
    window.sysAdmin = new Admin();
};