(() => {
  const API_URL = "https://jsonplaceholder.typicode.com/todos?_limit=20";

  const state = {
    todos: [],
    sort: { key: "creationDate", direction: "asc" },
    filter: { from: null, to: null },
    selectedIds: new Set(),
    editingTodoId: null,
  };

  const dom = {
    todoList: null,
    sidebar: null,
    mainCard: null,
    descriptionInput: null,
    fromDateDesktop: null,
    toDateDesktop: null,
    fromDateMobile: null,
    toDateMobile: null,
    mobileFiltersPanel: null,
  };

  // ---------- Utilities ----------

  function randomDate(start, end) {
    const startMs = start.getTime();
    const endMs = end.getTime();
    const randomMs = startMs + Math.random() * (endMs - startMs);
    return new Date(randomMs);
  }

  function formatDate(date) {
    const d = new Date(date);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }

  // ---------- Data ----------

  async function loadTodos() {
    const res = await fetch(API_URL);
    const data = await res.json();

    const start = new Date(2024, 0, 1); // Jan 1, 2024
    const end = new Date(2024, 6, 1); // Jul 1, 2024

    state.todos = data.map((item) => ({
      id: item.id,
      title: item.title,
      completed: item.completed,
      description: item.title,
      creationDate: randomDate(start, end),
    }));

    render();
  }

  function getVisibleTodos() {
    let result = [...state.todos];

    const { from, to } = state.filter;

    if (from || to) {
      result = result.filter((t) => {
        const d = t.creationDate;
        const afterFrom = from ? d >= from : true;
        const beforeTo = to ? d <= to : true;
        return afterFrom && beforeTo;
      });
    }

    const { key, direction } = state.sort;

    result.sort((a, b) => {
      let cmp;
      if (key === "title") {
        cmp = a.title.localeCompare(b.title);
      } else {
        cmp = a.creationDate.getTime() - b.creationDate.getTime();
      }
      return direction === "asc" ? cmp : -cmp;
    });

    return result;
  }

  // ---------- Rendering ----------

  function render() {
    const visibleTodos = getVisibleTodos();
    renderSortArrows();
    renderRows(visibleTodos);
    syncSelectAllState(visibleTodos);
  }

  function renderRows(visibleTodos) {
    dom.todoList.innerHTML = "";

    visibleTodos.forEach((todo) => {
      const row = document.createElement("div");
      row.className = "list-row";
      if (todo.completed) row.classList.add("completed");
      row.dataset.id = todo.id;

      row.innerHTML = `
        <div class="cell checkbox-cell">
          <input
            type="checkbox"
            class="row-checkbox"
            ${state.selectedIds.has(todo.id) ? "checked" : ""}
          />
        </div>
        <div class="cell name-cell">
          <button
            type="button"
            class="icon-button edit-icon edit-btn"
          >
            ✏️
          </button>
          <span class="todo-title">${todo.title}</span>
        </div>
        <div class="cell date-cell">
          ${formatDate(todo.creationDate)}
        </div>
        <div class="cell delete-cell">
          <button
            type="button"
            class="icon-button delete-icon delete-btn"
          >
            🗑
          </button>
        </div>
      `;

      dom.todoList.appendChild(row);
    });
  }

  function syncSelectAllState(visibleTodos = getVisibleTodos()) {
    const selectAllEl = document.getElementById("select-all");

    if (visibleTodos.length === 0) {
      selectAllEl.checked = false;
      return;
    }

    const allVisibleSelected = visibleTodos.every((t) =>
      state.selectedIds.has(t.id)
    );
    selectAllEl.checked = allVisibleSelected;
  }

  function renderSortArrows() {
    const map = {
      "title-asc": document.querySelector("[data-sort-arrow='title-asc']"),
      "title-desc": document.querySelector("[data-sort-arrow='title-desc']"),
      "date-asc": document.querySelector("[data-sort-arrow='date-asc']"),
      "date-desc": document.querySelector("[data-sort-arrow='date-desc']"),
    };

    Object.values(map).forEach((el) => el && el.classList.remove("active"));

    const { key, direction } = state.sort;
    if (key === "title") {
      const arrowKey = direction === "asc" ? "title-asc" : "title-desc";
      map[arrowKey]?.classList.add("active");
    } else {
      const arrowKey = direction === "asc" ? "date-asc" : "date-desc";
      map[arrowKey]?.classList.add("active");
    }
  }

  // ---------- Sort handlers ----------

  function handleSortByTitle() {
    if (state.sort.key === "title") {
      state.sort.direction = state.sort.direction === "asc" ? "desc" : "asc";
    } else {
      state.sort.key = "title";
      state.sort.direction = "asc";
    }
    render();
  }

  function handleSortByDate() {
    if (state.sort.key === "creationDate") {
      state.sort.direction = state.sort.direction === "asc" ? "desc" : "asc";
    } else {
      state.sort.key = "creationDate";
      state.sort.direction = "asc";
    }
    render();
  }

  // ---------- Selection ----------

  function handleSelectAllChange(checked) {
    const visibleTodos = getVisibleTodos();
    if (checked) {
      visibleTodos.forEach((t) => state.selectedIds.add(t.id));
    } else {
      visibleTodos.forEach((t) => state.selectedIds.delete(t.id));
    }
    render();
  }

  function handleRowCheckboxChange(id, checked) {
    if (checked) {
      state.selectedIds.add(id);
    } else {
      state.selectedIds.delete(id);
    }
    syncSelectAllState();
  }

  // ---------- Sidebar (description editing) ----------

  function openSidebar(todo) {
    state.editingTodoId = todo.id;
    dom.descriptionInput.value = todo.description || "";
    dom.sidebar.classList.add("open");
    dom.mainCard.classList.add("blur");
  }

  function closeSidebar() {
    state.editingTodoId = null;
    dom.sidebar.classList.remove("open");
    dom.mainCard.classList.remove("blur");
  }

  function saveDescription() {
    if (state.editingTodoId == null) return;
    const newText = dom.descriptionInput.value || "";
    state.todos = state.todos.map((t) =>
      t.id === state.editingTodoId ? { ...t, description: newText } : t
    );
    closeSidebar();
  }

  // ---------- Delete ----------

  function deleteTodo(id) {
    state.todos = state.todos.filter((t) => t.id !== id);
    state.selectedIds.delete(id);
    render();
  }

  // ---------- Filters ----------

  function setFilter(fromValue, toValue) {
    state.filter.from = fromValue ? new Date(fromValue) : null;
    state.filter.to = toValue ? new Date(toValue) : null;
  }

  function applyFiltersDesktop() {
    const fromVal = dom.fromDateDesktop.value;
    const toVal = dom.toDateDesktop.value;

    // keep mobile in sync
    dom.fromDateMobile.value = fromVal;
    dom.toDateMobile.value = toVal;

    setFilter(fromVal, toVal);
    render();
  }

  function resetFiltersDesktop() {
    dom.fromDateDesktop.value = "";
    dom.toDateDesktop.value = "";
    dom.fromDateMobile.value = "";
    dom.toDateMobile.value = "";
    setFilter(null, null);
    render();
  }

  function applyFiltersMobile() {
    const fromVal = dom.fromDateMobile.value;
    const toVal = dom.toDateMobile.value;

    // keep desktop in sync
    dom.fromDateDesktop.value = fromVal;
    dom.toDateDesktop.value = toVal;

    setFilter(fromVal, toVal);
    closeMobileFilters();
    render();
  }

  function resetFiltersMobile() {
    dom.fromDateMobile.value = "";
    dom.toDateMobile.value = "";
    dom.fromDateDesktop.value = "";
    dom.toDateDesktop.value = "";
    setFilter(null, null);
    closeMobileFilters();
    render();
  }

  // ---------- Mobile filters panel ----------

  function openMobileFilters() {
    dom.mobileFiltersPanel.classList.add("open");
    dom.mainCard.classList.add("blur");
  }

  function closeMobileFilters() {
    dom.mobileFiltersPanel.classList.remove("open");
    dom.mainCard.classList.remove("blur");
  }

  // ---------- DOM / Events ----------

  function cacheDom() {
    dom.todoList = document.getElementById("todo-list");
    dom.sidebar = document.getElementById("sidebar");
    dom.mainCard = document.getElementById("main-card");
    dom.descriptionInput = document.getElementById("description-input");

    dom.fromDateDesktop = document.getElementById("from-date");
    dom.toDateDesktop = document.getElementById("to-date");
    dom.fromDateMobile = document.getElementById("from-date-mobile");
    dom.toDateMobile = document.getElementById("to-date-mobile");

    dom.mobileFiltersPanel = document.getElementById("mobile-filters-panel");
  }

  function bindEvents() {
    // Sort
    document
      .getElementById("sort-title")
      .addEventListener("click", handleSortByTitle);

    document
      .getElementById("sort-date")
      .addEventListener("click", handleSortByDate);

    // Select all
    document.getElementById("select-all").addEventListener("change", (e) => {
      handleSelectAllChange(e.target.checked);
    });

    // Table body (delegation)
    dom.todoList.addEventListener("change", (e) => {
      if (!e.target.classList.contains("row-checkbox")) return;
      const row = e.target.closest(".list-row");
      if (!row) return;
      const id = Number(row.dataset.id);
      handleRowCheckboxChange(id, e.target.checked);
    });

    dom.todoList.addEventListener("click", (e) => {
      const row = e.target.closest(".list-row");
      if (!row) return;
      const id = Number(row.dataset.id);
      const todo = state.todos.find((t) => t.id === id);
      if (!todo) return;

      if (e.target.classList.contains("edit-btn")) {
        openSidebar(todo);
      } else if (e.target.classList.contains("delete-btn")) {
        deleteTodo(id);
      }
    });

    // Sidebar
    document
      .getElementById("close-sidebar-btn")
      .addEventListener("click", closeSidebar);

    document
      .getElementById("save-description-btn")
      .addEventListener("click", saveDescription);

    // Desktop filters
    document
      .getElementById("apply-filters-btn")
      .addEventListener("click", applyFiltersDesktop);

    document
      .getElementById("reset-filters-btn")
      .addEventListener("click", resetFiltersDesktop);

    // Mobile filters
    document
      .getElementById("open-mobile-filters")
      .addEventListener("click", openMobileFilters);

    document
      .getElementById("close-mobile-filters")
      .addEventListener("click", closeMobileFilters);

    document
      .getElementById("apply-mobile-filters")
      .addEventListener("click", applyFiltersMobile);

    document
      .getElementById("reset-mobile-filters")
      .addEventListener("click", resetFiltersMobile);
  }

  function init() {
    cacheDom();
    bindEvents();
    loadTodos().catch((err) => {
      console.error("Failed to load todos:", err);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
