// Ambil elemen dari DOM
const balanceEl = document.getElementById('total-balance');
const formEl = document.getElementById('transaction-form');
const nameInput = document.getElementById('item-name');
const amountInput = document.getElementById('item-amount');
const categoryInput = document.getElementById('item-category');
const transactionListEl = document.getElementById('transaction-list');

// Elemen untuk 3 Tantangan Opsional
const themeToggleBtn = document.getElementById('theme-toggle');
const newCategoryInput = document.getElementById('new-category-input');
const addCategoryBtn = document.getElementById('add-category-btn');
const spendingLimitInput = document.getElementById('spending-limit');
const setLimitBtn = document.getElementById('set-limit-btn');
const limitWarningEl = document.getElementById('limit-warning');

// Ambil data dari Local Storage atau inisialisasi awal
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let customCategories = JSON.parse(localStorage.getItem('customCategories')) || ['Food', 'Transport', 'Fun'];
let monthlyLimit = parseFloat(localStorage.getItem('monthlyLimit')) || 0;

let spendingChart = null;

// Set nilai limit ke input saat halaman dimuat
if (monthlyLimit > 0) {
    spendingLimitInput.value = monthlyLimit;
}

// ==========================================
// 1. FITUR DARK / LIGHT MODE TOGGLE
// ==========================================
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggleBtn.innerText = '☀️ Light Mode';
}

themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        themeToggleBtn.innerText = '🌙 Dark Mode';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeToggleBtn.innerText = '☀️ Light Mode';
    }
});

// ==========================================
// 2. FITUR CUSTOM CATEGORIES
// ==========================================
function updateCategoryDropdown() {
    // Kosongkan dulu opsi kecuali yang pertama
    categoryInput.innerHTML = '<option value="" disabled selected>Pilih Kategori</option>';
    
    customCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.innerText = cat;
        categoryInput.appendChild(option);
    });
}

addCategoryBtn.addEventListener('click', () => {
    const newCat = newCategoryInput.value.trim();
    if (newCat && !customCategories.includes(newCat)) {
        customCategories.push(newCat);
        localStorage.setItem('customCategories', JSON.stringify(customCategories));
        updateCategoryDropdown();
        categoryInput.value = newCat; // Otomatis pilih kategori baru
        newCategoryInput.value = '';
    } else {
        alert('Kategori kosong atau sudah ada!');
    }
});

// ==========================================
// 3. FITUR SPENDING LIMIT & WARNING (DENGAN SELISIH)
// ==========================================
setLimitBtn.addEventListener('click', () => {
    const limitVal = parseFloat(spendingLimitInput.value);
    if (!isNaN(limitVal) && limitVal >= 0) {
        monthlyLimit = limitVal;
        localStorage.setItem('monthlyLimit', monthlyLimit);
        checkSpendingLimit();
        alert('Budget limit berhasil disimpan!');
    } else {
        alert('Masukkan angka limit yang valid!');
    }
});

function checkSpendingLimit() {
    const total = transactions.reduce((acc, item) => acc + Number(item.amount), 0);
    
    if (monthlyLimit > 0 && total > monthlyLimit) {
        const excess = total - monthlyLimit;
        limitWarningEl.innerHTML = `⚠️ Peringatan: Pengeluaran melebihi batas budget sebesar <strong>$${excess.toFixed(2)}</strong>!`;
        limitWarningEl.classList.remove('hidden');
    } else {
        limitWarningEl.classList.add('hidden');
    }
}

// Simpan ke Local Storage
function saveToLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Hitung Total Balance
function updateBalance() {
    const total = transactions.reduce((acc, item) => acc + Number(item.amount), 0);
    balanceEl.innerText = `$${total.toFixed(2)}`;
    checkSpendingLimit();
}

// Render Daftar Transaksi
function renderTransactions() {
    transactionListEl.innerHTML = '';

    if (transactions.length === 0) {
        transactionListEl.innerHTML = '<p style="color: var(--text-color); opacity: 0.6; font-size: 0.85rem; text-align: center;">Belum ada transaksi.</p>';
        return;
    }

    transactions.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.classList.add('transaction-item');

        itemEl.innerHTML = `
            <div class="transaction-info">
                <span class="t-name">${item.name}</span>
                <span class="t-amount">$${Number(item.amount).toFixed(2)}</span>
                <span class="t-category">${item.category}</span>
            </div>
            <button class="btn-delete" onclick="deleteTransaction(${index})">Delete</button>
        `;

        transactionListEl.appendChild(itemEl);
    });
}

// Hapus Transaksi
function deleteTransaction(index) {
    transactions.splice(index, 1);
    saveToLocalStorage();
    initApp();
}

// Update Chart.js dengan Kategori Dinamis
function updateChart() {
    const categoryTotals = {};
    customCategories.forEach(cat => {
        categoryTotals[cat] = 0;
    });

    transactions.forEach(item => {
        if (categoryTotals[item.category] === undefined) {
            categoryTotals[item.category] = 0;
        }
        categoryTotals[item.category] += Number(item.amount);
    });

    const labels = Object.keys(categoryTotals);
    const dataValues = Object.values(categoryTotals);
    const backgroundColors = labels.map((_, i) => {
        const colors = ['#2ecc71', '#3498db', '#e67e22', '#9b59b6', '#1abc9c', '#f1c40f'];
        return colors[i % colors.length];
    });

    const ctx = document.getElementById('spendingChart').getContext('2d');

    if (spendingChart) {
        spendingChart.destroy();
    }

    spendingChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

// Event listener saat form disubmit
formEl.addEventListener('submit', function(e) {
    e.preventDefault();

    const name = nameInput.value.trim();
    const amount = amountInput.value.trim();
    const category = categoryInput.value;

    if (!name || !amount || !category) {
        alert('Mohon isi semua field!');
        return;
    }

    const newTransaction = {
        name,
        amount: parseFloat(amount),
        category
    };

    transactions.push(newTransaction);
    saveToLocalStorage();
    initApp();

    formEl.reset();
});

// Inisialisasi Utama
function initApp() {
    updateCategoryDropdown();
    updateBalance();
    renderTransactions();
    updateChart();
}

// Jalankan saat halaman dimuat
initApp();