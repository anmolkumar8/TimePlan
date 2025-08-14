// TimePlan - Personalised AI Day Planner
// Main JavaScript file with intelligent scheduling and recommendations

// Global variables and state management
let tasks = JSON.parse(localStorage.getItem('timeplan-tasks') || '[]');
let goals = JSON.parse(localStorage.getItem('timeplan-goals') || '[]');
let settings = JSON.parse(localStorage.getItem('timeplan-settings') || JSON.stringify({
    workStart: '09:00',
    workEnd: '17:00',
    autoBreaks: true,
    breakDuration: 10,
    taskReminders: true,
    goalReminders: true
}));
let analytics = JSON.parse(localStorage.getItem('timeplan-analytics') || JSON.stringify({
    tasksCompleted: 0,
    productiveHours: 0,
    streakDays: 0,
    goalsAchieved: 0
}));

let currentSchedule = null;
let weeklyChart = null;
let categoriesChart = null;

// Task duration estimates for different types
const taskDurationEstimates = {
    'study': { min: 30, max: 120, default: 60 },
    'meeting': { min: 15, max: 180, default: 60 },
    'exercise': { min: 20, max: 90, default: 45 },
    'work': { min: 30, max: 240, default: 90 },
    'personal': { min: 15, max: 120, default: 30 },
    'creative': { min: 30, max: 180, default: 90 },
    'break': { min: 5, max: 30, default: 15 },
    'meal': { min: 20, max: 60, default: 30 }
};

// Productivity tips and recommendations database
const productivityTips = [
    "Use the Pomodoro Technique: Work for 25 minutes, then take a 5-minute break.",
    "Schedule your most important tasks during your peak energy hours.",
    "Batch similar tasks together to minimize context switching.",
    "Set specific, measurable goals for each task.",
    "Use time blocking to dedicate focused time to important work.",
    "Take regular breaks to maintain mental clarity and focus.",
    "Prioritize tasks using the Eisenhower Matrix: Urgent vs Important.",
    "Review and adjust your schedule regularly based on actual time spent."
];

const wellnessTips = [
    "Stay hydrated - drink water every hour.",
    "Take a 5-minute walk between tasks to refresh your mind.",
    "Practice deep breathing exercises during breaks.",
    "Ensure good posture and ergonomics at your workspace.",
    "Get natural light exposure, especially in the morning.",
    "Limit caffeine intake after 2 PM for better sleep quality.",
    "Do some light stretching every 2 hours.",
    "Take time for mindfulness or meditation during breaks."
];

const motivationQuotes = [
    "The key is not to prioritize what's on your schedule, but to schedule your priorities. - Stephen Covey",
    "Time is what we want most, but what we use worst. - William Penn",
    "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
    "The future depends on what you do today. - Mahatma Gandhi",
    "Time is more valuable than money. You can get more money, but you cannot get more time. - Jim Rohn",
    "Your limitation—it's only your imagination.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
    "The only way to do great work is to love what you do. - Steve Jobs"
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    setupThemeToggle();
    updateCurrentTime();
    loadTasks();
    loadGoals();
    updateAnalytics();
    generatePersonalizedTips();
    initializeCharts();
    
    // Update time every minute
    setInterval(updateCurrentTime, 60000);
    
    // Update tips every 5 minutes
    setInterval(generatePersonalizedTips, 300000);
    
    // Auto-save data every 30 seconds
    setInterval(saveAllData, 30000);
    
    // Setup smooth scrolling
    setupSmoothScrolling();
}

function setupEventListeners() {
    // Task management
    document.getElementById('add-task-btn').addEventListener('click', addTask);
    document.getElementById('task-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addTask();
        }
    });
    
    // Template buttons
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tasks = this.dataset.tasks.split(',');
            tasks.forEach(task => addTaskFromTemplate(task.trim()));
        });
    });
    
    // Schedule management
    document.getElementById('generate-schedule-btn').addEventListener('click', generateOptimizedSchedule);
    document.getElementById('clear-tasks-btn').addEventListener('click', clearAllTasks);
    document.getElementById('export-schedule-btn').addEventListener('click', exportSchedule);
    document.getElementById('schedule-type').addEventListener('change', handleScheduleTypeChange);
    
    // Goal management
    document.getElementById('add-goal-btn').addEventListener('click', addGoal);
    document.getElementById('goal-title').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addGoal();
        }
    });
    
    // Settings modal
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.querySelector('.user-profile').addEventListener('click', openSettingsModal);
    
    // Get started button
    document.getElementById('get-started-btn').addEventListener('click', function() {
        document.querySelector('#daily-planner').scrollIntoView({ behavior: 'smooth' });
    });
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('timeplan-theme') || 'light';
    
    // Set initial theme
    if (currentTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.body.getAttribute('data-theme');
        
        if (currentTheme === 'dark') {
            document.body.removeAttribute('data-theme');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('timeplan-theme', 'light');
        } else {
            document.body.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('timeplan-theme', 'dark');
        }
    });
}

function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    document.getElementById('current-time').textContent = timeString;
}

// Task Management Functions
function addTask() {
    const taskInput = document.getElementById('task-input');
    const priority = document.getElementById('task-priority').value;
    const durationInput = document.getElementById('task-duration');
    
    const taskText = taskInput.value.trim();
    if (!taskText) {
        showNotification('Please enter a task description', 'error');
        return;
    }
    
    const duration = parseInt(durationInput.value) || estimateTaskDuration(taskText);
    const taskCategory = categorizeTask(taskText);
    
    const task = {
        id: Date.now(),
        title: taskText,
        priority: priority,
        duration: duration,
        category: taskCategory,
        completed: false,
        createdAt: new Date().toISOString(),
        estimatedStart: null,
        estimatedEnd: null
    };
    
    tasks.unshift(task);
    saveData();
    loadTasks();
    
    // Clear inputs
    taskInput.value = '';
    durationInput.value = '';
    
    showNotification(`Task "${task.title}" added successfully!`, 'success');
    
    // Auto-generate schedule if there are enough tasks
    if (tasks.filter(t => !t.completed).length >= 3) {
        setTimeout(() => {
            if (confirm('Would you like me to generate an optimized schedule for your tasks?')) {
                generateOptimizedSchedule();
            }
        }, 1000);
    }
}

function addTaskFromTemplate(taskTitle) {
    const duration = estimateTaskDuration(taskTitle);
    const taskCategory = categorizeTask(taskTitle);
    const priority = getPriorityFromCategory(taskCategory);
    
    const task = {
        id: Date.now() + Math.random(),
        title: taskTitle,
        priority: priority,
        duration: duration,
        category: taskCategory,
        completed: false,
        createdAt: new Date().toISOString(),
        estimatedStart: null,
        estimatedEnd: null
    };
    
    tasks.unshift(task);
    saveData();
    loadTasks();
}

function estimateTaskDuration(taskText) {
    const text = taskText.toLowerCase();
    
    // Check for explicit duration mentions
    const durationMatch = text.match(/(\d+)\s*(min|minutes|hour|hours|hr|h)/);
    if (durationMatch) {
        const value = parseInt(durationMatch[1]);
        const unit = durationMatch[2];
        return unit.includes('h') ? value * 60 : value;
    }
    
    // Estimate based on keywords
    for (const [category, durations] of Object.entries(taskDurationEstimates)) {
        if (text.includes(category)) {
            return durations.default;
        }
    }
    
    // Category-based estimation
    if (text.match(/(study|learn|read|research)/)) return 60;
    if (text.match(/(exercise|gym|workout|run)/)) return 45;
    if (text.match(/(meeting|call|presentation)/)) return 60;
    if (text.match(/(email|message|quick)/)) return 15;
    if (text.match(/(project|develop|build|create)/)) return 120;
    if (text.match(/(break|rest|lunch|dinner|eat)/)) return 30;
    
    // Default estimation based on task length
    const wordCount = taskText.split(' ').length;
    if (wordCount <= 3) return 30;
    if (wordCount <= 6) return 60;
    return 90;
}

function categorizeTask(taskText) {
    const text = taskText.toLowerCase();
    
    if (text.match(/(study|learn|read|research|exam|homework|assignment)/)) return 'study';
    if (text.match(/(meeting|call|presentation|interview|discussion)/)) return 'meeting';
    if (text.match(/(exercise|gym|workout|run|walk|yoga|sport)/)) return 'exercise';
    if (text.match(/(work|project|develop|build|code|design|analyze)/)) return 'work';
    if (text.match(/(shopping|cleaning|laundry|errands|personal|appointment)/)) return 'personal';
    if (text.match(/(write|create|art|music|draw|paint|creative)/)) return 'creative';
    if (text.match(/(break|rest|relax|meditation|downtime)/)) return 'break';
    if (text.match(/(lunch|dinner|breakfast|eat|meal|cook)/)) return 'meal';
    
    return 'work'; // Default category
}

function getPriorityFromCategory(category) {
    const highPriorityCategories = ['work', 'meeting', 'study'];
    const lowPriorityCategories = ['break', 'personal'];
    
    if (highPriorityCategories.includes(category)) return 'high';
    if (lowPriorityCategories.includes(category)) return 'low';
    return 'medium';
}

function loadTasks() {
    const tasksList = document.getElementById('tasks-list');
    const incompleteTasks = tasks.filter(task => !task.completed);
    
    if (incompleteTasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>No tasks added yet. Start by adding your first task above!</p>
            </div>
        `;
        return;
    }
    
    tasksList.innerHTML = incompleteTasks.map(task => `
        <div class="task-item" data-task-id="${task.id}">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                   onchange="toggleTask(${task.id})">
            <div class="task-content">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="task-meta">
                    <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                    <span><i class="fas fa-clock"></i> ${task.duration}min</span>
                    <span><i class="fas fa-tag"></i> ${task.category}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-action-btn edit" onclick="editTask(${task.id})" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-action-btn delete" onclick="deleteTask(${task.id})" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        if (task.completed) {
            analytics.tasksCompleted++;
            analytics.productiveHours += task.duration / 60;
            showNotification(`Great! Task "${task.title}" completed!`, 'success');
        }
        saveData();
        loadTasks();
        updateAnalytics();
    }
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const newTitle = prompt('Edit task:', task.title);
        if (newTitle && newTitle.trim()) {
            task.title = newTitle.trim();
            task.duration = estimateTaskDuration(newTitle);
            task.category = categorizeTask(newTitle);
            saveData();
            loadTasks();
            showNotification('Task updated successfully!', 'success');
        }
    }
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveData();
        loadTasks();
        showNotification('Task deleted successfully!', 'success');
    }
}

function clearAllTasks() {
    if (confirm('Are you sure you want to clear all tasks? This action cannot be undone.')) {
        tasks = tasks.filter(t => t.completed);
        saveData();
        loadTasks();
        document.getElementById('schedule-section').style.display = 'none';
        showNotification('All incomplete tasks cleared!', 'success');
    }
}

// AI-Powered Schedule Generation
function generateOptimizedSchedule() {
    const incompleteTasks = tasks.filter(task => !task.completed);
    
    if (incompleteTasks.length === 0) {
        showNotification('No tasks to schedule!', 'error');
        return;
    }
    
    const scheduleType = document.getElementById('schedule-type').value;
    let schedule;
    
    switch (scheduleType) {
        case 'daily':
            schedule = generateDailySchedule(incompleteTasks);
            break;
        case 'weekly':
            schedule = generateWeeklySchedule(incompleteTasks);
            break;
        case 'monthly':
            schedule = generateMonthlySchedule(incompleteTasks);
            break;
        default:
            schedule = generateDailySchedule(incompleteTasks);
    }
    
    currentSchedule = schedule;
    displaySchedule(schedule, scheduleType);
    document.getElementById('schedule-section').style.display = 'block';
    
    showNotification(`${scheduleType.charAt(0).toUpperCase() + scheduleType.slice(1)} schedule generated!`, 'success');
}

function generateDailySchedule(tasks) {
    const schedule = {
        type: 'daily',
        date: new Date(),
        slots: []
    };
    
    // Sort tasks by priority and estimated duration
    const sortedTasks = [...tasks].sort((a, b) => {
        const priorityScore = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityScore[b.priority] - priorityScore[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.duration - b.duration; // Shorter tasks first for same priority
    });
    
    const workStart = parseTimeString(settings.workStart);
    const workEnd = parseTimeString(settings.workEnd);
    let currentTime = workStart;
    
    for (const task of sortedTasks) {
        const taskEndTime = addMinutes(currentTime, task.duration);
        
        // Check if task fits in work day
        if (taskEndTime > workEnd) {
            // Move to next available time or suggest overtime
            if (currentTime < workEnd) {
                schedule.slots.push({
                    time: formatTime(currentTime),
                    endTime: formatTime(workEnd),
                    task: '⚠️ Partial: ' + task.title,
                    duration: getTimeDifference(currentTime, workEnd),
                    type: 'partial',
                    originalTask: task
                });
            }
            break;
        }
        
        schedule.slots.push({
            time: formatTime(currentTime),
            endTime: formatTime(taskEndTime),
            task: task.title,
            duration: task.duration,
            priority: task.priority,
            category: task.category,
            taskId: task.id
        });
        
        currentTime = taskEndTime;
        
        // Add break if enabled and not the last task
        if (settings.autoBreaks && sortedTasks.indexOf(task) < sortedTasks.length - 1) {
            const breakEndTime = addMinutes(currentTime, settings.breakDuration);
            if (breakEndTime <= workEnd) {
                schedule.slots.push({
                    time: formatTime(currentTime),
                    endTime: formatTime(breakEndTime),
                    task: `☕ Break (${settings.breakDuration} min)`,
                    duration: settings.breakDuration,
                    type: 'break'
                });
                currentTime = breakEndTime;
            }
        }
    }
    
    // Add productivity insights
    schedule.insights = generateScheduleInsights(schedule.slots, tasks);
    
    return schedule;
}

function generateWeeklySchedule(tasks) {
    const schedule = {
        type: 'weekly',
        startDate: getStartOfWeek(new Date()),
        days: []
    };
    
    const dailyWorkingMinutes = getTimeDifference(parseTimeString(settings.workStart), parseTimeString(settings.workEnd));
    const totalTaskDuration = tasks.reduce((sum, task) => sum + task.duration, 0);
    const tasksPerDay = Math.ceil(tasks.length / 5); // Distribute over weekdays
    
    // Group tasks by priority and category
    const taskGroups = groupTasksIntelligently(tasks);
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = new Date(schedule.startDate);
        date.setDate(date.getDate() + dayOffset);
        
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const isWeekend = dayOffset >= 5;
        
        if (isWeekend) {
            // Weekend planning - lighter schedule
            const weekendTasks = taskGroups.personal.slice(0, 2).concat(taskGroups.lowPriority.slice(0, 1));
            schedule.days.push({
                date: date,
                dayName: dayName,
                slots: generateDaySlots(weekendTasks, isWeekend),
                isWeekend: true
            });
        } else {
            // Weekday planning
            const weekdayTasks = getTasksForWeekday(taskGroups, dayOffset);
            schedule.days.push({
                date: date,
                dayName: dayName,
                slots: generateDaySlots(weekdayTasks, isWeekend),
                isWeekend: false
            });
        }
    }
    
    return schedule;
}

function generateMonthlySchedule(tasks) {
    const schedule = {
        type: 'monthly',
        startDate: new Date(),
        weeks: []
    };
    
    // Create monthly milestones and distribute tasks
    const monthlyGoals = tasks.filter(task => task.duration > 120); // Long-term tasks
    const dailyTasks = tasks.filter(task => task.duration <= 120);
    
    for (let week = 0; week < 4; week++) {
        const weekStart = new Date(schedule.startDate);
        weekStart.setDate(weekStart.getDate() + (week * 7));
        
        schedule.weeks.push({
            weekNumber: week + 1,
            startDate: weekStart,
            focus: getWeeklyFocus(tasks, week),
            tasks: distributeTasksForWeek(tasks, week),
            milestones: getWeeklyMilestones(monthlyGoals, week)
        });
    }
    
    return schedule;
}

function groupTasksIntelligently(tasks) {
    return {
        highPriority: tasks.filter(t => t.priority === 'high'),
        mediumPriority: tasks.filter(t => t.priority === 'medium'),
        lowPriority: tasks.filter(t => t.priority === 'low'),
        work: tasks.filter(t => ['work', 'meeting', 'study'].includes(t.category)),
        personal: tasks.filter(t => ['personal', 'exercise', 'break'].includes(t.category)),
        creative: tasks.filter(t => t.category === 'creative'),
        shortTasks: tasks.filter(t => t.duration <= 30),
        longTasks: tasks.filter(t => t.duration > 90)
    };
}

function getTasksForWeekday(taskGroups, dayOffset) {
    // Intelligent task distribution based on day of week
    switch (dayOffset) {
        case 0: // Monday - High energy, tackle difficult tasks
            return taskGroups.highPriority.slice(0, 2).concat(taskGroups.work.slice(0, 2));
        case 1: // Tuesday - Peak productivity
            return taskGroups.longTasks.slice(0, 1).concat(taskGroups.mediumPriority.slice(0, 3));
        case 2: // Wednesday - Mid-week balance
            return taskGroups.creative.slice(0, 1).concat(taskGroups.shortTasks.slice(0, 3));
        case 3: // Thursday - Preparation day
            return taskGroups.work.slice(2, 4).concat(taskGroups.mediumPriority.slice(3, 5));
        case 4: // Friday - Wrap up and planning
            return taskGroups.shortTasks.slice(3, 6).concat(taskGroups.lowPriority.slice(0, 2));
        default:
            return taskGroups.mediumPriority.slice(0, 3);
    }
}

function generateDaySlots(dayTasks, isWeekend = false) {
    const slots = [];
    const startTime = isWeekend ? parseTimeString('10:00') : parseTimeString(settings.workStart);
    const endTime = isWeekend ? parseTimeString('16:00') : parseTimeString(settings.workEnd);
    
    let currentTime = startTime;
    
    for (const task of dayTasks) {
        const taskEndTime = addMinutes(currentTime, task.duration);
        
        if (taskEndTime > endTime) break;
        
        slots.push({
            time: formatTime(currentTime),
            endTime: formatTime(taskEndTime),
            task: task.title,
            duration: task.duration,
            priority: task.priority,
            category: task.category
        });
        
        currentTime = taskEndTime;
        
        // Add break
        if (settings.autoBreaks) {
            const breakEndTime = addMinutes(currentTime, settings.breakDuration);
            if (breakEndTime <= endTime) {
                slots.push({
                    time: formatTime(currentTime),
                    endTime: formatTime(breakEndTime),
                    task: `☕ Break`,
                    duration: settings.breakDuration,
                    type: 'break'
                });
                currentTime = breakEndTime;
            }
        }
    }
    
    return slots;
}

function displaySchedule(schedule, scheduleType) {
    const scheduleDisplay = document.getElementById('schedule-display');
    
    switch (scheduleType) {
        case 'daily':
            displayDailySchedule(schedule, scheduleDisplay);
            break;
        case 'weekly':
            displayWeeklySchedule(schedule, scheduleDisplay);
            break;
        case 'monthly':
            displayMonthlySchedule(schedule, scheduleDisplay);
            break;
    }
}

function displayDailySchedule(schedule, container) {
    const today = schedule.date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    let html = `
        <div class="schedule-day">
            <div class="schedule-day-header">📅 ${today}</div>
            <div class="schedule-slots">
    `;
    
    if (schedule.slots.length === 0) {
        html += '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No tasks scheduled for today.</p>';
    } else {
        schedule.slots.forEach(slot => {
            const priorityIcon = slot.priority === 'high' ? '🔴' : slot.priority === 'medium' ? '🟡' : '🟢';
            const typeClass = slot.type === 'break' ? 'break' : slot.type === 'partial' ? 'partial' : 'task';
            
            html += `
                <div class="schedule-slot ${typeClass}">
                    <div class="slot-time">${slot.time} - ${slot.endTime}</div>
                    <div class="slot-task">${slot.type !== 'break' ? priorityIcon : ''} ${slot.task}</div>
                    <div class="slot-duration">${slot.duration}min</div>
                </div>
            `;
        });
    }
    
    html += '</div></div>';
    
    // Add insights if available
    if (schedule.insights) {
        html += `
            <div class="schedule-insights">
                <h4>📊 Schedule Insights</h4>
                <div class="insights-list">
                    ${schedule.insights.map(insight => `<p>💡 ${insight}</p>`).join('')}
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function displayWeeklySchedule(schedule, container) {
    let html = '<div class="weekly-schedule">';
    
    schedule.days.forEach(day => {
        const dateStr = day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        html += `
            <div class="schedule-day ${day.isWeekend ? 'weekend' : 'weekday'}">
                <div class="schedule-day-header">
                    ${day.dayName} - ${dateStr}
                    ${day.isWeekend ? '🏖️' : '💼'}
                </div>
                <div class="schedule-slots">
        `;
        
        if (day.slots.length === 0) {
            html += '<p style="color: var(--text-secondary); font-style: italic;">Rest day</p>';
        } else {
            day.slots.forEach(slot => {
                const priorityIcon = slot.priority === 'high' ? '🔴' : slot.priority === 'medium' ? '🟡' : '🟢';
                
                html += `
                    <div class="schedule-slot mini">
                        <div class="slot-time">${slot.time}</div>
                        <div class="slot-task">${slot.type !== 'break' ? priorityIcon : ''} ${slot.task}</div>
                    </div>
                `;
            });
        }
        
        html += '</div></div>';
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function displayMonthlySchedule(schedule, container) {
    let html = '<div class="monthly-schedule">';
    
    schedule.weeks.forEach(week => {
        html += `
            <div class="monthly-week">
                <div class="week-header">
                    <h4>Week ${week.weekNumber} - Focus: ${week.focus}</h4>
                    <span class="week-date">${week.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <div class="week-content">
                    <div class="week-tasks">
                        <h5>📋 Tasks This Week</h5>
                        ${week.tasks.map(task => `
                            <div class="monthly-task">
                                <span class="task-priority priority-${task.priority}"></span>
                                ${task.title}
                            </div>
                        `).join('')}
                    </div>
                    <div class="week-milestones">
                        <h5>🎯 Milestones</h5>
                        ${week.milestones.map(milestone => `
                            <div class="milestone">🏆 ${milestone}</div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function generateScheduleInsights(slots, allTasks) {
    const insights = [];
    const totalScheduledTime = slots.reduce((sum, slot) => sum + slot.duration, 0);
    const workSlots = slots.filter(slot => slot.type !== 'break');
    const breakTime = slots.filter(slot => slot.type === 'break').reduce((sum, slot) => sum + slot.duration, 0);
    
    // Time utilization insight
    const utilizationRate = (totalScheduledTime / (8 * 60)) * 100;
    if (utilizationRate > 90) {
        insights.push('Your schedule is quite packed. Consider adding more buffer time between tasks.');
    } else if (utilizationRate < 60) {
        insights.push('You have good flexibility in your schedule. Consider adding some stretch goals.');
    } else {
        insights.push('Your schedule has a good balance of tasks and flexibility.');
    }
    
    // Priority distribution insight
    const highPriorityTasks = workSlots.filter(slot => slot.priority === 'high').length;
    const totalTasks = workSlots.filter(slot => slot.type !== 'break').length;
    
    if (highPriorityTasks / totalTasks > 0.6) {
        insights.push('Most of your tasks are high priority. Consider if some can be delegated or rescheduled.');
    }
    
    // Break time insight
    if (breakTime < 60 && workSlots.length > 4) {
        insights.push('Consider adding more breaks to maintain focus and productivity.');
    }
    
    // Task variety insight
    const categories = [...new Set(workSlots.map(slot => slot.category))];
    if (categories.length > 4) {
        insights.push('You have diverse tasks today. Try to group similar activities together.');
    }
    
    return insights;
}

// Goal Management Functions
function addGoal() {
    const titleInput = document.getElementById('goal-title');
    const deadlineInput = document.getElementById('goal-deadline');
    const categoryInput = document.getElementById('goal-category');
    
    const title = titleInput.value.trim();
    const deadline = deadlineInput.value;
    const category = categoryInput.value;
    
    if (!title) {
        showNotification('Please enter a goal title', 'error');
        return;
    }
    
    if (!deadline) {
        showNotification('Please select a deadline', 'error');
        return;
    }
    
    const goal = {
        id: Date.now(),
        title: title,
        category: category,
        deadline: deadline,
        progress: 0,
        completed: false,
        createdAt: new Date().toISOString(),
        milestones: generateGoalMilestones(title, deadline)
    };
    
    goals.unshift(goal);
    saveData();
    loadGoals();
    
    // Clear inputs
    titleInput.value = '';
    deadlineInput.value = '';
    
    showNotification(`Goal "${goal.title}" added successfully!`, 'success');
    generateGoalRecommendations(goal);
}

function generateGoalMilestones(title, deadline) {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysDiff = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
    
    const milestones = [];
    
    if (daysDiff > 30) {
        // Monthly milestones for long-term goals
        const monthsToDeadline = Math.ceil(daysDiff / 30);
        for (let i = 1; i <= Math.min(monthsToDeadline, 6); i++) {
            milestones.push({
                title: `Month ${i} checkpoint`,
                targetDate: new Date(now.getTime() + (i * 30 * 24 * 60 * 60 * 1000)),
                completed: false
            });
        }
    } else if (daysDiff > 7) {
        // Weekly milestones for medium-term goals
        const weeksToDeadline = Math.ceil(daysDiff / 7);
        for (let i = 1; i <= weeksToDeadline; i++) {
            milestones.push({
                title: `Week ${i} progress review`,
                targetDate: new Date(now.getTime() + (i * 7 * 24 * 60 * 60 * 1000)),
                completed: false
            });
        }
    } else {
        // Daily milestones for short-term goals
        for (let i = 1; i <= Math.max(daysDiff, 1); i++) {
            milestones.push({
                title: `Day ${i} target`,
                targetDate: new Date(now.getTime() + (i * 24 * 60 * 60 * 1000)),
                completed: false
            });
        }
    }
    
    return milestones;
}

function generateGoalRecommendations(goal) {
    const recommendations = [];
    const category = goal.category;
    const deadlineDate = new Date(goal.deadline);
    const daysToDeadline = Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24));
    
    // Category-specific recommendations
    switch (category) {
        case 'learning':
            recommendations.push('Break down your learning goal into daily study sessions');
            recommendations.push('Create a practice schedule with regular reviews');
            recommendations.push('Find online courses or resources to support your learning');
            break;
        case 'fitness':
            recommendations.push('Start with small, achievable daily exercises');
            recommendations.push('Track your progress with measurements or photos');
            recommendations.push('Find a workout buddy or join a fitness community');
            break;
        case 'career':
            recommendations.push('Update your skills regularly with online courses');
            recommendations.push('Network with professionals in your field');
            recommendations.push('Set monthly career development check-ins');
            break;
    }
    
    // Time-based recommendations
    if (daysToDeadline > 90) {
        recommendations.push('This is a long-term goal. Break it into quarterly milestones');
    } else if (daysToDeadline > 30) {
        recommendations.push('Create weekly action plans to stay on track');
    } else {
        recommendations.push('Focus on daily actions to achieve this goal quickly');
    }
    
    setTimeout(() => {
        const aiInsight = document.getElementById('ai-insight');
        aiInsight.innerHTML = `
            <p><strong>Goal Recommendations for "${goal.title}":</strong></p>
            <ul style="text-align: left; margin-top: 1rem;">
                ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        `;
    }, 2000);
}

function loadGoals() {
    const goalsList = document.getElementById('goals-list');
    
    if (goals.length === 0) {
        goalsList.innerHTML = `
            <div class="empty-goals-state">
                <i class="fas fa-bullseye"></i>
                <p>No goals set yet. Add your first goal to get a personalized plan!</p>
            </div>
        `;
        return;
    }
    
    goalsList.innerHTML = goals.map(goal => {
        const deadlineDate = new Date(goal.deadline);
        const now = new Date();
        const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
        const isOverdue = daysLeft < 0;
        
        return `
            <div class="goal-card" data-goal-id="${goal.id}">
                <div class="goal-header">
                    <div>
                        <div class="goal-title">${escapeHtml(goal.title)}</div>
                        <div class="goal-category">${goal.category}</div>
                    </div>
                </div>
                <div class="goal-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${goal.progress}%"></div>
                    </div>
                    <div class="progress-text">${goal.progress}% complete</div>
                </div>
                <div class="goal-deadline ${isOverdue ? 'overdue' : ''}">
                    📅 ${deadlineDate.toLocaleDateString('en-US')}
                    ${isOverdue ? 
                        `<span style="color: var(--error-color);">(${Math.abs(daysLeft)} days overdue)</span>` : 
                        `<span>(${daysLeft} days left)</span>`
                    }
                </div>
                <div class="goal-actions" style="margin-top: 1rem;">
                    <button onclick="updateGoalProgress(${goal.id})" class="action-btn primary" style="font-size: 0.8rem; padding: 0.5rem 1rem;">
                        Update Progress
                    </button>
                    <button onclick="deleteGoal(${goal.id})" class="action-btn secondary" style="font-size: 0.8rem; padding: 0.5rem 1rem;">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function updateGoalProgress(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
        const newProgress = prompt(`Update progress for "${goal.title}" (0-100):`, goal.progress);
        if (newProgress !== null) {
            const progress = Math.max(0, Math.min(100, parseInt(newProgress) || 0));
            goal.progress = progress;
            
            if (progress === 100) {
                goal.completed = true;
                analytics.goalsAchieved++;
                showNotification(`🎉 Congratulations! Goal "${goal.title}" completed!`, 'success');
            }
            
            saveData();
            loadGoals();
            updateAnalytics();
        }
    }
}

function deleteGoal(goalId) {
    if (confirm('Are you sure you want to delete this goal?')) {
        goals = goals.filter(g => g.id !== goalId);
        saveData();
        loadGoals();
        showNotification('Goal deleted successfully!', 'success');
    }
}

// Analytics and Statistics
function updateAnalytics() {
    const today = new Date().toDateString();
    const todayTasks = tasks.filter(task => 
        new Date(task.createdAt).toDateString() === today
    );
    const completedToday = todayTasks.filter(task => task.completed).length;
    
    // Update streak (simplified logic)
    if (completedToday > 0) {
        analytics.streakDays = Math.max(analytics.streakDays, 1);
    }
    
    document.getElementById('tasks-completed').textContent = completedToday;
    document.getElementById('productive-hours').textContent = `${analytics.productiveHours.toFixed(1)}h`;
    document.getElementById('streak-days').textContent = analytics.streakDays;
    document.getElementById('goals-achieved').textContent = analytics.goalsAchieved;
    
    updateCharts();
}

function initializeCharts() {
    const ctx1 = document.getElementById('weekly-progress-chart');
    const ctx2 = document.getElementById('categories-chart');
    
    if (ctx1) {
        weeklyChart = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Tasks Completed',
                    data: [2, 4, 3, 5, 4, 2, 1],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
    
    if (ctx2) {
        const categoryData = calculateCategoryData();
        categoriesChart = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Work', 'Personal', 'Study', 'Exercise', 'Creative'],
                datasets: [{
                    data: categoryData,
                    backgroundColor: [
                        '#6366f1',
                        '#06b6d4',
                        '#f59e0b',
                        '#10b981',
                        '#8b5cf6'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

function updateCharts() {
    if (weeklyChart) {
        // Update with real data
        const weekData = calculateWeeklyData();
        weeklyChart.data.datasets[0].data = weekData;
        weeklyChart.update();
    }
    
    if (categoriesChart) {
        const categoryData = calculateCategoryData();
        categoriesChart.data.datasets[0].data = categoryData;
        categoriesChart.update();
    }
}

function calculateWeeklyData() {
    // Generate sample weekly data based on completed tasks
    const completedTasks = tasks.filter(task => task.completed);
    const weekData = [0, 0, 0, 0, 0, 0, 0];
    
    completedTasks.forEach(task => {
        const day = new Date(task.createdAt).getDay();
        weekData[day === 0 ? 6 : day - 1]++; // Adjust Sunday to be last
    });
    
    return weekData;
}

function calculateCategoryData() {
    const categories = {
        work: tasks.filter(t => ['work', 'meeting'].includes(t.category)).length,
        personal: tasks.filter(t => t.category === 'personal').length,
        study: tasks.filter(t => t.category === 'study').length,
        exercise: tasks.filter(t => t.category === 'exercise').length,
        creative: tasks.filter(t => t.category === 'creative').length
    };
    
    return Object.values(categories);
}

// Tips and Recommendations
function generatePersonalizedTips() {
    const completedTasks = tasks.filter(task => task.completed);
    const recentTasks = tasks.slice(0, 10);
    
    // Generate AI insight based on user behavior
    const aiInsight = generateAIInsight(completedTasks, recentTasks);
    document.getElementById('ai-insight').innerHTML = `<p>${aiInsight}</p>`;
    
    // Random productivity tip
    const randomProductivityTip = productivityTips[Math.floor(Math.random() * productivityTips.length)];
    document.getElementById('productivity-tip').innerHTML = `<p>${randomProductivityTip}</p>`;
    
    // Random wellness tip
    const randomWellnessTip = wellnessTips[Math.floor(Math.random() * wellnessTips.length)];
    document.getElementById('wellness-tip').innerHTML = `<p>${randomWellnessTip}</p>`;
    
    // Random motivation quote
    const randomQuote = motivationQuotes[Math.floor(Math.random() * motivationQuotes.length)];
    document.getElementById('motivation-quote').innerHTML = `<p><em>${randomQuote}</em></p>`;
}

function generateAIInsight(completedTasks, recentTasks) {
    const insights = [];
    
    if (completedTasks.length === 0) {
        return "Start by completing a few tasks to receive personalized insights about your productivity patterns.";
    }
    
    // Analyze completion rate
    const completionRate = (completedTasks.length / tasks.length) * 100;
    if (completionRate > 80) {
        insights.push("Excellent! You have a very high task completion rate. Consider setting more challenging goals.");
    } else if (completionRate > 60) {
        insights.push("Good progress! You're completing most of your tasks. Try to identify what's preventing 100% completion.");
    } else {
        insights.push("Your completion rate could be improved. Consider breaking down larger tasks into smaller, manageable pieces.");
    }
    
    // Analyze task categories
    const categories = recentTasks.reduce((acc, task) => {
        acc[task.category] = (acc[task.category] || 0) + 1;
        return acc;
    }, {});
    
    const dominantCategory = Object.keys(categories).reduce((a, b) => 
        categories[a] > categories[b] ? a : b
    );
    
    insights.push(`You seem to focus heavily on ${dominantCategory} tasks. Consider adding variety to maintain engagement.`);
    
    // Time-based insights
    const avgDuration = recentTasks.reduce((sum, task) => sum + task.duration, 0) / recentTasks.length;
    if (avgDuration > 90) {
        insights.push("Your tasks tend to be quite long. Try the time-blocking technique with focused 25-50 minute sessions.");
    } else if (avgDuration < 30) {
        insights.push("You prefer shorter tasks. Consider batching similar quick tasks together for better efficiency.");
    }
    
    return insights[Math.floor(Math.random() * insights.length)];
}

// Settings and Preferences
function openSettingsModal() {
    document.getElementById('settings-modal').style.display = 'block';
    
    // Load current settings
    document.getElementById('work-start').value = settings.workStart;
    document.getElementById('work-end').value = settings.workEnd;
    document.getElementById('auto-breaks').checked = settings.autoBreaks;
    document.getElementById('break-duration').value = settings.breakDuration;
    document.getElementById('task-reminders').checked = settings.taskReminders;
    document.getElementById('goal-reminders').checked = settings.goalReminders;
}

function closeModal() {
    document.getElementById('settings-modal').style.display = 'none';
}

function saveSettings() {
    settings.workStart = document.getElementById('work-start').value;
    settings.workEnd = document.getElementById('work-end').value;
    settings.autoBreaks = document.getElementById('auto-breaks').checked;
    settings.breakDuration = parseInt(document.getElementById('break-duration').value);
    settings.taskReminders = document.getElementById('task-reminders').checked;
    settings.goalReminders = document.getElementById('goal-reminders').checked;
    
    localStorage.setItem('timeplan-settings', JSON.stringify(settings));
    closeModal();
    showNotification('Settings saved successfully!', 'success');
}

// Utility Functions
function parseTimeString(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
}

function getTimeDifference(startTime, endTime) {
    return Math.floor((endTime - startTime) / 60000); // Return difference in minutes
}

function getStartOfWeek(date) {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);
    return startOfWeek;
}

function getWeeklyFocus(tasks, weekNumber) {
    const focuses = ['Foundation Building', 'Momentum Growth', 'Skill Development', 'Goal Achievement'];
    return focuses[weekNumber] || 'Progress Consolidation';
}

function distributeTasksForWeek(tasks, weekNumber) {
    const tasksPerWeek = Math.ceil(tasks.length / 4);
    const startIndex = weekNumber * tasksPerWeek;
    return tasks.slice(startIndex, startIndex + tasksPerWeek);
}

function getWeeklyMilestones(goals, weekNumber) {
    const milestones = [
        'Complete initial research and planning',
        'Establish consistent daily routines',
        'Review progress and adjust strategies',
        'Finalize and celebrate achievements'
    ];
    return [milestones[weekNumber] || 'Continue steady progress'];
}

function handleScheduleTypeChange() {
    if (currentSchedule) {
        generateOptimizedSchedule();
    }
}

function exportSchedule() {
    if (!currentSchedule) {
        showNotification('No schedule to export!', 'error');
        return;
    }
    
    const scheduleText = formatScheduleForExport(currentSchedule);
    const blob = new Blob([scheduleText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `timeplan-schedule-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('Schedule exported successfully!', 'success');
}

function formatScheduleForExport(schedule) {
    let text = `TimePlan Schedule Export\n`;
    text += `Generated on: ${new Date().toLocaleString()}\n`;
    text += `Schedule Type: ${schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)}\n\n`;
    
    if (schedule.type === 'daily') {
        text += `Date: ${schedule.date.toLocaleDateString()}\n\n`;
        schedule.slots.forEach(slot => {
            text += `${slot.time} - ${slot.endTime}: ${slot.task} (${slot.duration}min)\n`;
        });
    } else if (schedule.type === 'weekly') {
        schedule.days.forEach(day => {
            text += `\n${day.dayName} - ${day.date.toLocaleDateString()}\n`;
            text += '='.repeat(40) + '\n';
            day.slots.forEach(slot => {
                text += `${slot.time}: ${slot.task} (${slot.duration}min)\n`;
            });
        });
    }
    
    return text;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function saveData() {
    localStorage.setItem('timeplan-tasks', JSON.stringify(tasks));
    localStorage.setItem('timeplan-goals', JSON.stringify(goals));
    localStorage.setItem('timeplan-analytics', JSON.stringify(analytics));
}

function saveAllData() {
    saveData();
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Hide notification
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Initialize analytics update on page visibility change
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        updateAnalytics();
        generatePersonalizedTips();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'Enter':
                e.preventDefault();
                if (document.getElementById('task-input') === document.activeElement) {
                    addTask();
                }
                break;
            case 's':
                e.preventDefault();
                if (tasks.filter(t => !t.completed).length > 0) {
                    generateOptimizedSchedule();
                }
                break;
        }
    }
});

console.log('TimePlan initialized successfully! 🚀');
