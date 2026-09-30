/* ===========================================
   main.js — Global functionality + All Products pagination + Homepage interactivity
   =========================================== */

$(document).ready(function () {

    // ========================================================================
    // 1. Navbar: Update cart & wishlist badges on every page
    // ========================================================================
    if (window.CartManager) CartManager.updateBadge();

    // ========================================================================
    // 2. Search Bar — redirect to search-results.html?q=xxx
    // ========================================================================
    $('form').each(function () {
        const $form = $(this);
        const $searchInput = $form.find('input[type="search"]');
        if ($searchInput.length) {
            $form.on('submit', function (e) {
                e.preventDefault();
                const query = $searchInput.val().trim();
                if (query) {
                    window.location.href = '/search?q=' + encodeURIComponent(query);
                }
            });
        }
    });

    // ========================================================================
    // 3. All Products Page — pagination with real MOCK_PRODUCTS data
    // ========================================================================
    const $productList = $('#product-list');
    const $paginationControls = $('#pagination-controls');

    if ($productList.length && $paginationControls.length && window.MOCK_PRODUCTS) {
        const products = window.MOCK_PRODUCTS;
        const itemsPerPage = 15;
        let currentPage = 1;
        const imgBase = '../../public/images/products/';

        function displayProducts(page) {
            $productList.empty();
            const startIndex = (page - 1) * itemsPerPage;
            const paginatedItems = products.slice(startIndex, startIndex + itemsPerPage);

            $.each(paginatedItems, function (i, product) {
                const html =
                    '<div class="col-lg-4 col-md-4 col-sm-6 col-6 mb-4 d-flex justify-content-center">' +
                    '  <div class="card border-0 h-100 w-100 book-card-hover" style="cursor:pointer;" data-product-id="' + product.product_id + '">' +
                    '    <img src="' + imgBase + product.product_images[0] + '" class="card-img-top rounded-4" alt="' + product.product_name + '" style="height: 280px; object-fit: cover;">' +
                    '    <div class="card-body text-center px-1 px-sm-2">' +
                    '      <h6 class="card-title fw-bold mb-1 small-on-mobile">' + product.product_name + '</h6>' +
                    '      <p class="text-muted small mb-2">' + product.author + '</p>' +
                    '      <p class="fw-bold mb-0">$' + product.product_price.toFixed(2) + '</p>' +
                    '    </div>' +
                    '  </div>' +
                    '</div>';
                $productList.append(html);
            });
        }

        function setupPagination() {
            $paginationControls.empty();
            const pageCount = Math.ceil(products.length / itemsPerPage);

            // Prev button
            const prevDisabled = currentPage === 1 ? ' disabled' : '';
            $paginationControls.append(
                '<li class="page-item' + prevDisabled + '"><a class="page-link rounded-pill mx-1" href="#" data-page="prev">Prev</a></li>'
            );

            // Page number buttons
            for (let i = 1; i <= pageCount; i++) {
                const active = i === currentPage ? ' active' : '';
                $paginationControls.append(
                    '<li class="page-item' + active + '"><a class="page-link rounded-circle mx-1" href="#" data-page="' + i + '">' + i + '</a></li>'
                );
            }

            // Next button
            const nextDisabled = currentPage === pageCount ? ' disabled' : '';
            $paginationControls.append(
                '<li class="page-item' + nextDisabled + '"><a class="page-link rounded-pill mx-1" href="#" data-page="next">Next</a></li>'
            );
        }

        $paginationControls.on('click', '.page-link', function (e) {
            e.preventDefault();
            const page = $(this).data('page');
            const pageCount = Math.ceil(products.length / itemsPerPage);
            if (page === 'prev' && currentPage > 1) {
                currentPage--;
            } else if (page === 'next' && currentPage < pageCount) {
                currentPage++;
            } else if (typeof page === 'number') {
                currentPage = page;
            }
            displayProducts(currentPage);
            setupPagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        displayProducts(currentPage);
        setupPagination();
    }

    // ========================================================================
    // 4. Product Detail Page — populate from MOCK_PRODUCTS via ?id= param
    // ========================================================================
    if ($('#btn-add-to-cart').length && window.MOCK_PRODUCTS) {
        const params = new URLSearchParams(window.location.search);
        const productId = parseInt(params.get('id'));
        if (productId) {
            const product = window.MOCK_PRODUCTS.find(function (p) { return p.product_id === productId; });
            if (product) {
                const imgBase = '../../public/images/products/';
                // Populate page elements
                $('h1.display-5').text(product.product_name);
                $('p.text-muted.fs-5').first().text('By ' + product.author);
                $('h2.fw-bold.text-primary').text('$' + product.product_price.toFixed(2));
                $('section.container .col-md-5 img').attr('src', imgBase + product.product_images[0]).attr('alt', product.product_name);
                $('p.text-muted[style*="line-height"]').text(product.product_description);
                $('title').text(product.product_name + ' - InwZa Bookstore');
                // Update breadcrumb
                $('.breadcrumb-item.active').text(product.product_name);
                // Update badge
                $('.badge.bg-light.text-dark.border').first().text(product.category_name);

                // Populate format options
                const $formatSelect = $('#product-format');
                if ($formatSelect.length && product.product_attributes && product.product_attributes.format) {
                    $formatSelect.empty();
                    $.each(product.product_attributes.format, function (i, fmt) {
                        $formatSelect.append('<option value="' + fmt.toLowerCase() + '">' + fmt + '</option>');
                    });
                }
            }
        }

        // Add to Cart button
        $('#btn-add-to-cart').on('click', function () {
            const params = new URLSearchParams(window.location.search);
            const productId = parseInt(params.get('id'));
            let product = null;
            if (productId && window.MOCK_PRODUCTS) {
                product = window.MOCK_PRODUCTS.find(function (p) { return p.product_id === productId; });
            }
            if (!product) {
                // Fallback: read from page DOM
                product = {
                    product_id: productId || 0,
                    product_name: $('h1.display-5').text(),
                    author: $('p.text-muted.fs-5').first().text().replace('By ', ''),
                    product_price: parseFloat($('h2.fw-bold.text-primary').text().replace('$', '')),
                    product_images: [$('section.container .col-md-5 img').attr('src').split('/').pop()]
                };
            }
            const qty = parseInt($('#product-qty').val()) || 1;
            const format = $('#product-format').val() || 'paperback';
            const formatLabel = $('#product-format option:selected').text() || 'Paperback';

            CartManager.addToCart(
                product.product_id,
                product.product_name,
                product.author,
                product.product_price,
                product.product_images[0],
                qty,
                formatLabel
            );
        });

        // (Old Wishlist logic removed. The backend version uses an AJAX handler below)
    }

    // ========================================================================
    // NEW: Backend Wishlist Toggle (AJAX)
    // ========================================================================
    $(document).on('click', '#btn-wishlist', function () {
        const $btn = $(this);
        const productId = $btn.data('product-id');
        
        if (!productId) return;

        $.ajax({
            url: '/account/wishlist/toggle',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ product_id: productId }),
            success: function(res) {
                if (res.success) {
                    const $icon = $btn.find('i');
                    if (res.action === 'added') {
                        $icon.removeClass('bi-heart').addClass('bi-heart-fill text-danger');
                        if (typeof showToast === 'function') showToast('Added to wishlist!');
                    } else if (res.action === 'removed') {
                        $icon.removeClass('bi-heart-fill text-danger').addClass('bi-heart');
                        if (typeof showToast === 'function') showToast('Removed from wishlist');
                    }
                } else {
                    if (typeof showToast === 'function') showToast(res.message || 'Action failed', 'error');
                }
            },
            error: function() {
                if (typeof showToast === 'function') showToast('Please log in to use your wishlist.', 'error');
            }
        });
    });

    // ========================================================================
    // 5. Make product cards clickable → productDetail.html?id=N
    // ========================================================================
    $(document).on('click', '.book-card-hover[data-product-id]', function () {
        const productId = $(this).data('product-id');
        if (productId) {
            window.location.href = '/product/' + productId;
        }
    });

    // ========================================================================
    // 6. Scroll-triggered fade-in animations (homepage)
    // ========================================================================
    if ($('.fade-in-on-scroll').length) {
        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    $(entry.target).addClass('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        $('.fade-in-on-scroll').each(function () {
            observer.observe(this);
        });
    }

    // ========================================================================
    // 7. Product Detail — Quantity buttons (for pages with inline onclick)
    // ========================================================================
    const $qtyInput = $('#product-qty');
    if ($qtyInput.length) {
        $qtyInput.closest('.input-group').find('button').first().off('click').on('click', function () {
            let val = parseInt($qtyInput.val()) || 1;
            if (val > 1) $qtyInput.val(val - 1);
        });
        $qtyInput.closest('.input-group').find('button').last().off('click').on('click', function () {
            let val = parseInt($qtyInput.val()) || 1;
            if (val < 10) $qtyInput.val(val + 1);
        });
    }

});
