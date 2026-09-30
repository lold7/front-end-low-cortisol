/* ===========================================
   Admin/Backoffice — CRUD interactions for admin pages
   =========================================== */
$(document).ready(function () {

    // Only run on backoffice pages
    if ($('.admin-sidebar, [class*="admin"]').length === 0 &&
        !window.location.pathname.includes('backoffice')) return;

    // ========================================================================
    // 1. Delete Confirmation Modal (shared across all admin pages)
    // ========================================================================
    if ($('#deleteConfirmModal').length === 0) {
        $('body').append(
            '<div class="modal fade" id="deleteConfirmModal" tabindex="-1">' +
            '  <div class="modal-dialog modal-dialog-centered">' +
            '    <div class="modal-content rounded-4 border-0 shadow">' +
            '      <div class="modal-header border-0">' +
            '        <h5 class="modal-title fw-bold">Confirm Delete</h5>' +
            '        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>' +
            '      </div>' +
            '      <div class="modal-body">' +
            '        <p>Are you sure you want to delete this item? This action cannot be undone.</p>' +
            '      </div>' +
            '      <div class="modal-footer border-0">' +
            '        <button type="button" class="btn btn-outline-secondary rounded-pill px-4" data-bs-dismiss="modal">Cancel</button>' +
            '        <button type="button" class="btn btn-danger rounded-pill px-4" id="confirmDeleteBtn">Delete</button>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '</div>'
        );
    }

    let $targetRow = null;
    let $deleteForm = null;
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));

    // Bind delete buttons (look for trash icons or delete buttons)
    $(document).on('click', '[title="Delete"], .btn-delete', function (e) {
        // Only intercept if there's no native onsubmit confirm, or if we want to override it
        e.preventDefault();
        $targetRow = $(this).closest('tr, .card, .list-group-item');
        $deleteForm = $(this).closest('form');
        deleteModal.show();
    });

    $('#confirmDeleteBtn').on('click', function () {
        if ($deleteForm && $deleteForm.length) {
            // Submit the actual backend form
            $deleteForm[0].submit();
        } else if ($targetRow) {
            // Fallback for UI-only deletions
            $targetRow.fadeOut(300, function () {
                $(this).remove();
            });
        }
        deleteModal.hide();
    });

    // ========================================================================
    // 2. Category Visibility Toggle
    // ========================================================================
    $(document).on('change', '.category-toggle, input[type="checkbox"][role="switch"]', function () {
        const isVisible = $(this).prop('checked');
        const $row = $(this).closest('tr, .card');
        const $badge = $row.find('.badge, .status-badge');

        if (isVisible) {
            $badge.removeClass('bg-danger bg-secondary').addClass('bg-success').text('Active');
        } else {
            $badge.removeClass('bg-success').addClass('bg-secondary').text('Hidden');
        }
    });

    // ========================================================================
    // 3. Order Status Filter
    // ========================================================================
    const $statusFilter = $('#order-status-filter, .status-filter');
    if ($statusFilter.length) {
        $statusFilter.on('change', function () {
            const status = $(this).val().toLowerCase();
            $('table tbody tr, .order-row').each(function () {
                if (status === 'all' || status === '') {
                    $(this).show();
                } else {
                    const rowStatus = $(this).find('.badge').text().trim().toLowerCase();
                    $(this).toggle(rowStatus === status);
                }
            });
        });
    }

    // ========================================================================
    // 4. Customer/Product Search Filter
    // ========================================================================
    const $searchFilter = $('#admin-search, .admin-search-input');
    if ($searchFilter.length) {
        $searchFilter.on('input', function () {
            const query = $(this).val().toLowerCase();
            $('table tbody tr').each(function () {
                const text = $(this).text().toLowerCase();
                $(this).toggle(text.indexOf(query) > -1);
            });
        });
    }

    // ========================================================================
    // 5. Order Status Change Dropdown
    // ========================================================================
    $(document).on('change', '.order-status-select', function () {
        const newStatus = $(this).val();
        const $badge = $(this).closest('tr, .card').find('.badge');
        $badge.text(newStatus);
        if (newStatus === 'completed') {
            $badge.removeClass('bg-warning bg-danger bg-secondary').addClass('bg-success');
        } else if (newStatus === 'pending') {
            $badge.removeClass('bg-success bg-danger bg-secondary').addClass('bg-warning text-dark');
        } else if (newStatus === 'cancelled') {
            $badge.removeClass('bg-success bg-warning').addClass('bg-danger');
        }
    });

    // ========================================================================
    // 6. Image Preview for Product Form (inventory.html)
    // ========================================================================
    const $imageInput = $('#product-image-input, input[type="file"]');
    if ($imageInput.length) {
        $imageInput.on('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (ev) {
                    let $preview = $('#image-preview');
                    if ($preview.length === 0) {
                        $imageInput.after('<img id="image-preview" class="mt-3 rounded-3 shadow-sm" style="max-height:200px;">');
                        $preview = $('#image-preview');
                    }
                    $preview.attr('src', ev.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
    }
});
