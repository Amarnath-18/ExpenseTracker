const API_URL = 'http://127.0.0.1:8000/api/v1';

// State
let token = localStorage.getItem('access_token') || null;
let currentUser = null;
let transactions = [];

// DOM Elements
const views = {
    auth: document.getElementById('auth-view'),
    dashboard: document.getElementById('dashboard-view')
};

const forms = {
    login: document.getElementById('login-form'),
    signup: document.getElementById('signup-form'),
    forgot: document.getElementById('forgot-password-form'),
    reset: document.getElementById('reset-password-form'),
    upload: document.getElementById('upload-form'),
    manual: document.getElementById('manual-form'),
    ocr: document.getElementById('ocr-form')
};

const modals = {
    upload: document.getElementById('upload-modal'),
    manual: document.getElementById('manual-modal'),
    ocr: document.getElementById('ocr-modal')
};

// UI Helpers
const showToast = (message, type = 'info') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'bx-info-circle';
    if (type === 'success') icon = 'bx-check-circle';
    if (type === 'error') icon = 'bx-error-circle';

    toast.innerHTML = `<i class='bx ${icon}'></i> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

const switchView = (viewName) => {
    Object.values(views).forEach(v => v.classList.remove('active'));
    views[viewName].classList.add('active');
};

const toggleModal = (modalId, show) => {
    const modal = document.getElementById(modalId);
    if (show) {
        modal.classList.add('active');
    } else {
        modal.classList.remove('active');
        // Reset forms in modal
        const form = modal.querySelector('form');
        if (form) form.reset();
        
        // Custom resets
        if (modalId === 'upload-modal') {
            document.getElementById('preview-container').classList.add('hidden');
            document.getElementById('image-preview').src = '';
            const btn = document.getElementById('btn-submit-upload');
            btn.disabled = true;
            btn.querySelector('.spinner').classList.add('hidden');
            btn.querySelector('.btn-text').classList.remove('hidden');
        }
        if (modalId === 'ocr-modal') {
            document.getElementById('ocr-preview-container').classList.add('hidden');
            document.getElementById('ocr-image-preview').src = '';
            document.getElementById('ocr-result-container').classList.add('hidden');
            document.getElementById('ocr-result-text').value = '';
            const btn = document.getElementById('btn-submit-ocr');
            btn.disabled = true;
            btn.querySelector('.spinner').classList.add('hidden');
            btn.querySelector('.btn-text').classList.remove('hidden');
        }
    }
};

// --- AUTHENTICATION ---
document.getElementById('show-signup').addEventListener('click', (e) => {
    e.preventDefault();
    [forms.login, forms.signup, forms.forgot, forms.reset].forEach(f => f.classList.remove('active'));
    forms.signup.classList.add('active');
    document.getElementById('auth-subtitle').textContent = "Create an account to track your expenses.";
});

document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    [forms.login, forms.signup, forms.forgot, forms.reset].forEach(f => f.classList.remove('active'));
    forms.login.classList.add('active');
    document.getElementById('auth-subtitle').textContent = "Welcome back! Please login to your account.";
});

document.getElementById('show-forgot').addEventListener('click', (e) => {
    e.preventDefault();
    [forms.login, forms.signup, forms.forgot, forms.reset].forEach(f => f.classList.remove('active'));
    forms.forgot.classList.add('active');
    document.getElementById('auth-subtitle').textContent = "Enter your email to receive a password reset link.";
});

document.getElementById('forgot-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('show-login').click();
});

document.getElementById('reset-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('show-login').click();
});

const handleApiError = (err) => {
    console.error(err);
    if (err.status === 401) {
        logout();
        showToast("Session expired. Please login again.", "error");
    } else {
        showToast(err.message || "An error occurred.", "error");
    }
};

const apiCall = async (endpoint, options = {}) => {
    const headers = { ...options.headers };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });
        
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            const error = new Error(data.detail || data.message || "API Request Failed");
            error.status = res.status;
            throw error;
        }
        
        return data;
    } catch (err) {
        if (!err.status) {
            err.message = "Network error. Is the server running?";
        }
        throw err;
    }
};

forms.login.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const btn = document.getElementById('btn-login');
    btn.disabled = true;
    btn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Logging in...`;

    try {
        const data = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        token = data.access_token;
        localStorage.setItem('access_token', token);
        showToast("Logged in successfully!", "success");
        await initDashboard();
    } catch (err) {
        handleApiError(err);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `Login`;
    }
});

forms.signup.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const full_name = document.getElementById('signup-name').value;

    const btn = document.getElementById('btn-signup');
    btn.disabled = true;
    btn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Creating account...`;

    try {
        await apiCall('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password, full_name })
        });
        showToast("Account created! Please log in.", "success");
        document.getElementById('show-login').click();
    } catch (err) {
        handleApiError(err);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `Create Account`;
    }
});

forms.forgot.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value;
    const btn = document.getElementById('btn-forgot');
    btn.disabled = true;
    btn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Sending...`;

    try {
        await apiCall('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
        showToast("Reset link sent to email! (Check backend logs for token)", "success");
        [forms.login, forms.signup, forms.forgot, forms.reset].forEach(f => f.classList.remove('active'));
        forms.reset.classList.add('active');
        document.getElementById('auth-subtitle').textContent = "Enter your reset token and new password.";
    } catch (err) {
        handleApiError(err);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `Send Reset Link`;
    }
});

forms.reset.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tokenStr = document.getElementById('reset-token').value;
    const new_password = document.getElementById('reset-password').value;
    const btn = document.getElementById('btn-reset');
    btn.disabled = true;
    btn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Resetting...`;

    try {
        await apiCall('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token: tokenStr, new_password })
        });
        showToast("Password reset successfully! Please log in.", "success");
        document.getElementById('show-login').click();
    } catch (err) {
        handleApiError(err);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `Reset Password`;
    }
});

const logout = async () => {
    if (token) {
        try {
            await apiCall('/auth/logout', { method: 'POST' });
        } catch(e) { console.error(e); }
    }
    token = null;
    localStorage.removeItem('access_token');
    currentUser = null;
    transactions = [];
    switchView('auth');
};

document.getElementById('nav-logout').addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});

document.getElementById('nav-logout-all').addEventListener('click', async (e) => {
    e.preventDefault();
    if (confirm("Are you sure you want to log out from ALL devices?")) {
        if (token) {
            try {
                await apiCall('/auth/logout-all', { method: 'POST' });
                showToast("Logged out from all devices.", "success");
            } catch(e) { console.error(e); }
        }
        token = null;
        localStorage.removeItem('access_token');
        currentUser = null;
        transactions = [];
        switchView('auth');
    }
});


// --- DASHBOARD ---
const initDashboard = async () => {
    try {
        currentUser = await apiCall('/auth/me', { method: 'GET' });
        document.getElementById('profile-name').textContent = currentUser.full_name || "User";
        document.getElementById('profile-email').textContent = currentUser.email;
        
        switchView('dashboard');
        await loadTransactions();
    } catch (err) {
        handleApiError(err);
    }
};

const loadTransactions = async () => {
    try {
        const data = await apiCall('/transactions/', { method: 'GET' });
        transactions = data.items || [];
        renderTransactions();
    } catch (err) {
        handleApiError(err);
    }
};

document.getElementById('btn-refresh').addEventListener('click', loadTransactions);

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
};

const renderTransactions = () => {
    const tbody = document.getElementById('transactions-body');
    tbody.innerHTML = '';
    
    let total = 0;

    if (transactions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center">No transactions found.</td></tr>`;
        document.getElementById('stat-total').textContent = formatCurrency(0);
        document.getElementById('stat-count').textContent = '0';
        return;
    }

    transactions.forEach(tx => {
        total += parseFloat(tx.amount);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(tx.date)}</td>
            <td><strong>${tx.merchant || 'Unknown'}</strong></td>
            <td><span class="badge">${tx.category || 'Uncategorized'}</span></td>
            <td>${tx.payment_method || '-'}</td>
            <td style="color: var(--danger); font-weight: 600;">${formatCurrency(tx.amount)}</td>
            <td>
                <button class="btn btn-icon btn-delete" data-id="${tx.id}" title="Delete">
                    <i class='bx bx-trash text-danger' style="color: var(--danger)"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('stat-total').textContent = formatCurrency(total);
    document.getElementById('stat-count').textContent = transactions.length;

    // Attach delete listeners
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            if (confirm("Are you sure you want to delete this transaction?")) {
                try {
                    await apiCall(`/transactions/${id}`, { method: 'DELETE' });
                    showToast("Transaction deleted.", "success");
                    loadTransactions();
                } catch (err) {
                    handleApiError(err);
                }
            }
        });
    });
};

// --- MODALS & FORMS ---
// Modals toggle
document.getElementById('btn-open-manual').addEventListener('click', () => toggleModal('manual-modal', true));
document.getElementById('btn-open-upload').addEventListener('click', () => toggleModal('upload-modal', true));
document.getElementById('btn-open-ocr').addEventListener('click', () => toggleModal('ocr-modal', true));

document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay').id;
        toggleModal(modal, false);
    });
});

// Upload Logic
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const btnSubmitUpload = document.getElementById('btn-submit-upload');

dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--accent-primary)';
});

dropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--glass-border)';
});

dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--glass-border)';
    if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelect();
    }
});

fileInput.addEventListener('change', handleFileSelect);

function handleFileSelect() {
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('image-preview').src = e.target.result;
            document.getElementById('preview-container').classList.remove('hidden');
            btnSubmitUpload.disabled = false;
        };
        reader.readAsDataURL(file);
    }
}

forms.upload.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!fileInput.files.length) return;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    btnSubmitUpload.disabled = true;
    btnSubmitUpload.querySelector('.spinner').classList.remove('hidden');
    btnSubmitUpload.querySelector('.btn-text').classList.add('hidden');

    try {
        await apiCall('/transactions/upload', {
            method: 'POST',
            body: formData
        });
        showToast("Receipt processed successfully!", "success");
        toggleModal('upload-modal', false);
        loadTransactions();
    } catch (err) {
        handleApiError(err);
        btnSubmitUpload.disabled = false;
        btnSubmitUpload.querySelector('.spinner').classList.add('hidden');
        btnSubmitUpload.querySelector('.btn-text').classList.remove('hidden');
    }
});

// Manual Add Logic
forms.manual.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const payload = {
        merchant: document.getElementById('manual-merchant').value,
        amount: parseFloat(document.getElementById('manual-amount').value),
        date: document.getElementById('manual-date').value,
        category: document.getElementById('manual-category').value || null,
        payment_method: document.getElementById('manual-payment-method').value || null,
        description: document.getElementById('manual-description').value || null,
        currency: "INR"
    };

    const btn = document.getElementById('btn-submit-manual');
    const ogText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Saving...`;

    try {
        await apiCall('/transactions/', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        showToast("Transaction added successfully!", "success");
        toggleModal('manual-modal', false);
        loadTransactions();
    } catch (err) {
        handleApiError(err);
    } finally {
        btn.disabled = false;
        btn.innerHTML = ogText;
    }
});


// --- OCR Modal Logic ---
const ocrDropzone = document.getElementById('ocr-dropzone');
const ocrFileInput = document.getElementById('ocr-file-input');
const btnSubmitOcr = document.getElementById('btn-submit-ocr');

if (ocrDropzone) {
    ocrDropzone.addEventListener('click', () => ocrFileInput.click());

    ocrDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        ocrDropzone.style.borderColor = 'var(--accent-primary)';
    });

    ocrDropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        ocrDropzone.style.borderColor = 'var(--glass-border)';
    });

    ocrDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        ocrDropzone.style.borderColor = 'var(--glass-border)';
        if (e.dataTransfer.files.length) {
            ocrFileInput.files = e.dataTransfer.files;
            handleOcrFileSelect();
        }
    });

    ocrFileInput.addEventListener('change', handleOcrFileSelect);
}

function handleOcrFileSelect() {
    if (ocrFileInput.files.length > 0) {
        const file = ocrFileInput.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('ocr-image-preview').src = e.target.result;
            document.getElementById('ocr-preview-container').classList.remove('hidden');
            btnSubmitOcr.disabled = false;
        };
        reader.readAsDataURL(file);
    }
}

if (forms.ocr) {
    forms.ocr.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!ocrFileInput.files.length) return;

        const formData = new FormData();
        formData.append('file', ocrFileInput.files[0]);

        btnSubmitOcr.disabled = true;
        btnSubmitOcr.querySelector('.spinner').classList.remove('hidden');
        btnSubmitOcr.querySelector('.btn-text').classList.add('hidden');

        try {
            const data = await apiCall('/ocr/extract', {
                method: 'POST',
                body: formData
            });
            showToast("Text extracted successfully!", "success");
            document.getElementById('ocr-result-text').value = data.text || "No text found.";
            document.getElementById('ocr-result-container').classList.remove('hidden');
        } catch (err) {
            handleApiError(err);
        } finally {
            btnSubmitOcr.disabled = false;
            btnSubmitOcr.querySelector('.spinner').classList.add('hidden');
            btnSubmitOcr.querySelector('.btn-text').classList.remove('hidden');
        }
    });
}


// Initialization
const checkHealth = async () => {
    const indicator = document.getElementById('health-indicator');
    const text = document.getElementById('health-text');
    try {
        await apiCall('/health', { method: 'GET' });
        indicator.style.color = 'var(--accent-secondary)'; // Emerald
        text.textContent = 'Server Online';
    } catch (err) {
        indicator.style.color = 'var(--danger)';
        text.textContent = 'Server Offline';
    }
};

checkHealth();
if (token) {
    initDashboard();
}
