// public/pagination.js

// DOM elements
const conversationListElement = document.getElementById('conversation-list');
const prevPageBtn = document.querySelector('#conversation-pagination button[data-page-action="prev"]');
const nextPageBtn = document.querySelector('#conversation-pagination button[data-page-action="next"]');
const currentPageInfoSpan = document.getElementById('current-page-info');

// State variables
let allConversations = { conversations: [], totalCount: 0 }; // Initialize with empty array and count
let currentPage = 1;
let itemsPerPage = 5; // Default value, can be overridden

// Callbacks from main app logic (cv.js)
let selectConversationCallback = null;
let deleteConversationCallback = null;
let fetchConversationsCallback = null;
let activeConversationId = null; // Track the currently active conversation

/**
 * Initializes pagination controls with necessary callbacks.
 * @param {function} fetchConversationsCb - Callback to fetch conversations for a given page.
 * @param {function} selectConversationCb - Callback to select a conversation.
 * @param {function} deleteConversationCb - Callback to delete a conversation.
 */
export function initPaginationControls(fetchConversationsCb, selectConversationCb, deleteConversationCb) {
    fetchConversationsCallback = fetchConversationsCb;
    selectConversationCallback = selectConversationCb;
    deleteConversationCallback = deleteConversationCb;

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                fetchConversationsCallback(currentPage);
            }
        });
    }

    if (nextPageBtn) {
        const totalPages = Math.ceil(allConversations.totalCount / itemsPerPage);
        nextPageBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                fetchConversationsCallback(currentPage);
            }
        });
    }
}

/**
 * Sets the current active conversation ID to highlight it in the list.
 * @param {string|null} id - The ID of the conversation to set as active, or null to clear.
 */
export function setActiveConversationId(id) {
    activeConversationId = id;
    renderChatConversationList(selectConversationCallback, deleteConversationCallback); // Re-render to apply active state
}


/**
 * Sets the conversations data and updates pagination properties.
 * @param {Array<Object>} conversationsData - Array of conversation objects for the current page.
 * @param {number} totalCount - Total number of conversations available.
 * @param {number} page - Current page number.
 * @param {number} perPage - Number of items per page.
 */
export function setConversations(conversationsData, totalCount, page, perPage) {
    allConversations.conversations = conversationsData; // Store current page's data
    allConversations.totalCount = totalCount; // Store total count
    currentPage = page;
    itemsPerPage = perPage;
}

/**
 * Renders the conversation list based on the current `allConversations` data.
 * This function should be called after `setConversations`.
 * @param {function} selectCb - The callback function to execute when a conversation is selected.
 * @param {function} deleteCb - The callback function to execute when a conversation is deleted.
 */
export function renderChatConversationList(selectCb, deleteCb) {
    if (!conversationListElement) return;

    conversationListElement.innerHTML = '';
    if (!allConversations.conversations || allConversations.conversations.length === 0) {
        conversationListElement.innerHTML = '<p class="placeholder-text">Aucune conversation. Cliquez sur "Nouvelle" pour commencer.</p>';
        if (currentPageInfoSpan) currentPageInfoSpan.textContent = 'Page 0/0';
        if (prevPageBtn) prevPageBtn.disabled = true;
        if (nextPageBtn) nextPageBtn.disabled = true;
        // Also ensure pagination controls are visible or hidden appropriately
        const paginationControls = document.getElementById('conversation-pagination');
        if (paginationControls) {
            paginationControls.style.display = 'none'; // Hide if no conversations
        }
        return;
    }

    // Ensure pagination controls are visible if there are conversations
    const paginationControls = document.getElementById('conversation-pagination');
    if (paginationControls) {
        paginationControls.style.display = 'flex'; // Show if conversations exist
    }


    allConversations.conversations.forEach(conv => {
        const li = document.createElement('li');
        li.className = `conversation-item ${conv.id === activeConversationId ? 'active' : ''}`;
        li.dataset.id = conv.id;
        li.innerHTML = `
            <span>${conv.title || `Conversation ${conv.createdAt ? new Date(conv.createdAt).toLocaleString() : conv.id.substring(0, 4) + '...'}`}</span>
            <button class="delete-conversation-btn" data-id="${conv.id}" title="Supprimer la conversation"><i class="fas fa-trash-alt"></i></button>
        `;
        li.addEventListener('click', (e) => {
            // Only trigger select if not clicking the delete button
            if (!e.target.closest('.delete-conversation-btn')) {
                selectCb(conv.id);
            }
        });

        const deleteButton = li.querySelector('.delete-conversation-btn');
        if (deleteButton) {
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent li click event from firing
                deleteCb(e.currentTarget.dataset.id);
            });
        }
        conversationListElement.appendChild(li);
    });

    // Update pagination controls display
    const totalPages = Math.ceil(allConversations.totalCount / itemsPerPage);
    if (currentPageInfoSpan) currentPageInfoSpan.textContent = `Page ${currentPage}/${totalPages}`;
    if (prevPageBtn) prevPageBtn.disabled = (currentPage <= 1);
    if (nextPageBtn) nextPageBtn.disabled = (currentPage >= totalPages);
}
