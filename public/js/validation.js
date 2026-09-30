/* ===========================================
   Form Validation — Login, Register, Profile forms
   =========================================== */
$(document).ready(function () {

    // ========================================================================
    // Login Page (login.html)
    // ========================================================================
    const $loginForm = $('#login-form');
    if ($loginForm.length) {
        $loginForm.on('submit', function (e) {
            const email = $('#login-email').val() ? $('#login-email').val().trim() : '';
            const password = $('#login-password').val() ? $('#login-password').val().trim() : '';
            let errors = [];

            if (!email) errors.push('Email is required');
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format');
            if (!password) errors.push('Password is required');
            else if (password.length < 6) errors.push('Password must be at least 6 characters');

            if (errors.length > 0) {
                e.preventDefault();
                showFormError($loginForm, errors.join('<br>'));
                return;
            }
            
            // Allow the form to submit naturally to the backend via POST
        });
    }

    // ========================================================================
    // Register Page (register.html)
    // ========================================================================
    const $registerForm = $('#register-form');
    if ($registerForm.length) {
        $registerForm.on('submit', function (e) {
            const username = $('#reg-username').val() ? $('#reg-username').val().trim() : '';
            const email = $('#reg-email').val() ? $('#reg-email').val().trim() : '';
            const password = $('#reg-password').val() ? $('#reg-password').val().trim() : '';
            const confirmPassword = $('#reg-confirm-password').val() ? $('#reg-confirm-password').val().trim() : '';
            let errors = [];

            if (!username) errors.push('Username is required');
            if (!email) errors.push('Email is required');
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format');
            if (!password) errors.push('Password is required');
            else if (password.length < 6) errors.push('Password must be at least 6 characters');
            if (password !== confirmPassword) errors.push('Passwords do not match');

            if (errors.length > 0) {
                e.preventDefault();
                showFormError($registerForm, errors.join('<br>'));
                return;
            }

            // Allow the form to submit naturally to the backend via POST
        });
    }

    // ========================================================================
    // Helper: Show form error
    // ========================================================================
    function showFormError($form, message) {
        let $error = $form.find('.form-error-alert');
        if ($error.length === 0) {
            $form.prepend('<div class="alert alert-danger form-error-alert mb-3"></div>');
            $error = $form.find('.form-error-alert');
        }
        $error.html(message).show();
        setTimeout(function () {
            $error.fadeOut();
        }, 5000);
    }
});
