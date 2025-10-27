// StreamElements Task List Widget with Help Command
// Converted from original by Jujoco_Dev

// Global variables
let userTasks = {};
let userNames = {}; // Store actual usernames mapped to userIds
let clockInterval = null;
let fieldData = {};

// Local storage key for task persistence
const LOCAL_STORAGE_KEY = 'twitch_task_list_overlay_data';

// Storage functions for task persistence
function saveTasksToLocalStorage() {
  try {
    const dataToSave = {
      userTasks: userTasks,
      userNames: userNames,
      timestamp: Date.now()
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Error saving tasks to local storage:', error);
  }
}

function loadTasksFromLocalStorage() {
  try {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      if (parsedData.userTasks) {
        userTasks = parsedData.userTasks;
        userNames = parsedData.userNames || {};
        console.log(`Tasks loaded from local storage: ${Object.keys(userTasks).length} users`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error loading tasks from local storage:', error);
    return false;
  }
}

// Username storage functions
async function saveUserName(userId, username) {
  try {
    userNames[userId] = username;
    await SE_API.store.set('userNames', userNames);
    console.log(`Saved username ${username} for user ${userId}`);
  } catch (error) {
    console.error('Error saving username:', error);
  }
}

async function loadAllUserNames() {
  try {
    const savedUserNames = await SE_API.store.get('userNames');
    if (savedUserNames) {
      userNames = savedUserNames;
      console.log(`Loaded ${Object.keys(userNames).length} usernames from SE_API.store`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error loading usernames from SE_API.store:', error);
    return false;
  }
}

// Centralized function to load all users' tasks from SE_API.store
async function loadAllUsersTasksFromStore() {
  try {
    console.log('Loading all users tasks from SE_API.store...');
    
    // First, try to get the list of all user IDs who have tasks
    const userTasksIndex = await SE_API.store.get('userTasksIndex') || [];
    console.log(`Found ${userTasksIndex.length} users with tasks in index`);
    
    // Load tasks for each user
    const loadPromises = userTasksIndex.map(async (userId) => {
      try {
        const tasks = await SE_API.store.get(`tasks_${userId}`);
        if (tasks && tasks.length > 0) {
          userTasks[userId] = tasks;
          console.log(`Loaded ${tasks.length} tasks for user ${userId}`);
          return { userId, tasks };
        }
      } catch (error) {
        console.error(`Error loading tasks for user ${userId}:`, error);
      }
      return null;
    });
    
    const results = await Promise.all(loadPromises);
    const successfulLoads = results.filter(result => result !== null);
    
    console.log(`Successfully loaded tasks for ${successfulLoads.length} users from SE_API.store`);
    
    // Also save to localStorage as backup
    if (Object.keys(userTasks).length > 0) {
      saveTasksToLocalStorage();
    }
    
    return successfulLoads.length > 0;
  } catch (error) {
    console.error('Error loading all users tasks from SE_API.store:', error);
    // Fallback to localStorage if SE_API fails
    return loadTasksFromLocalStorage();
  }
}

// Function to maintain the index of users who have tasks
async function updateUserTasksIndex(userId, hasTasks = true) {
  try {
    let userTasksIndex = await SE_API.store.get('userTasksIndex') || [];
    
    if (hasTasks && !userTasksIndex.includes(userId)) {
      userTasksIndex.push(userId);
      await SE_API.store.set('userTasksIndex', userTasksIndex);
      console.log(`Added user ${userId} to tasks index`);
    } else if (!hasTasks && userTasksIndex.includes(userId)) {
      userTasksIndex = userTasksIndex.filter(id => id !== userId);
      await SE_API.store.set('userTasksIndex', userTasksIndex);
      console.log(`Removed user ${userId} from tasks index`);
    }
  } catch (error) {
    console.error('Error updating user tasks index:', error);
  }
}

// Command aliases
const COMMANDS = {
  add: ["!task", "!add"],
  focus: ["!focus"],
  edit: ["!edit"],
  done: ["!done"],
  delete: ["!delete"],
  check: ["!check"],
  help: ["!help"],
  toggle: ["!toggle"],

  clearlist: ["!clearlist"],
  cleardone: ["!cleardone"],
  clearuser: ["!clearuser"],
};

// Utility functions
function generateTaskId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function isCommand(message, commandType) {
  const command = message.toLowerCase().split(" ")[0];
  return COMMANDS[commandType] && COMMANDS[commandType].includes(command);
}

function isModerator(badges) {
  if (!badges) return false;
  return badges.some(
    (badge) =>
      badge.type === "broadcaster" ||
      badge.type === "moderator" ||
      badge.type === "vip",
  );
}

// Chat response function - logs messages that would be sent to chat
function sendChatResponse(message, username = "", prefix = true) {
  if (!fieldData.enableHelpCommand && message.includes("Commands:")) {
    return; // Don't send help if disabled
  }

  const finalMessage = prefix
    ? `${fieldData.botResponsePrefix || "🤖💬 "}${message}`
    : message;

  console.log(`[CHAT RESPONSE] ${finalMessage}`);
  // Note: StreamElements doesn't provide direct chat sending capability
  // This logs what would be sent to chat for debugging/monitoring
}

// Task management
async function getUserTasks(userId) {
  try {
    const data = await SE_API.store.get(`tasks_${userId}`);
    return data || [];
  } catch (error) {
    return [];
  }
}

async function saveUserTasks(userId, tasks) {
  try {
    await SE_API.store.set(`tasks_${userId}`, tasks);
    userTasks[userId] = tasks;
    
    // Update the user tasks index
    await updateUserTasksIndex(userId, tasks.length > 0);
    
    // Also save to local storage for persistence across refreshes
    saveTasksToLocalStorage();
  } catch (error) {
    console.error("Error saving tasks:", error);
  }
}

async function addTask(userId, username, taskText, displayColor) {
  const tasks = await getUserTasks(userId);

  if (tasks.length >= fieldData.maxTasksPerUser) {
    sendChatResponse(
      `@${username} You've reached the maximum of ${fieldData.maxTasksPerUser} tasks!`,
    );
    return { success: false, message: "Max tasks reached" };
  }

  const newTask = {
    id: generateTaskId(),
    text: taskText.trim(),
    completed: false,
    focused: false,
    createdAt: Date.now(),
  };

  tasks.push(newTask);
  await saveUserTasks(userId, tasks);
  renderUserTasks(userId, username, displayColor);
  updateTaskCount();

  sendChatResponse(`@${username} Task added: "${taskText.trim()}"`);
  return { success: true, message: "Task added!" };
}

async function editTask(userId, username, taskIndex, newText, displayColor) {
  const tasks = await getUserTasks(userId);
  const index = parseInt(taskIndex) - 1;

  if (index < 0 || index >= tasks.length) {
    sendChatResponse(
      `@${username} Invalid task number! Use !check to see your tasks.`,
    );
    return { success: false, message: "Invalid task number" };
  }

  const oldText = tasks[index].text;
  tasks[index].text = newText.trim();
  await saveUserTasks(userId, tasks);
  renderUserTasks(userId, username, displayColor);

  sendChatResponse(
    `@${username} Task ${taskIndex} updated: "${newText.trim()}"`,
  );
  return { success: true, message: "Task edited!" };
}

async function completeTask(userId, username, taskIndexes, displayColor) {
  const tasks = await getUserTasks(userId);
  const indexes = taskIndexes.split(",").map((i) => parseInt(i.trim()) - 1);
  let completed = 0;
  let completedTasks = [];

  for (const index of indexes) {
    if (index >= 0 && index < tasks.length && !tasks[index].completed) {
      tasks[index].completed = true;
      tasks[index].focused = false;
      completedTasks.push(index + 1);
      completed++;
    }
  }

  if (completed === 0) {
    sendChatResponse(`@${username} No valid tasks found to complete!`);
    return { success: false, message: "Task not found" };
  }

  await saveUserTasks(userId, tasks);
  renderUserTasks(userId, username, displayColor);
  updateTaskCount();

  const taskNumbers = completedTasks.join(", ");
  sendChatResponse(
    `@${username} Completed task${completed > 1 ? "s" : ""}: ${taskNumbers} ✅`,
  );
  return { success: true, message: "Task completed!" };
}

async function deleteTask(userId, username, taskIndexes, displayColor) {
  const tasks = await getUserTasks(userId);
  const indexes = taskIndexes
    .split(",")
    .map((i) => parseInt(i.trim()) - 1)
    .sort((a, b) => b - a);
  let deleted = 0;
  let deletedTasks = [];

  for (const index of indexes) {
    if (index >= 0 && index < tasks.length) {
      deletedTasks.push(index + 1);
      tasks.splice(index, 1);
      deleted++;
    }
  }

  if (deleted === 0) {
    sendChatResponse(`@${username} No valid tasks found to delete!`);
    return { success: false, message: "Task not found" };
  }

  await saveUserTasks(userId, tasks);

  if (tasks.length === 0) {
    removeUserCard(userId);
  } else {
    renderUserTasks(userId, username, displayColor);
  }

  updateTaskCount();
  const taskNumbers = deletedTasks.join(", ");
  sendChatResponse(
    `@${username} Deleted task${deleted > 1 ? "s" : ""}: ${taskNumbers}`,
  );
  return { success: true, message: "Task deleted!" };
}

async function focusTask(userId, username, taskIndex, displayColor) {
  const tasks = await getUserTasks(userId);
  const index = parseInt(taskIndex) - 1;

  if (index < 0 || index >= tasks.length) {
    sendChatResponse(
      `@${username} Invalid task number! Use !check to see your tasks.`,
    );
    return { success: false, message: "Invalid task number" };
  }

  // Clear all focus
  for (const task of tasks) {
    task.focused = false;
  }

  tasks[index].focused = true;
  await saveUserTasks(userId, tasks);
  renderUserTasks(userId, username, displayColor);

  sendChatResponse(
    `@${username} Now focusing on task ${taskIndex}: "${tasks[index].text}" 🎯`,
  );
  return {
    success: true,
    message: `Focusing on task ${taskIndex}`,
  };
}

async function checkTasks(userId, username) {
  const tasks = await getUserTasks(userId);
  const activeTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  if (tasks.length === 0) {
    sendChatResponse(
      `@${username} You have no tasks! Use !task [text] to add one.`,
    );
    return;
  }

  let response = `@${username} `;
  if (activeTasks.length > 0) {
    response += `Active: ${activeTasks.length}`;
  }
  if (completedTasks.length > 0) {
    response +=
      activeTasks.length > 0
        ? `, Completed: ${completedTasks.length}`
        : `Completed: ${completedTasks.length}`;
  }
  response += ` | Total: ${tasks.length}`;

  sendChatResponse(response);
}

// Clock functions
function startClock() {
  clearInterval(clockInterval);

  const clockTime = document.querySelector(".clock-time");

  if (fieldData.headerFeature === "clock") {
    showHeaderFeature("clock");
  }

  function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    if (clockTime) {
      clockTime.textContent = timeString;
    }
  }

  // Update immediately, then every second
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
}

// DOM functions
function showHeaderFeature(feature) {
  const features = ["clock", "custom-header", "command-tips"];
  features.forEach((f) => {
    const element = document.querySelector(`.${f}`);
    if (element) {
      element.classList.toggle("hidden", f !== feature);
    }
  });
}

function showHelpAnnouncement(userBadges = []) {
  const helpElement = document.getElementById("helpAnnouncement");
  const modCommands = document.getElementById("helpModCommands");

  if (helpElement) {
    // Show/hide moderator commands based on user privileges
    if (modCommands) {
      const isMod = isModerator(userBadges);
      modCommands.classList.toggle("hidden", !isMod);
    }

    // Remove any existing fade-out class and show the element
    helpElement.classList.remove("fade-out");
    helpElement.classList.remove("hidden");

    // Auto-hide after 7 seconds (longer for mod commands)
    const hideDelay = isModerator(userBadges) ? 8000 : 6000;
    setTimeout(() => {
      helpElement.classList.add("fade-out");
      setTimeout(() => {
        helpElement.classList.add("hidden");
      }, 300); // Wait for fade-out animation to complete
    }, hideDelay);
  }
}

function toggleTasksVisibility(username) {
  const taskContainer = document.querySelector(".task-container");
  
  if (!taskContainer) {
    sendChatResponse(`@${username} Task container not found!`);
    return;
  }

  const isCurrentlyVisible = !taskContainer.classList.contains("slide-hidden");
  
  if (isCurrentlyVisible) {
    // Hide tasks with slide animation
    taskContainer.classList.add("slide-hidden");
    sendChatResponse(`@${username} Tasks hidden! 👁️‍🗨️`);
  } else {
    // Show tasks with slide animation
    taskContainer.classList.remove("slide-hidden");
    sendChatResponse(`@${username} Tasks shown! 👀`);
  }
}

// Make function available globally for testing
window.toggleTasksVisibility = toggleTasksVisibility;

function renderUserTasks(userId, username, displayColor) {
  const tasks = userTasks[userId] || [];
  let userCard = document.querySelector(`[data-user-id="${userId}"]`);

  if (tasks.length === 0) {
    if (userCard) userCard.remove();
    return;
  }

  if (!userCard) {
    userCard = document.createElement("div");
    userCard.className = "user-card";
    userCard.setAttribute("data-user-id", userId);
    document.querySelector(".task-container").appendChild(userCard);
  }

  const usernameElement = document.createElement("div");
  usernameElement.className = "username";
  usernameElement.textContent = username;

  if (fieldData.showUsernameColor && displayColor) {
    usernameElement.style.color = displayColor;
  }

  const tasksHTML = tasks
    .map((task) => {
      let classes = "task-item";
      if (task.completed) classes += " done";
      if (task.focused) classes += " focused";
      return `<div class="${classes}">${task.text}</div>`;
    })
    .join("");

  userCard.innerHTML = "";
  userCard.appendChild(usernameElement);
  userCard.insertAdjacentHTML("beforeend", tasksHTML);

  // Autoscroll after rendering tasks
  setTimeout(() => autoScrollTaskContainer(), 100);
}

function renderAllUserTasks() {
  console.log('Rendering all user tasks immediately...');
  
  // Ensure task container exists
  const taskContainer = document.querySelector(".task-container");
  if (!taskContainer) {
    console.warn('Task container not found, cannot render tasks');
    return;
  }
  
  // Clear existing task cards to prevent duplicates
  taskContainer.innerHTML = "";
  
  // Render all user tasks from memory
  Object.entries(userTasks).forEach(([userId, tasks]) => {
    if (tasks && tasks.length > 0) {
      // Use stored username if available, otherwise fallback to User_${userId}
      const username = userNames[userId] || `User_${userId}`;
      renderUserTasks(userId, username, null);
      console.log(`Rendered ${tasks.length} tasks for user ${username} (ID: ${userId})`);
    }
  });
  
  console.log(`Rendered tasks for ${Object.keys(userTasks).length} users`);
}

function removeUserCard(userId) {
  const userCard = document.querySelector(`[data-user-id="${userId}"]`);
  if (userCard) userCard.remove();
}

function updateTaskCount() {
  const totalTasks = Object.values(userTasks).reduce(
    (total, tasks) => total + tasks.length,
    0,
  );
  const completedTasks = Object.values(userTasks).reduce(
    (total, tasks) => total + tasks.filter((task) => task.completed).length,
    0,
  );

  const taskCountElement = document.querySelector(".task-count");
  if (taskCountElement) {
    taskCountElement.textContent = `${completedTasks}/${totalTasks}`;
  }
}

// Autoscroll function for task container
function autoScrollTaskContainer(smooth = true) {
  const taskContainer = document.querySelector(".task-container");
  if (taskContainer) {
    taskContainer.scrollTo({
      top: taskContainer.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }
}

function clearAllTasks() {
  userTasks = {};
  document.querySelector(".task-container").innerHTML = "";
  updateTaskCount();
}

async function clearDoneTasks() {
  for (const [userId, tasks] of Object.entries(userTasks)) {
    const activeTasks = tasks.filter((task) => !task.completed);
    if (activeTasks.length !== tasks.length) {
      await saveUserTasks(userId, activeTasks);
      if (activeTasks.length === 0) {
        removeUserCard(userId);
      }
    }
  }
  updateTaskCount();
}

async function clearUserTasks(username) {
  const userEntry = Object.entries(userTasks).find(([userId, tasks]) => {
    const userCard = document.querySelector(`[data-user-id="${userId}"]`);
    if (userCard) {
      const cardUsername = userCard.querySelector(".username").textContent;
      return cardUsername.toLowerCase() === username.toLowerCase();
    }
    return false;
  });

  if (userEntry) {
    const [userId] = userEntry;
    await saveUserTasks(userId, []);
    removeUserCard(userId);
    updateTaskCount();
    return username;
  }
  return null;
}

// Command handler
async function handleChatCommand(
  message,
  username,
  userId,
  badges,
  displayColor,
) {
  const args = message.trim().split(" ");
  const content = args.slice(1).join(" ").trim();

  // Save username for this user ID if we have a valid username
  if (username && userId && username !== `User_${userId}`) {
    // Only save if it's different from what we have stored
    if (userNames[userId] !== username) {
      await saveUserName(userId, username);
      console.log(`Username updated: ${username} for user ID ${userId}`);
    }
  }

  // Help command
  if (isCommand(message, "help")) {
    if (fieldData.enableHelpCommand) {
      showHelpAnnouncement(badges);
      
      // Send detailed command information to chat
      const isMod = isModerator(badges);
      let helpMessage = `@${username} 📝 Available Commands: `;
      helpMessage += `!task [text] (add task) | !edit [#] [new text] (edit task) | `;
      helpMessage += `!done [#] (complete task) | !delete [#] (remove task) | `;
      helpMessage += `!focus [#] (highlight task) | !check (view your tasks) | !toggle (show/hide tasks)`;
      
      if (isMod) {
        helpMessage += ` | 🔧 Mod Commands: !clearlist (clear all) | !cleardone (clear completed) | !clearuser [name] (clear user's tasks)`;
      }
      
      sendChatResponse(helpMessage, "", false);
      
      // Also send the configured help response if different
      if (fieldData.helpCommandResponse && fieldData.helpCommandResponse !== helpMessage) {
        sendChatResponse(fieldData.helpCommandResponse, "", false);
      }
    }
    return;
  }

  // User commands
  if (isCommand(message, "add") && content) {
    const tasks = content
      .split(",")
      .map((task) => task.trim())
      .filter((task) => task);
    for (const taskText of tasks) {
      await addTask(userId, username, taskText, displayColor);
    }
    return;
  }

  if (isCommand(message, "edit") && content) {
    const parts = content.split(" ");
    const taskIndex = parts[0];
    const newText = parts.slice(1).join(" ");
    if (newText) {
      await editTask(userId, username, taskIndex, newText, displayColor);
    }
    return;
  }

  if (isCommand(message, "done") && content) {
    await completeTask(userId, username, content, displayColor);
    return;
  }

  if (isCommand(message, "delete") && content) {
    await deleteTask(userId, username, content, displayColor);
    return;
  }

  if (isCommand(message, "focus") && content) {
    await focusTask(userId, username, content, displayColor);
    return;
  }

  if (isCommand(message, "check")) {
    await checkTasks(userId, username);
    return;
  }

  if (isCommand(message, "toggle")) {
    toggleTasksVisibility(username);
    return;
  }

  // Moderator commands
  if (isModerator(badges)) {
    if (isCommand(message, "clearlist")) {
      clearAllTasks();
      sendChatResponse("All tasks cleared! 🧹");
      return;
    }

    if (isCommand(message, "cleardone")) {
      await clearDoneTasks();
      sendChatResponse("All completed tasks cleared! ✨");
      return;
    }

    if (isCommand(message, "clearuser") && content) {
      const clearedUser = await clearUserTasks(content);
      if (clearedUser) {
        sendChatResponse(`Cleared all tasks for ${clearedUser} 🗑️`);
      } else {
        sendChatResponse(`User "${content}" not found in task list.`);
      }
      return;
    }
  }
}

// Auto-reload functionality
async function initializeWidget() {
  console.log('Initializing widget with auto-reload functionality...');
  
  // Load usernames first
  try {
    await loadAllUserNames();
  } catch (error) {
    console.error('Error loading usernames:', error);
  }
  
  // Load tasks from SE_API.store first, fallback to localStorage
  try {
    const tasksLoaded = await loadAllUsersTasksFromStore();
    if (tasksLoaded) {
      console.log('Tasks loaded from SE_API.store during initialization');
    } else {
      console.log('No tasks found in SE_API.store, checking localStorage...');
      loadTasksFromLocalStorage();
    }
  } catch (error) {
    console.error('Error loading from SE_API.store, falling back to localStorage:', error);
    loadTasksFromLocalStorage();
  }
  
  // Force immediate rendering of all loaded tasks
  renderAllUserTasks();
  
  // Apply font family if specified
  if (fieldData.fontFamily) {
    document.body.style.fontFamily = fieldData.fontFamily;
  }

  // Set header feature
  if (fieldData.headerFeature === "commands") {
    showHeaderFeature("command-tips");
  } else if (fieldData.headerFeature === "text") {
    showHeaderFeature("custom-header");
  } else if (fieldData.headerFeature === "clock") {
    startClock();
  } else {
    // tasks-only
    document.querySelector(".header").style.justifyContent = "flex-end";
  }

  updateTaskCount();
  console.log('Widget initialization complete');
}

// Enhanced auto-reload on page/widget refresh
async function handlePageLoad() {
  console.log('Page load detected, ensuring tasks are loaded...');
  
  // Ensure tasks are loaded even if fieldData isn't ready yet
  if (Object.keys(userTasks).length === 0) {
    try {
      const tasksLoaded = await loadAllUsersTasksFromStore();
      if (tasksLoaded) {
        console.log('Tasks loaded from SE_API.store during page load');
      } else {
        console.log('No tasks in SE_API.store, trying localStorage...');
        const localTasksLoaded = loadTasksFromLocalStorage();
        if (localTasksLoaded) {
          console.log('Tasks loaded from localStorage during page load');
        }
      }
    } catch (error) {
      console.error('Error loading from SE_API.store during page load, trying localStorage:', error);
      const localTasksLoaded = loadTasksFromLocalStorage();
      if (localTasksLoaded) {
        console.log('Tasks loaded from localStorage as fallback during page load');
      }
    }
  }
  
  // Force immediate rendering of all loaded tasks
  renderAllUserTasks();
  updateTaskCount();
}

// Event listeners
window.addEventListener("onWidgetLoad", function (obj) {
  fieldData = obj.detail.fieldData;
  initializeWidget();
});

// Additional event listeners for auto-reload functionality
window.addEventListener("load", handlePageLoad);
window.addEventListener("DOMContentLoaded", handlePageLoad);

// Handle browser refresh/reload
window.addEventListener("beforeunload", function() {
  console.log('Page unloading, ensuring tasks are saved...');
  saveTasksToLocalStorage();
});

// Fallback initialization in case onWidgetLoad doesn't fire
document.addEventListener("DOMContentLoaded", function() {
  console.log('DOM loaded, checking if widget needs initialization...');
  
  // Add a small delay to ensure mock environment is ready
  setTimeout(() => {
    // If fieldData isn't set yet, try to load tasks anyway
    if (!fieldData || Object.keys(fieldData).length === 0) {
      console.log('fieldData not ready, loading tasks from storage...');
      const tasksLoaded = loadTasksFromLocalStorage();
      if (tasksLoaded) {
        console.log('Tasks loaded in fallback, rendering immediately...');
        renderAllUserTasks();
      }
      updateTaskCount();
    }
  }, 50);
});

window.addEventListener("onEventReceived", function (obj) {
  const listener = obj.detail.listener;
  const data = obj.detail.event;

  if (listener === "message") {
    const messageData = data.data;
    const message = messageData.text;
    const username = messageData.displayName || messageData.nick;
    const userId = messageData.userId;
    const badges = messageData.badges || [];
    const displayColor = fieldData.showUsernameColor
      ? messageData.displayColor
      : null;

    handleChatCommand(message, username, userId, badges, displayColor);
  }
});

// Auto-save tasks periodically
setInterval(() => {
  if (Object.keys(userTasks).length > 0) {
    SE_API.store.set("taskListBackup", userTasks).catch(() => {});
  }
}, 30000);
