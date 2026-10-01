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
            const selectedAddr = $('input[name="shipping-address"]:checked').val();
            if (!selectedAddr) {
                $('#address-error').removeClass('d-none');
                return;
            }
            window.location.href = '/choosePayment?address_id=' + encodeURIComponent(selectedAddr);
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

        // Confirm order: the button is type="submit" form="checkout-payment-form",
        // so the browser submits the form itself. The success message is shown
        // on /account/orders only after the server has saved the order.
    }
});
