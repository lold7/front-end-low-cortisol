/* ===========================================
   Checkout Flow (Backend-driven)
   =========================================== */
$(document).ready(function () {
    // ========================================================================
    // Checkout Page (checkout.html)
    // ========================================================================
    const $checkoutItems = $('#checkout-items');
    if ($checkoutItems.length) {
        // Continue to payment
        $('#btn-continue-payment').on('click', function () {
            const selectedAddr = $('input[name="shipping-address"]:checked').val() || 1;
            window.location.href = '/choosePayment?address_id=' + selectedAddr;
        });
    }

    // ========================================================================
    // Choose Payment Page (choosePayment.html)
    // ========================================================================
    const $paymentTotal = $('#payment-total');
    if ($paymentTotal.length) {
        // Payment method tabs
        $('.tab-btn').on('click', function (e) {
            e.preventDefault();
            $('.tab-btn').removeClass('active');
            $(this).addClass('active');
            
            // Set the hidden input value
            const method = $(this).text().trim() || 'Credit Card';
            $('#payment-method-input').val(method);
        });

        // Confirm order
        $('#btn-confirm-order').on('click', function (e) {
            e.preventDefault();
            alert('Order placed successfully! Thank you for your purchase.');
            // Automatically submits the #payment-form to the backend
            $('#checkout-payment-form').submit();
        });
    }
});
