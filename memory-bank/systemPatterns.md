# System Patterns

## System Architecture

### Core Components:
1. **Widget Frontend** (`widget.html`, `widget.css`, `widget.js`)
   - HTML structure with header and task container
   - CSS styling with customizable themes and animations
   - JavaScript handling chat commands and UI updates

2. **StreamElements Integration**
   - Uses SE_API for persistent storage
   - Receives chat events through StreamElements event system
   - Configuration through fields.json

3. **Data Storage**
   - User tasks stored per userId in StreamElements store
   - Format: `tasks_${userId}` containing array of task objects
   - Auto-backup every 30 seconds to `taskListBackup`

## Key Technical Decisions

### Task Management:
- **User-Centric Storage**: Each user has their own task list identified by userId
- **Task Object Structure**:
  ```javascript
  {
    id: generateTaskId(), // timestamp + random
    text: "task content",
    completed: false,
    focused: false,
    createdAt: Date.now()
  }
  ```

### Command System:
- **Alias-Based Commands**: Multiple aliases for same command (e.g., `!task`, `!add`)
- **Permission-Based Access**: Moderator commands restricted by badge checking
- **Flexible Parsing**: Commands support multiple formats and comma-separated values

### Real-Time Updates:
- **Event-Driven Architecture**: Responds to StreamElements message events
- **Immediate UI Updates**: DOM manipulation happens instantly after command processing
- **Persistent State**: All changes saved to StreamElements store

## Design Patterns in Use

### 1. **Command Pattern**
```javascript
const COMMANDS = {
  add: ["!task", "!add"],
  focus: ["!focus"],
  // ... other commands
};

function isCommand(message, commandType) {
  const command = message.toLowerCase().split(" ")[0];
  return COMMANDS[commandType] && COMMANDS[commandType].includes(command);
}
```

### 2. **Observer Pattern**
- StreamElements event listeners for chat messages
- Automatic UI updates when data changes
- Clock updates via setInterval

### 3. **Factory Pattern**
```javascript
function generateTaskId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
```

### 4. **State Management Pattern**
- Global `userTasks` object for in-memory state
- Persistent storage through SE_API
- Synchronization between memory and storage

## Component Relationships

```
StreamElements Chat → Event Handler → Command Parser → Task Manager → UI Renderer
                                                    ↓
                                              SE_API Storage
```

### Data Flow:
1. **Input**: Chat message received via StreamElements
2. **Processing**: Command parsed and validated
3. **Business Logic**: Task operations (add, edit, delete, etc.)
4. **Persistence**: Data saved to StreamElements store
5. **UI Update**: DOM updated to reflect changes
6. **Feedback**: Chat response sent (logged)

## Critical Implementation Paths

### Task Addition Flow:
1. Parse `!task` command and extract text
2. Validate user hasn't exceeded max tasks
3. Create task object with unique ID
4. Add to user's task array
5. Save to persistent storage
6. Update UI with new task
7. Send confirmation message

### Permission Checking:
```javascript
function isModerator(badges) {
  if (!badges) return false;
  return badges.some(
    (badge) =>
      badge.type === "broadcaster" ||
      badge.type === "moderator" ||
      badge.type === "vip",
  );
}
```

### UI Rendering Strategy:
- **Incremental Updates**: Only re-render affected user cards
- **Animation Support**: CSS transitions for smooth user experience
- **Responsive Design**: Flexible layout adapts to content
- **Performance**: Efficient DOM manipulation with minimal reflows

### Error Handling:
- **Graceful Degradation**: Continue operation if storage fails
- **User Feedback**: Clear error messages for invalid commands
- **Fallback Storage**: In-memory state as backup

### Customization System:
- **Field-Based Configuration**: StreamElements fields.json defines all options
- **CSS Variable Injection**: Dynamic styling through template variables
- **Feature Toggles**: Enable/disable functionality through configuration
