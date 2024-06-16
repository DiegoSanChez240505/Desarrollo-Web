document.addEventListener('DOMContentLoaded', loadTasksFromLocalStorage);

document.getElementById('addTaskButton').addEventListener('click', function() {
    const taskInput = document.getElementById('taskInput').value;
    const taskResponsible = document.getElementById('taskResponsible').value;
    const taskStartDate = document.getElementById('taskStartDate').value;
    const taskEndDate = document.getElementById('taskEndDate').value;
    const currentDate = new Date().toISOString().split('T')[0];

    if (!taskInput || !taskResponsible || !taskStartDate || !taskEndDate) {
        alert('Por favor, complete todos los campos.');
        return;
    }

    if (taskStartDate < currentDate) {
        alert('No puede ingresar una nueva tarea con una fecha de inicio menor a la actual.');
        return;
    }

    if (taskEndDate < currentDate) {
        alert('No puede ingresar una nueva tarea con una fecha de fin menor a la actual.');
        return;
    }

    if (taskStartDate > taskEndDate) {
        alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
        return;
    }

    const task = {
        id: Date.now(),
        name: taskInput,
        responsible: taskResponsible,
        startDate: taskStartDate,
        endDate: taskEndDate,
        status: 'pending'
    };

    addTaskToDOM(task);
    saveTaskToLocalStorage(task);

    document.getElementById('taskInput').value = '';
    document.getElementById('taskResponsible').value = '';
    document.getElementById('taskStartDate').value = '';
    document.getElementById('taskEndDate').value = '';
});

document.getElementById('clearAllTasksButton').addEventListener('click', function() {
    if (confirm('¿Está seguro de que desea eliminar todas las tareas?')) {
        document.getElementById('taskList').innerHTML = '';
        localStorage.removeItem('tasks');
    }
});

document.getElementById('searchInput').addEventListener('input', filterTasks);
document.getElementById('filterAll').addEventListener('click', () => filterTasks('all'));
document.getElementById('filterPending').addEventListener('click', () => filterTasks('pending'));
document.getElementById('filterResolved').addEventListener('click', () => filterTasks('resolved'));
document.getElementById('filterOverdue').addEventListener('click', () => filterTasks('overdue'));

function confirmDeleteTask(button) {
    if (confirm('¿Está seguro de que desea eliminar esta tarea?')) {
        const taskItem = button.parentElement;
        taskItem.remove();
        removeTaskFromLocalStorage(taskItem.getAttribute('data-id'));
    }
}

function markAsResolved(button) {
    const taskItem = button.parentElement;
    const taskEndDate = taskItem.getAttribute('data-endDate');
    const currentDate = new Date().toISOString().split('T')[0];

    if (taskEndDate < currentDate) {
        alert('No se puede marcar como resuelta una tarea cuya fecha de fin ya ha expirado.');
        return;
    }

    taskItem.classList.remove('task-pending');
    taskItem.classList.add('task-resolved');
    button.style.display = 'none';
    taskItem.querySelector('.btn-warning').style.display = 'inline-block';
    updateTaskStatusInLocalStorage(taskItem.getAttribute('data-id'), 'resolved');
}

function markAsPending(button) {
    const taskItem = button.parentElement;
    taskItem.classList.remove('task-resolved');
    taskItem.classList.add('task-pending');
    button.style.display = 'none';
    taskItem.querySelector('.btn-success').style.display = 'inline-block';
    updateTaskStatusInLocalStorage(taskItem.getAttribute('data-id'), 'pending');
}

function loadTasksFromLocalStorage() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.forEach(task => addTaskToDOM(task));
    updateTaskStatus();
}

function saveTaskToLocalStorage(task) {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function removeTaskFromLocalStorage(taskId) {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const updatedTasks = tasks.filter(task => task.id != taskId);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
}

function updateTaskStatusInLocalStorage(taskId, status) {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const updatedTasks = tasks.map(task => {
        if (task.id == taskId) {
            task.status = status;
        }
        return task;
    });
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
}

function addTaskToDOM(task) {
    const taskList = document.getElementById('taskList');
    const newTask = document.createElement('li');
    newTask.className = `list-group-item task-${task.status}`;
    newTask.setAttribute('data-id', task.id);
    newTask.setAttribute('data-endDate', task.endDate);
    newTask.innerHTML = `
        Tarea: ${task.name} | Responsable: ${task.responsible} | Inicio: ${task.startDate} | Fin: ${task.endDate}
        <button class="btn btn-success btn-sm float-end" onclick="markAsResolved(this)" ${task.status === 'resolved' ? 'style="display:none;"' : ''}>Marcar como Resuelta</button>
        <button class="btn btn-warning btn-sm float-end me-2" onclick="markAsPending(this)" ${task.status === 'pending' ? 'style="display:none;"' : ''}>Desmarcar</button>
        <button class="btn btn-danger btn-sm float-end me-2" onclick="confirmDeleteTask(this)">Eliminar</button>
    `;

    taskList.appendChild(newTask);
}

function updateTaskStatus() {
    const tasks = document.querySelectorAll('.list-group-item');
    const currentDate = new Date().toISOString().split('T')[0];

    tasks.forEach(task => {
        const taskEndDate = task.getAttribute('data-endDate');
        if (taskEndDate < currentDate && !task.classList.contains('task-resolved')) {
            task.classList.remove('task-pending');
            task.classList.add('task-overdue');
        }
    });
}

function filterTasks(filter = 'all') {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const tasks = document.querySelectorAll('.list-group-item');

    tasks.forEach(task => {
        const taskName = task.textContent.toLowerCase();
        const matchesSearch = taskName.includes(searchInput);
        let matchesFilter = true;

        if (filter === 'pending') {
            matchesFilter = task.classList.contains('task-pending');
        } else if (filter === 'resolved') {
            matchesFilter = task.classList.contains('task-resolved');
        } else if (filter === 'overdue') {
            matchesFilter = task.classList.contains('task-overdue');
        }

        if (matchesSearch && matchesFilter) {
            task.style.display = 'block';
        } else {
            task.style.display = 'none';
        }
    });
}

setInterval(updateTaskStatus, 1000 * 60 * 60); // Actualizar el estado de las tareas cada hora
