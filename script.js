/**
 * Zenith Board - Core JavaScript Logic
 * Handling State, localStorage, Custom Render, Filter Engine, and HTML5 Drag & Drop
 */

// --- 1. STATE DEFINITION & DEFAULT DATA ---
const DEFAULT_COLUMNS = [
  { id: "todo", title: "To Do", color: "#6366f1" },
  { id: "in-progress", title: "In Progress", color: "#3b82f6" },
  { id: "review", title: "In Review", color: "#eab308" },
  { id: "done", title: "Done", color: "#10b981" }
];

const DEFAULT_CARDS = [
  {
    id: "card-1",
    title: "Design System Refactor",
    description: "Update typography scales, button variants, and color tokens for modern look.",
    columnId: "todo",
    priority: "high",
    dueDate: new Date().toISOString().split('T')[0], // Today
    order: 0
  },
  {
    id: "card-2",
    title: "Implement drag-and-drop",
    description: "Write custom Vanilla HTML5 drag events with visual markers and sorting index calculations.",
    columnId: "in-progress",
    priority: "medium",
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    order: 0
  },
  {
    id: "card-3",
    title: "Verify persistence layer",
    description: "Ensure state changes are written to localStorage and successfully loaded on refreshes.",
    columnId: "review",
    priority: "low",
    dueDate: "",
    order: 0
  },
  {
    id: "card-4",
    title: "Project Initialization",
    description: "Establish repository, configure styles, and build HTML templates.",
    columnId: "done",
    priority: "low",
    dueDate: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago (overdue, but in Done column)
    order: 0
  }
];

let state = {
  columns: [],
  cards: []
};

// Currently dragged element reference
let draggedCardId = null;

// --- 2. LOCALSTORAGE MANAGEMENT ---
function loadState() {
  try {
    const savedColumns = localStorage.getItem("zenith_columns");
    const savedCards = localStorage.getItem("zenith_cards");

    state.columns = savedColumns ? JSON.parse(savedColumns) : [...DEFAULT_COLUMNS];
    state.cards = savedCards ? JSON.parse(savedCards) : [...DEFAULT_CARDS];
  } catch (error) {
    console.error("Failed to load state from localStorage:", error);
    state.columns = [...DEFAULT_COLUMNS];
    state.cards = [...DEFAULT_CARDS];
  }
}

function saveState() {
  try {
    localStorage.setItem("zenith_columns", JSON.stringify(state.columns));
    localStorage.setItem("zenith_cards", JSON.stringify(state.cards));
  } catch (error) {
    console.error("Failed to save state to localStorage:", error);
  }
}

// --- 3. RENDERING ENGINE ---
const boardCanvas = document.getElementById("board-canvas");

function renderBoard() {
  // Save scroll positions to prevent jumping during redraw
  const scrollLeft = boardCanvas.scrollLeft;
  const columnScrolls = {};
  document.querySelectorAll('.column-cards').forEach(el => {
    columnScrolls[el.dataset.colId] = el.scrollTop;
  });

  boardCanvas.innerHTML = "";

  // Render Columns
  state.columns.forEach(column => {
    const columnEl = document.createElement("div");
    columnEl.className = "column";
    columnEl.dataset.id = column.id;
    columnEl.innerHTML = `
      <div class="column-header">
        <div class="column-header-left">
          <span class="column-color-indicator" style="background-color: ${column.color};"></span>
          <span class="column-title" title="${column.title}">${column.title}</span>
          <span class="column-count">0</span>
        </div>
        <div class="column-actions">
          <button class="btn-column-action btn-edit-col" title="Edit Column">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-column-action btn-delete-col" title="Delete Column">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      </div>
      <div class="column-cards" data-col-id="${column.id}"></div>
      <button class="btn-add-card" data-col-id="${column.id}">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Card
      </button>
    `;

    // Render Cards in this Column
    const columnCardsContainer = columnEl.querySelector(".column-cards");
    const columnCards = state.cards.filter(card => card.columnId === column.id);

    const sortByVal = document.getElementById("sort-by")?.value || "custom";
    if (sortByVal === "priority") {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      columnCards.sort((a, b) => {
        const weightA = priorityWeight[a.priority] || 0;
        const weightB = priorityWeight[b.priority] || 0;
        if (weightA !== weightB) {
          return weightB - weightA;
        }
        return a.order - b.order;
      });
    } else if (sortByVal === "date") {
      columnCards.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA - dateB;
        }
        return a.order - b.order;
      });
    } else {
      columnCards.sort((a, b) => a.order - b.order);
    }

    columnEl.querySelector(".column-count").textContent = columnCards.length;

    columnCards.forEach(card => {
      const cardEl = createCardElement(card);
      columnCardsContainer.appendChild(cardEl);
    });

    // Add Column event listeners for Drag and Drop
    setupColumnDragEvents(columnEl, columnCardsContainer);

    boardCanvas.appendChild(columnEl);

    // Restore column scroll position
    if (columnScrolls[column.id] !== undefined) {
      columnCardsContainer.scrollTop = columnScrolls[column.id];
    }
  });

  // Restore board canvas scroll
  boardCanvas.scrollLeft = scrollLeft;

  // Refresh Stats and Filters
  applyFilters();
  updateStats();
}

function createCardElement(card) {
  const cardEl = document.createElement("div");
  cardEl.className = "card";
  cardEl.dataset.id = card.id;
  cardEl.draggable = true;

  // Formatting date display
  let dateHtml = "";
  if (card.dueDate) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const dueDateObj = new Date(card.dueDate);
    dueDateObj.setHours(0,0,0,0);
    
    let dateClass = "";
    let dateText = card.dueDate;
    
    if (card.columnId !== "done") {
      if (dueDateObj < today) {
        dateClass = "overdue";
        dateText = "Overdue: " + card.dueDate;
      } else if (dueDateObj.getTime() === today.getTime()) {
        dateClass = "today";
        dateText = "Today";
      }
    }

    dateHtml = `
      <div class="card-date ${dateClass}">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span>${dateText}</span>
      </div>
    `;
  }

  cardEl.innerHTML = `
    <div class="card-header">
      <h4 class="card-title">${escapeHTML(card.title)}</h4>
      <div class="card-actions">
        <button class="btn-card-action btn-edit-card" title="Edit Card">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn-card-action btn-delete-card delete-hover" title="Delete Card">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
    <p class="card-desc">${escapeHTML(card.description || "No description provided.")}</p>
    <div class="card-footer">
      <span class="priority-tag ${card.priority}">${card.priority}</span>
      ${dateHtml}
    </div>
  `;

  // Attach Drag Events to this specific card
  cardEl.addEventListener("dragstart", (e) => {
    draggedCardId = card.id;
    cardEl.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", card.id);
  });

  cardEl.addEventListener("dragend", () => {
    cardEl.classList.remove("dragging");
    document.querySelectorAll(".column").forEach(c => c.classList.remove("drag-over"));
    saveCardsOrderFromDOM();
  });

  return cardEl;
}

// Helper to escape HTML tags to prevent XSS
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// --- 4. DRAG AND DROP HANDLERS ---
function setupColumnDragEvents(columnEl, container) {
  columnEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    const draggingCard = document.querySelector(".card.dragging");
    if (!draggingCard) return;

    const afterElement = getDragAfterElement(container, e.clientY);
    if (afterElement == null) {
      container.appendChild(draggingCard);
    } else {
      container.insertBefore(draggingCard, afterElement);
    }
  });

  columnEl.addEventListener("dragenter", (e) => {
    e.preventDefault();
    columnEl.classList.add("drag-over");
  });

  columnEl.addEventListener("dragleave", (e) => {
    // Only remove if cursor actually leaves the column element boundaries
    if (!columnEl.contains(e.relatedTarget)) {
      columnEl.classList.remove("drag-over");
    }
  });

  columnEl.addEventListener("drop", (e) => {
    e.preventDefault();
    columnEl.classList.remove("drag-over");
    saveCardsOrderFromDOM();
  });
}

// Dynamic positioning logic to sort cards vertically
function getDragAfterElement(container, y) {
  // Query all cards that are visible and not being dragged
  const draggableElements = [...container.querySelectorAll(".card:not(.dragging):not(.hidden-by-filter)")];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2; // Distance to card middle line
    
    // We are dragging above the card's middle
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function saveCardsOrderFromDOM() {
  const sortByVal = document.getElementById("sort-by")?.value || "custom";
  const columns = document.querySelectorAll(".column");
  let listUpdated = false;

  columns.forEach(columnEl => {
    const columnId = columnEl.dataset.id;
    const cardElements = columnEl.querySelectorAll(".card");
    
    cardElements.forEach((cardEl, index) => {
      const cardId = cardEl.dataset.id;
      const cardIndex = state.cards.findIndex(c => c.id === cardId);
      
      if (cardIndex !== -1) {
        const card = state.cards[cardIndex];
        
        if (sortByVal === "custom") {
          if (card.columnId !== columnId || card.order !== index) {
            card.columnId = columnId;
            card.order = index;
            listUpdated = true;
          }
        } else {
          if (card.columnId !== columnId) {
            card.columnId = columnId;
            listUpdated = true;
          }
        }
      }
    });
  });

  if (listUpdated) {
    saveState();
    updateStats();
    
    if (sortByVal !== "custom") {
      renderBoard();
    } else {
      // Update counter badges on headers dynamically
      columns.forEach(columnEl => {
        const colId = columnEl.dataset.id;
        const count = state.cards.filter(c => c.columnId === colId).length;
        columnEl.querySelector(".column-count").textContent = count;
      });
    }
  }
}

// --- 5. STATS MODULE ---
function updateStats() {
  const totalCount = state.cards.length;
  // Let's identify the 'Done' column
  const doneColumnId = state.columns.find(c => c.title.toLowerCase() === "done")?.id || "done";
  const doneCount = state.cards.filter(c => c.columnId === doneColumnId).length;
  
  const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  document.getElementById("total-cards-count").textContent = totalCount;
  document.getElementById("completed-cards-count").textContent = doneCount;
  document.getElementById("completion-rate").textContent = `${completionRate}%`;
}

// --- 6. SEARCH & FILTER ENGINES ---
const searchInput = document.getElementById("search-input");
const sortBy = document.getElementById("sort-by");
const filterPriority = document.getElementById("filter-priority");
const filterDate = document.getElementById("filter-date");
const btnClearFilters = document.getElementById("btn-clear-filters");

function applyFilters() {
  const searchQuery = searchInput.value.toLowerCase().trim();
  const priorityVal = filterPriority.value;
  const dateVal = filterDate.value;

  let filtersActive = searchQuery !== "" || priorityVal !== "all" || dateVal !== "all";

  if (filtersActive) {
    btnClearFilters.classList.remove("hidden");
  } else {
    btnClearFilters.classList.add("hidden");
  }

  const cardElements = document.querySelectorAll(".card");
  cardElements.forEach(cardEl => {
    const cardId = cardEl.dataset.id;
    const card = state.cards.find(c => c.id === cardId);
    
    if (!card) return;

    let matchesSearch = true;
    if (searchQuery) {
      matchesSearch = card.title.toLowerCase().includes(searchQuery) || 
                      card.description.toLowerCase().includes(searchQuery);
    }

    let matchesPriority = true;
    if (priorityVal !== "all") {
      matchesPriority = card.priority === priorityVal;
    }

    let matchesDate = true;
    if (dateVal !== "all" && card.dueDate) {
      const today = new Date();
      today.setHours(0,0,0,0);
      const dueDateObj = new Date(card.dueDate);
      dueDateObj.setHours(0,0,0,0);

      if (dateVal === "overdue") {
        matchesDate = dueDateObj < today && card.columnId !== "done";
      } else if (dateVal === "today") {
        matchesDate = dueDateObj.getTime() === today.getTime();
      } else if (dateVal === "week") {
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        matchesDate = dueDateObj >= today && dueDateObj <= nextWeek;
      }
    } else if (dateVal !== "all" && !card.dueDate) {
      matchesDate = false; // Filter requested a date, but card has none
    }

    if (matchesSearch && matchesPriority && matchesDate) {
      cardEl.classList.remove("hidden-by-filter");
    } else {
      cardEl.classList.add("hidden-by-filter");
    }
  });
}

function clearFilters() {
  searchInput.value = "";
  filterPriority.value = "all";
  filterDate.value = "all";
  applyFilters();
}

searchInput.addEventListener("input", applyFilters);
if (sortBy) {
  sortBy.addEventListener("change", renderBoard);
}
filterPriority.addEventListener("change", applyFilters);
filterDate.addEventListener("change", applyFilters);
btnClearFilters.addEventListener("click", clearFilters);

// --- 7. MODALS ENGINE ---
const cardModal = document.getElementById("modal-card");
const columnModal = document.getElementById("modal-column");
const cardForm = document.getElementById("form-card");
const columnForm = document.getElementById("form-column");

// Card modal element references
const cardIdInput = document.getElementById("card-id");
const cardColumnIdInput = document.getElementById("card-column-id");
const cardTitleInput = document.getElementById("card-title-input");
const cardDescInput = document.getElementById("card-desc-input");
const cardPriorityInput = document.getElementById("card-priority-input");
const cardDateInput = document.getElementById("card-date-input");

// Column modal element references
const columnIdInput = document.getElementById("column-id");
const columnTitleInput = document.getElementById("column-title-input");

function openCardModal(card = null, defaultColumnId = "") {
  if (card) {
    document.getElementById("modal-card-title").textContent = "Edit Card";
    cardIdInput.value = card.id;
    cardColumnIdInput.value = card.columnId;
    cardTitleInput.value = card.title;
    cardDescInput.value = card.description;
    cardPriorityInput.value = card.priority;
    cardDateInput.value = card.dueDate;
    document.getElementById("btn-save-card").textContent = "Save Card";
  } else {
    document.getElementById("modal-card-title").textContent = "Create New Card";
    cardIdInput.value = "";
    cardColumnIdInput.value = defaultColumnId;
    cardTitleInput.value = "";
    cardDescInput.value = "";
    cardPriorityInput.value = "medium";
    cardDateInput.value = "";
    document.getElementById("btn-save-card").textContent = "Create Card";
  }
  cardModal.classList.add("active");
  cardTitleInput.focus();
}

function closeCardModal() {
  cardModal.classList.remove("active");
  cardForm.reset();
}

function openColumnModal(column = null) {
  if (column) {
    document.getElementById("modal-column-title").textContent = "Edit Column";
    columnIdInput.value = column.id;
    columnTitleInput.value = column.title;
    
    const radio = columnForm.querySelector(`input[name="column-color"][value="${column.color}"]`);
    if (radio) radio.checked = true;
    
    document.getElementById("btn-save-column").textContent = "Save Column";
  } else {
    document.getElementById("modal-column-title").textContent = "Add New Column";
    columnIdInput.value = "";
    columnTitleInput.value = "";
    columnForm.querySelector('input[name="column-color"]').checked = true;
    document.getElementById("btn-save-column").textContent = "Add Column";
  }
  columnModal.classList.add("active");
  columnTitleInput.focus();
}

function closeColumnModal() {
  columnModal.classList.remove("active");
  columnForm.reset();
}

// Close Modal clicks on background overlays
cardModal.addEventListener("click", (e) => {
  if (e.target === cardModal) closeCardModal();
});
columnModal.addEventListener("click", (e) => {
  if (e.target === columnModal) closeColumnModal();
});

document.getElementById("btn-close-card-modal").addEventListener("click", closeCardModal);
document.getElementById("btn-cancel-card").addEventListener("click", closeCardModal);
document.getElementById("btn-close-column-modal").addEventListener("click", closeColumnModal);
document.getElementById("btn-cancel-column").addEventListener("click", closeColumnModal);

// --- 8. CARD CRUD OPERATIONS ---
cardForm.addEventListener("submit", (e) => {
  e.preventDefault();
  
  const id = cardIdInput.value;
  const colId = cardColumnIdInput.value;
  const title = cardTitleInput.value.trim();
  const description = cardDescInput.value.trim();
  const priority = cardPriorityInput.value;
  const dueDate = cardDateInput.value;

  if (!title) return;

  if (id) {
    // Edit Mode
    const card = state.cards.find(c => c.id === id);
    if (card) {
      card.title = title;
      card.description = description;
      card.priority = priority;
      card.dueDate = dueDate;
    }
  } else {
    // Create Mode
    // Determine the highest order index in the target column
    const siblings = state.cards.filter(c => c.columnId === colId);
    const maxOrder = siblings.length > 0 ? Math.max(...siblings.map(s => s.order)) : -1;
    
    const newCard = {
      id: "card-" + Date.now(),
      title,
      description,
      columnId: colId,
      priority,
      dueDate,
      order: maxOrder + 1
    };
    state.cards.push(newCard);
  }

  saveState();
  closeCardModal();
  renderBoard();
});

// Click Delegations for Card actions (Edit/Delete) and adding cards from columns
boardCanvas.addEventListener("click", (e) => {
  // Add Card button inside column
  const btnAddCard = e.target.closest(".btn-add-card");
  if (btnAddCard) {
    const colId = btnAddCard.dataset.colId;
    openCardModal(null, colId);
    return;
  }

  // Edit Card
  const btnEditCard = e.target.closest(".btn-edit-card");
  if (btnEditCard) {
    const cardId = btnEditCard.closest(".card").dataset.id;
    const card = state.cards.find(c => c.id === cardId);
    if (card) openCardModal(card);
    return;
  }

  // Delete Card
  const btnDeleteCard = e.target.closest(".btn-delete-card");
  if (btnDeleteCard) {
    const cardId = btnDeleteCard.closest(".card").dataset.id;
    if (confirm("Are you sure you want to delete this card?")) {
      state.cards = state.cards.filter(c => c.id !== cardId);
      saveState();
      renderBoard();
    }
    return;
  }

  // Edit Column
  const btnEditCol = e.target.closest(".btn-edit-col");
  if (btnEditCol) {
    const colId = btnEditCol.closest(".column").dataset.id;
    const column = state.columns.find(c => c.id === colId);
    if (column) openColumnModal(column);
    return;
  }

  // Delete Column
  const btnDeleteCol = e.target.closest(".btn-delete-col");
  if (btnDeleteCol) {
    const colId = btnDeleteCol.closest(".column").dataset.id;
    const column = state.columns.find(c => c.id === colId);
    if (column) {
      if (confirm(`Delete the column "${column.title}"? All cards inside this column will also be permanently deleted.`)) {
        state.columns = state.columns.filter(c => c.id !== colId);
        state.cards = state.cards.filter(c => c.columnId !== colId);
        saveState();
        renderBoard();
      }
    }
  }
});

// --- 9. COLUMN CRUD OPERATIONS ---
document.getElementById("btn-add-column").addEventListener("click", () => {
  openColumnModal();
});

columnForm.addEventListener("submit", (e) => {
  e.preventDefault();
  
  const id = columnIdInput.value;
  const title = columnTitleInput.value.trim();
  const color = columnForm.querySelector('input[name="column-color"]:checked').value;

  if (!title) return;

  if (id) {
    // Edit Column
    const column = state.columns.find(c => c.id === id);
    if (column) {
      column.title = title;
      column.color = color;
    }
  } else {
    // Add Column
    const newColId = "col-" + Date.now();
    const newColumn = {
      id: newColId,
      title,
      color
    };
    state.columns.push(newColumn);
  }

  saveState();
  closeColumnModal();
  renderBoard();
});

// --- 10. THEME TOGGLE ENGINE ---
const btnThemeToggle = document.getElementById("btn-theme-toggle");
const themeIcon = document.getElementById("theme-icon");

function initTheme() {
  const savedTheme = localStorage.getItem("kanban_theme") || "dark";
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    setThemeIcon("light");
  } else {
    document.body.classList.remove("light-theme");
    setThemeIcon("dark");
  }
}

function toggleTheme() {
  const isLight = document.body.classList.toggle("light-theme");
  const newTheme = isLight ? "light" : "dark";
  localStorage.setItem("kanban_theme", newTheme);
  setThemeIcon(newTheme);
}

function setThemeIcon(theme) {
  if (!themeIcon) return;
  if (theme === "light") {
    // Sun icon SVG
    themeIcon.innerHTML = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
    if (btnThemeToggle) btnThemeToggle.title = "Switch to McLaren Theme (Dark)";
  } else {
    // Moon icon SVG
    themeIcon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
    if (btnThemeToggle) btnThemeToggle.title = "Switch to Mercedes Theme (Light)";
  }
}

if (btnThemeToggle) {
  btnThemeToggle.addEventListener("click", toggleTheme);
}

// --- 11. INITIALIZATION ---
initTheme();
loadState();
renderBoard();
