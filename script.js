// Sign In Dialog Functions
function openSignInDialog() {
    document.getElementById('signInDialog').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeSignInDialog(event) {
    if (event) {
        event.preventDefault();
    }
    document.getElementById('signInDialog').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function handleSignIn(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    alert('Welcome back! Sign in successful.');
    closeSignInDialog();
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
}

// Close dialog on Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeSignInDialog();
    }
});

// Mobile menu toggle (if needed)
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}
