/* ===========================================
   Wishlist Page Logic (Backend-driven AJAX)
   =========================================== */
$(document).ready(function () {
    const $wishlistItems = $('#wishlist-items');
    if ($wishlistItems.length === 0) return; // Not on wishlist page

    // Remove from wishlist
    $wishlistItems.on('click', '.btn-remove-wishlist', function (e) {
        e.stopPropagation();
        const pid = $(this).data('product-id');
        const $card = $(this).closest('.col-md-6, .col-lg-4');

        $.ajax({
            url: '/account/wishlist/toggle',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ product_id: pid }),
            success: function (res) {
                if (res.success) {
                    if (typeof showToast === 'function') showToast('Removed from wishlist');
                    $card.fadeOut(300, function() {
                        $(this).remove();
                        // If empty, reload to show empty state properly
                        if ($wishlistItems.children('.row').children().length === 0) {
                            location.reload();
                        }
                    });
                } else {
                    if (typeof showToast === 'function') showToast(res.message || 'Error occurred', 'error');
                }
            },
            error: function () {
                if (typeof showToast === 'function') showToast('Failed to remove item. Are you logged in?', 'error');
            }
        });
    });

    // Add to cart from wishlist (submits a POST to the real backend /cart/add route)
    $wishlistItems.on('click', '.btn-add-to-cart-from-wishlist', function (e) {
        e.stopPropagation();
        const pid = $(this).data('product-id');
        
        // Dynamically create and submit a form to the backend cart route
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/cart/add';
        
        const inputId = document.createElement('input');
        inputId.type = 'hidden';
        inputId.name = 'product_id';
        inputId.value = pid;
        form.appendChild(inputId);

        const inputQty = document.createElement('input');
        inputQty.type = 'hidden';
        inputQty.name = 'quantity';
        inputQty.value = 1;
        form.appendChild(inputQty);
        
        document.body.appendChild(form);
        form.submit();
    });
});
