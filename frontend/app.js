// Auto-detect API URL based on current host
const API_URL = window.location.protocol + '//' + window.location.host + '/api';

function showLogin() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.auth-tab');
    const indicator = document.getElementById('tabIndicator');
    
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
    tabs[0].classList.add('active');
    tabs[1].classList.remove('active');
    
    indicator.classList.remove('move-right');
}

function showRegister() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.auth-tab');
    const indicator = document.getElementById('tabIndicator');
    
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
    tabs[0].classList.remove('active');
    tabs[1].classList.add('active');
    
    indicator.classList.add('move-right');
}

function showMessage(message, type) {
    const notification = document.getElementById('message');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitBtn = e.target.querySelector('.submit-btn');
    
    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    setButtonLoading(submitBtn, true);
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userName', data.user.name);
            localStorage.setItem('encryptionKey', data.encryptionKey); // Store user's encryption key
            showMessage('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '/index';
            }, 1000);
        } else {
            showMessage(data.message || 'Login failed. Please check your credentials.', 'error');
            setButtonLoading(submitBtn, false);
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Unable to connect to server. Please try again.', 'error');
        setButtonLoading(submitBtn, false);
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const submitBtn = e.target.querySelector('.submit-btn');
    
    if (!name || !email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long', 'error');
        return;
    }
    
    setButtonLoading(submitBtn, true);
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store the encryption key for new users
            if (data.encryptionKey) {
                localStorage.setItem('encryptionKey', data.encryptionKey);
            }
            showMessage('Account created successfully! Please sign in.', 'success');
            setTimeout(() => {
                document.getElementById('registerForm').reset();
                showLogin();
            }, 2000);
        } else {
            showMessage(data.message || 'Registration failed. Please try again.', 'error');
        }
        
        setButtonLoading(submitBtn, false);
    } catch (error) {
        console.error('Register error:', error);
        showMessage('Unable to connect to server. Please try again.', 'error');
        setButtonLoading(submitBtn, false);
    }
});

// Add input validation feedback
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('blur', function() {
        if (this.value && !this.validity.valid) {
            this.style.borderColor = '#ef4444';
        }
    });
    
    input.addEventListener('input', function() {
        if (this.style.borderColor === 'rgb(239, 68, 68)') {
            this.style.borderColor = '';
        }
    });
});

