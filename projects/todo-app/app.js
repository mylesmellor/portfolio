const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const emptyState = document.getElementById("empty-state");

let todos = JSON.parse(localStorage.getItem("todos")) || [];

function saveTodos() {
    localStorage.setItem("todos", JSON.stringify(todos));
}

function updateEmptyState() {
    emptyState.classList.toggle("hidden", todos.length > 0);
}

function createTodoElement(todo) {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.completed ? " completed" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.addEventListener("change", () => {
        todo.completed = checkbox.checked;
        li.classList.toggle("completed", todo.completed);
        saveTodos();
    });

    const content = document.createElement("div");
    content.className = "todo-content";

    const span = document.createElement("span");
    span.textContent = todo.text;

    const time = document.createElement("time");
    time.textContent = new Date(todo.createdAt).toLocaleString();

    content.append(span, time);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "\u00d7";
    deleteBtn.title = "Delete task";
    deleteBtn.addEventListener("click", () => {
        li.style.opacity = "0";
        li.style.transform = "translateY(-8px)";
        li.style.transition = "all 0.2s ease-out";
        setTimeout(() => {
            todos = todos.filter((t) => t !== todo);
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
    todos.forEach((todo) => list.appendChild(createTodoElement(todo)));
    updateEmptyState();
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    const todo = { text, completed: false, createdAt: new Date().toISOString() };
    todos.push(todo);
    list.appendChild(createTodoElement(todo));
    saveTodos();
    updateEmptyState();
    input.value = "";
    input.focus();
});

render();
