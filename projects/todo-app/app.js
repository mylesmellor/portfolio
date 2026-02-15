const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const categorySelect = document.getElementById("category-select");
const list = document.getElementById("todo-list");
const emptyState = document.getElementById("empty-state");
const filterBar = document.getElementById("filter-bar");

let todos = loadTodos();
let activeFilter = "All";

const categoryColors = {
    Work: "#4361ee",
    Coding: "#7209b7",
    Personal: "#f77f00",
    Fitness: "#06d6a0",
};

function loadTodos() {
    try {
        return JSON.parse(localStorage.getItem("todos")) || [];
    } catch {
        localStorage.removeItem("todos");
        return [];
    }
}

function saveTodos() {
    localStorage.setItem("todos", JSON.stringify(todos));
}

function getFilteredTodos() {
    if (activeFilter === "All") return todos;
    return todos.filter((t) => t.category === activeFilter);
}

function updateEmptyState() {
    const filtered = getFilteredTodos();
    emptyState.classList.toggle("hidden", filtered.length > 0);
    emptyState.textContent =
        filtered.length === 0 && todos.length > 0
            ? `No ${activeFilter} tasks.`
            : "No tasks yet. Add one above!";
}

function createTodoElement(todo) {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.completed ? " completed" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.setAttribute("aria-label", "Mark \"" + todo.text + "\" as " + (todo.completed ? "incomplete" : "complete"));
    checkbox.addEventListener("change", () => {
        todo.completed = checkbox.checked;
        li.classList.toggle("completed", todo.completed);
        checkbox.setAttribute("aria-label", "Mark \"" + todo.text + "\" as " + (todo.completed ? "incomplete" : "complete"));
        saveTodos();
    });

    const content = document.createElement("div");
    content.className = "todo-content";

    const topRow = document.createElement("div");
    topRow.className = "todo-top-row";

    const span = document.createElement("span");
    span.textContent = todo.text;

    const badge = document.createElement("span");
    badge.className = "category-badge";
    badge.textContent = todo.category;
    badge.style.background = categoryColors[todo.category] || "#888";

    topRow.append(span, badge);

    const time = document.createElement("time");
    time.textContent = new Date(todo.createdAt).toLocaleString();

    content.append(topRow, time);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "\u00d7";
    deleteBtn.title = "Delete task";
    deleteBtn.setAttribute("aria-label", "Delete \"" + todo.text + "\"");
    deleteBtn.addEventListener("click", () => {
        li.style.opacity = "0";
        li.style.transform = "translateY(-8px)";
        li.style.transition = "all 0.2s ease-out";
        setTimeout(() => {
            todos = todos.filter((t) => t.id !== todo.id);
            li.remove();
            saveTodos();
            updateEmptyState();
        }, 200);
    });

    li.append(checkbox, content, deleteBtn);
    return li;
}

function render() {
    list.innerHTML = "";
    getFilteredTodos().forEach((todo) => list.appendChild(createTodoElement(todo)));
    updateEmptyState();
}

filterBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    activeFilter = btn.dataset.category;
    filterBar.querySelector(".active").classList.remove("active");
    btn.classList.add("active");
    render();
});

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    const todo = {
        id: crypto.randomUUID(),
        text,
        completed: false,
        category: categorySelect.value,
        createdAt: new Date().toISOString(),
    };
    todos.push(todo);
    saveTodos();

    if (activeFilter === "All" || activeFilter === todo.category) {
        list.appendChild(createTodoElement(todo));
    }
    updateEmptyState();
    input.value = "";
    input.focus();
});

render();
