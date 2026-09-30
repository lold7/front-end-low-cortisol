/* ===========================================
   Account Pages — Address Book, Order History, Profile
   =========================================== */
$(document).ready(function () {
    const imgBase = '../../public/images/products/';

    // ========================================================================
    // Account / Profile Page (account.html)
    // ========================================================================
    const $profileForm = $('#profile-form');
    if ($profileForm.length) {
        $profileForm.on('submit', function (e) {
            e.preventDefault();
            showToast('Profile updated successfully!');
        });
    }

    const $passwordForm = $('#password-form');
    if ($passwordForm.length) {
        $passwordForm.on('submit', function (e) {
            e.preventDefault();
            showToast('Password changed successfully!');
        });
    }
});
