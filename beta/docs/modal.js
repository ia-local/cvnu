// public/modal.js

const genericAppModal = document.getElementById('genericAppModal');
const genericModalTitle = document.getElementById('genericModalTitle');
const genericModalBody = document.getElementById('genericModalBody');
const genericModalFooter = document.getElementById('genericModalFooter');

let genericCloseModalBtn, genericModalConfirmBtn, genericModalCancelBtn, genericModalOkBtn;

let resolveModalPromise; // Function to resolve the promise when modal is closed
let currentModalType; // To keep track of the active modal type for correct resolution on close

// Event handlers that will be attached once
function handleCloseModalClick() {
    hideModal(currentModalType === 'confirm' ? false : undefined);
}

function handleOkBtnClick() {
    hideModal(undefined);
}

function handleConfirmBtnClick() {
    hideModal(true);
}

function handleCancelBtnClick() {
    hideModal(false);
}

// Initialisation des éléments DOM de la modale et attachement des listeners une seule fois
document.addEventListener('DOMContentLoaded', () => {
    genericCloseModalBtn = document.getElementById('genericCloseModalBtn');
    genericModalConfirmBtn = document.getElementById('genericModalConfirmBtn');
    genericModalCancelBtn = document.getElementById('genericModalCancelBtn');
    genericModalOkBtn = document.getElementById('genericModalOkBtn');

    // Attach event listeners permanently
    if (genericCloseModalBtn) {
        genericCloseModalBtn.addEventListener('click', handleCloseModalClick);
    }
    if (genericModalOkBtn) {
        genericModalOkBtn.addEventListener('click', handleOkBtnClick);
    }
    if (genericModalConfirmBtn) {
        genericModalConfirmBtn.addEventListener('click', handleConfirmBtnClick);
    }
    if (genericModalCancelBtn) {
        genericModalCancelBtn.addEventListener('click', handleCancelBtnClick);
    }

    // Close modal when clicking outside (backdrop)
    if (genericAppModal) {
        genericAppModal.addEventListener('click', (e) => {
            if (e.target === genericAppModal) { // Check if the click was directly on the backdrop
                hideModal(currentModalType === 'confirm' ? false : undefined);
            }
        });
    }
});

/**
 * Shows a generic modal with customizable content and buttons.
 * @param {string} title - The title of the modal.
 * @param {string} bodyHtml - The HTML content for the modal body.
 * @param {'alert'|'confirm'|'info'} type - Type of modal to determine button visibility.
 * @param {string} [maxWidth='500px'] - Optional: maximum width for the modal content.
 * @returns {Promise<boolean|undefined>} Resolves to true for 'confirm' if confirmed, false if cancelled. Undefined for 'alert'/'info'.
 */
export function showModal(title, bodyHtml, type = 'alert', maxWidth = '500px') {
    return new Promise((resolve) => {
        resolveModalPromise = resolve; // Store resolve function for later use
        currentModalType = type; // Store current modal type

        if (genericModalTitle) genericModalTitle.innerHTML = title;
        if (genericModalBody) genericModalBody.innerHTML = bodyHtml;
        if (genericAppModal && genericAppModal.querySelector('.modal-content')) {
            genericAppModal.querySelector('.modal-content').style.maxWidth = maxWidth; // Set max-width
        }

        // Reset button visibility
        if (genericModalConfirmBtn) genericModalConfirmBtn.style.display = 'none';
        if (genericModalCancelBtn) genericModalCancelBtn.style.display = 'none';
        if (genericModalOkBtn) genericModalOkBtn.style.display = 'none';

        // Configure button visibility based on type
        if (type === 'confirm') {
            if (genericModalConfirmBtn) genericModalConfirmBtn.style.display = 'inline-block';
            if (genericModalCancelBtn) genericModalCancelBtn.style.display = 'inline-block';
        } else { // 'alert' or 'info'
            if (genericModalOkBtn) genericModalOkBtn.style.display = 'inline-block';
        }

        // Show the modal
        if (genericAppModal) genericAppModal.classList.add('active');
    });
}

/**
 * Hides the generic modal and resolves the promise.
 * @param {boolean|undefined} result - The value to resolve the modal promise with.
 */
function hideModal(result) {
    if (genericAppModal) genericAppModal.classList.remove('active');
    if (resolveModalPromise) {
        resolveModalPromise(result);
        resolveModalPromise = null; // Clear the stored resolve function
        currentModalType = null; // Clear the modal type
    }
}