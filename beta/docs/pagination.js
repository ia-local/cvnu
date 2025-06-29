// docs/pagination.js

// Les éléments DOM sont passés lors de l'initialisation depuis app.js
let conversationListElement;
let prevPageBtn;
let nextPageBtn;
let currentPageInfoSpan;

// State variables
let allConversations = { conversations: [], totalCount: 0 };
let currentPage = 1;
let itemsPerPage = 5;

// Callbacks from main app logic (app.js)
let selectConversationCallback = null;
let deleteConversationCallback = null;
let fetchConversationsCallback = null;
let activeConversationId = null; // Track the currently active conversation

/**
 * Initializes pagination controls with necessary callbacks and DOM elements.
 * This function should be called by app.js when the chatroom section is activated.
 * @param {HTMLElement} listEl - The ul element for conversation list.
 * @param {HTMLElement} prevBtn - The "previous page" button element.
 * @param {HTMLElement} nextBtn - The "next page" button element.
 * @param {HTMLElement} pageInfoSpan - The span element displaying current page info.
 * @param {function} fetchConversationsCb - Callback to fetch conversations for a given page.
 * @param {function} selectConversationCb - Callback to select a conversation.
 * @param {function} deleteConversationCb - Callback to delete a conversation.
 */
export function initPaginationControls(listEl, prevBtn, nextBtn, pageInfoSpan, fetchConversationsCb, selectConversationCb, deleteConversationCb) {
    // Assign DOM elements passed from app.js
    conversationListElement = listEl;
    prevPageBtn = prevBtn;
    nextPageBtn = nextBtn;
    currentPageInfoSpan = pageInfoSpan;

    fetchConversationsCallback = fetchConversationsCb;
    selectConversationCallback = selectConversationCb;
    deleteConversationCallback = deleteConversationCb;

    // Remove existing listeners before re-adding to prevent duplicates on re-initialization
    if (prevPageBtn) prevPageBtn.removeEventListener('click', handlePrevPageClick);
    if (nextPageBtn) nextPageBtn.removeEventListener('click', handleNextPageClick);
    if (conversationListElement) conversationListElement.removeEventListener('click', handleConversationListClick);

    // Add event listeners
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', handlePrevPageClick);
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', handleNextPageClick);
    }

    // Event delegation for conversation list items and delete buttons
    if (conversationListElement) {
        conversationListElement.addEventListener('click', handleConversationListClick);
    }
}

// Named event handlers for proper removal
function handlePrevPageClick() {
    if (currentPage > 1) {
        currentPage--;
        if (fetchConversationsCallback) {
            fetchConversationsCallback(currentPage);
        }
    }
}

function handleNextPageClick() {
    const totalPages = Math.ceil(allConversations.totalCount / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        if (fetchConversationsCallback) {
            fetchConversationsCallback(currentPage);
        }
    }
}

function handleConversationListClick(event) {
    const target = event.target;

    // Handle delete button click
    const deleteButton = target.closest('.delete-conversation-btn');
    if (deleteButton && deleteConversationCallback) {
        event.stopPropagation(); // Prevent the parent <li> click event from firing
        deleteConversationCallback(deleteButton.dataset.id);
        return;
    }

    // Handle conversation item click
    const conversationItem = target.closest('.conversation-item');
    if (conversationItem && selectConversationCallback) {
        selectConversationCallback(conversationItem.dataset.id);
    }
}

/**
 * Sets the current active conversation ID to highlight it in the list.
 * @param {string|null} id - The ID of the conversation to set as active, or null to clear.
 */
export function setActiveConversationId(id) {
    if (activeConversationId === id) return; // No change needed

    // Remove active class from previously active item
    if (activeConversationId && conversationListElement) {
        const prevActiveItem = conversationListElement.querySelector(`.conversation-item[data-id="${activeConversationId}"]`);
        if (prevActiveItem) {
            prevActiveItem.classList.remove('active');
        }
    }

    activeConversationId = id; // Set new active ID

    // Add active class to new active item
    if (activeConversationId && conversationListElement) {
        const newActiveItem = conversationListElement.querySelector(`.conversation-item[data-id="${activeConversationId}"]`);
        if (newActiveItem) {
            newActiveItem.classList.add('active');
        }
    }
}


/**
 * Sets the conversations data and updates pagination properties.
 * @param {Array<Object>} conversationsData - Array of conversation objects for the current page.
 * @param {number} totalCount - Total number of conversations available.
 * @param {number} page - Current page number.
 * @param {number} perPage - Number of items per page.
 */
export function setConversations(conversationsData, totalCount, page, perPage) {
    allConversations.conversations = conversationsData;
    allConversations.totalCount = totalCount;
    currentPage = page;
    itemsPerPage = perPage;
}

/**
 * Renders the conversation list based on the current `allConversations` data.
 * This function should be called after `setConversations`.
 */
export function renderChatConversationList() {
    if (!conversationListElement) {
        console.error("conversationListElement is not defined for rendering. Call initPaginationControls first.");
        return;
    }

    conversationListElement.innerHTML = '';
    if (!allConversations.conversations || allConversations.conversations.length === 0) {
        conversationListElement.innerHTML = '<p class="placeholder-text">Aucune conversation. Cliquez sur "Nouvelle" pour commencer.</p>';
        if (currentPageInfoSpan) currentPageInfoSpan.textContent = 'Page 0/0';
        if (prevPageBtn) prevPageBtn.disabled = true;
        if (nextPageBtn) nextPageBtn.disabled = true;
        const paginationControls = document.getElementById('conversation-pagination');
        if (paginationControls) {
            paginationControls.style.display = 'none';
        }
        return;
    }

    const paginationControls = document.getElementById('conversation-pagination');
    if (paginationControls) {
        paginationControls.style.display = 'flex';
    }

    allConversations.conversations.forEach(conv => {
        const li = document.createElement('li');
        li.className = `conversation-item ${conv.id === activeConversationId ? 'active' : ''}`;
        li.dataset.id = conv.id;
        li.innerHTML = `
            <span>${conv.title || `Conversation ${conv.createdAt ? new Date(conv.createdAt).toLocaleString() : conv.id.substring(0, 4) + '...'}`}</span>
            <button class="delete-conversation-btn" data-id="${conv.id}" title="Supprimer la conversation"><i class="fas fa-trash-alt"></i></button>
        `;
        conversationListElement.appendChild(li);
    });

    const totalPages = Math.ceil(allConversations.totalCount / itemsPerPage);
    if (currentPageInfoSpan) currentPageInfoSpan.textContent = `Page ${currentPage}/${totalPages}`;
    if (prevPageBtn) prevPageBtn.disabled = (currentPage <= 1);
    if (nextPageBtn) nextPageBtn.disabled = (currentPage >= totalPages);
}
