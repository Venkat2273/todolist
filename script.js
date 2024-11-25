// Initial tasks data
let tasks = [
    { id: 1, title: 'Work out', time: '8:00 am', category: 'personal', completed: false },
    { id: 2, title: 'Design team meeting', time: '2:30 pm', category: 'work', completed: false },
    { id: 3, title: 'Hand off the project', time: '7:00 pm', category: 'freelance', completed: false },
    { id: 4, title: 'Read 5 pages of "sprint"', time: '10:30 pm', category: 'personal', completed: false }
];

// Scheduling system
let scheduledNotifications = new Map();

// DOM Elements
const taskList = document.getElementById('task-list');
const newTaskInput = document.getElementById('new-task');
const categorySelect = document.getElementById('task-category');
const navLinks = document.querySelectorAll('.nav-link');
const views = document.querySelectorAll('.view');
const addTaskBtn = document.querySelector('.add-button');

// Format date and time for comparison
function formatDateTime(timeStr) {
    const today = new Date();
    const [time, period] = timeStr.toLowerCase().split(' ');
    let [hours, minutes] = time.split(':');
    
    // Convert to 24-hour format
    hours = parseInt(hours);
    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    
    today.setHours(hours, parseInt(minutes), 0, 0);
    return today;
}

// Check scheduled tasks
function checkScheduledTasks() {
    const now = new Date();
    tasks.forEach(task => {
        if (task.completed) return;
        
        const scheduledTime = formatDateTime(task.time);
        const taskId = task.id.toString();
        
        // If we haven't scheduled this task yet and it's in the future
        if (!scheduledNotifications.has(taskId) && scheduledTime > now) {
            const timeUntilTask = scheduledTime.getTime() - now.getTime();
            
            // Schedule notification
            const timerId = setTimeout(() => {
                showTaskNotification(task);
                scheduledNotifications.delete(taskId);
            }, timeUntilTask);
            
            scheduledNotifications.set(taskId, timerId);
        }
    });
}

// Show notification for a task
function showTaskNotification(task) {
    // Check if browser supports notifications
    if (!("Notification" in window)) {
        alert(`Task Due: ${task.title}`);
        return;
    }

    // Request permission if needed
    if (Notification.permission !== "granted") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                createNotification(task);
            }
        });
    } else {
        createNotification(task);
    }
}

// Create notification
function createNotification(task) {
    const notification = new Notification("Task Due!", {
        body: task.title,
        icon: "/favicon.ico", // Add your favicon path
        tag: task.id
    });

    notification.onclick = function() {
        window.focus();
        // Optionally scroll to and highlight the task
        const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
        if (taskElement) {
            taskElement.scrollIntoView({ behavior: 'smooth' });
            taskElement.classList.add('highlight');
            setTimeout(() => taskElement.classList.remove('highlight'), 2000);
        }
    };
}

// Initialize the app
function init() {
    renderTasks();
    setupEventListeners();
    // Check for scheduled tasks every minute
    checkScheduledTasks();
    setInterval(checkScheduledTasks, 60000);
    
    // Request notification permission on init
    if ("Notification" in window) {
        Notification.requestPermission();
    }
}

// Render tasks based on current view
function renderTasks() {
    const currentView = document.querySelector('.nav-link.active').dataset.view;
    
    // Filter tasks based on current view
    let filteredTasks = tasks;
    if (currentView !== 'all') {
        filteredTasks = tasks.filter(task => task.category === currentView);
    }

    taskList.innerHTML = filteredTasks.map(task => `
        <div class="task-item" data-task-id="${task.id}">
            <div class="task-item-left">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                     onclick="toggleTask(${task.id})">
                    ${task.completed ? `
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="white">
                            <path d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    ` : ''}
                </div>
                <span class="bullet ${task.category}"></span>
                <span style="${task.completed ? 'text-decoration: line-through; color: #6b7280;' : ''}">${task.title}</span>
            </div>
            <div class="task-item-right">
                <span class="task-time">${task.time}</span>
                <button onclick="deleteTask(${task.id})" class="delete-button">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                </button>
            </div>
        </div>
    `).join('');

    // Update task counter if it exists
    const taskCounter = document.querySelector('.task-counter');
    if (taskCounter) {
        taskCounter.textContent = `${filteredTasks.length} tasks`;
    }
}

// Add new task
function addTask() {
    const title = newTaskInput.value.trim();
    if (!title) return;

    const category = categorySelect.value;
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    const newTask = {
        id: Date.now(),
        title,
        time,
        category,
        completed: false
    };

    tasks.push(newTask);
    newTaskInput.value = '';
    
    // If we're in a specific category view, only show tasks of that category
    const currentView = document.querySelector('.nav-link.active').dataset.view;
    if (currentView === 'all' || currentView === category) {
        renderTasks();
    }

    // Check for scheduling
    checkScheduledTasks();

    // Save to localStorage
    saveToLocalStorage();
}

// Delete task
function deleteTask(id) {
    const taskId = id.toString();
    if (scheduledNotifications.has(taskId)) {
        clearTimeout(scheduledNotifications.get(taskId));
        scheduledNotifications.delete(taskId);
    }
    tasks = tasks.filter(task => task.id !== id);
    renderTasks();
    saveToLocalStorage();
}

// Toggle task completion
function toggleTask(id) {
    const taskId = id.toString();
    tasks = tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
    );
    
    if (scheduledNotifications.has(taskId)) {
        clearTimeout(scheduledNotifications.get(taskId));
        scheduledNotifications.delete(taskId);
    }
    
    renderTasks();
    saveToLocalStorage();
}

// Filter tasks by category
function filterTasks(category) {
    const filteredTasks = category === 'all' 
        ? tasks 
        : tasks.filter(task => task.category === category);
    return filteredTasks;
}

// Save tasks to localStorage
function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Load tasks from localStorage
function loadFromLocalStorage() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        renderTasks();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = link.dataset.view;
            
            // Don't proceed if clicking settings
            if (view === 'settings') {
                showView('settings');
                return;
            }

            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show tasks view and render filtered tasks
            showView('tasks');
            renderTasks();
        });
    });

    // Add task on Enter
    newTaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    // Add task on button click
    addTaskBtn.addEventListener('click', addTask);

    // Category select change
    categorySelect.addEventListener('change', () => {
        const currentView = document.querySelector('.nav-link.active').dataset.view;
        if (currentView !== 'all' && currentView !== 'settings') {
            renderTasks();
        }
    });
}

// Show/hide views
function showView(viewId) {
    views.forEach(view => {
        if (view.id === `${viewId}-view`) {
            view.classList.remove('hidden');
        } else {
            view.classList.add('hidden');
        }
    });
}

// Add CSS for task highlighting
const style = document.createElement('style');
style.textContent = `
    .task-item.highlight {
        animation: highlight 2s ease-in-out;
    }
    
    @keyframes highlight {
        0% { background-color: rgba(59, 130, 246, 0.1); }
        50% { background-color: rgba(59, 130, 246, 0.2); }
        100% { background-color: transparent; }
    }
`;
document.head.appendChild(style);

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    init();
});