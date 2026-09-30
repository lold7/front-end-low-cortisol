/* ===========================================
   Cart Manager — localStorage-based shopping cart
   =========================================== */
const CartManager = {
    STORAGE_KEY: 'inwza_cart',

    getCart: function () {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
        } catch (e) {
            return [];
        }
    },

    saveCart: function (cart) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
    },

    addToCart: function (product_id, product_name, author, product_price, product_image, quantity, format) {
        const cart = this.getCart();
        const existing = cart.find(function (item) {
            return item.product_id === product_id && item.format === format;
        });
        if (existing) {
            existing.quantity += quantity;
        } else {
            cart.push({
                product_id: product_id,
                product_name: product_name,
                author: author,
                product_price: product_price,
                product_image: product_image,
                quantity: quantity,
                format: format
            });
        }
        this.saveCart(cart);
        this.updateBadge();
        showToast(product_name + ' added to cart!');
    },

    removeFromCart: function (index) {
        const cart = this.getCart();
        cart.splice(index, 1);
        this.saveCart(cart);
        this.updateBadge();
    },

    updateQuantity: function (index, newQty) {
        const cart = this.getCart();
        if (newQty < 1) {
            cart.splice(index, 1);
        } else {
            cart[index].quantity = newQty;
        }
        this.saveCart(cart);
        this.updateBadge();
    },

    clearCart: function () {
        this.saveCart([]);
        this.updateBadge();
    },

    getCartCount: function () {
        return this.getCart().reduce(function (sum, item) {
            return sum + item.quantity;
        }, 0);
    },

    getCartTotal: function () {
        return this.getCart().reduce(function (sum, item) {
            return sum + (item.product_price * item.quantity);
        }, 0);
    },

    updateBadge: function () {
        // Disabled: Cart badge is now handled by the backend server rendering logic (res.locals.cartCount)
    }
};

window.CartManager = CartManager;

/* ===========================================
   Toast Notification Helper
   =========================================== */
function showToast(message, type) {
    type = type || 'success';
    let $container = $('#toast-container');
    if ($container.length === 0) {
        $('body').append('<div id="toast-container" class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index:1100"></div>');
        $container = $('#toast-container');
    }
    const toastId = 'toast-' + Date.now();
    const bgClass = type === 'success' ? 'bg-success' : 'bg-danger';
    const html = '<div id="' + toastId + '" class="toast align-items-center text-white ' + bgClass + ' border-0" role="alert">' +
        '<div class="d-flex">' +
        '<div class="toast-body">' + message + '</div>' +
        '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>' +
        '</div></div>';
    $container.append(html);
    const toastEl = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
    $(toastEl).on('hidden.bs.toast', function () {
        $(this).remove();
    });
}

window.showToast = showToast;

/* ===========================================
   Cart Page Logic (Backend-driven)
   =========================================== */
$(document).ready(function () {
    const $cartContainer = $('#cart-items-container');
    if ($cartContainer.length === 0) return; // Not on cart page

    // Submit the update form when + is clicked
    $cartContainer.on('click', '.btn-plus', function () {
        const $input = $(this).siblings('.item-qty');
        let currentVal = parseInt($input.val()) || 1;
        $input.val(currentVal + 1);
        $(this).closest('form').submit();
    });

    // Submit the update form when - is clicked
    $cartContainer.on('click', '.btn-minus', function () {
        const $input = $(this).siblings('.item-qty');
        let currentVal = parseInt($input.val()) || 1;
        if (currentVal > 1) {
            $input.val(currentVal - 1);
            $(this).closest('form').submit();
        } else {
            // Optional: If it hits 1, maybe they want to remove it
            // For now, prevent going below 1 via minus button
        }
    });
});
