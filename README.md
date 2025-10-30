# 🎮 Twitch Task List Overlay

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.2.0-blue.svg)](https://github.com/jujoco/twitch-multitask-task-list-overlay)
[![Platform](https://img.shields.io/badge/platform-Twitch%20%7C%20StreamElements-purple.svg)](https://streamelements.com)
[![Auto-Scroll](https://img.shields.io/badge/feature-Auto--Scroll%20Carousel-brightgreen.svg)](https://github.com)

An interactive task management overlay for Twitch streamers that allows viewers to create, edit, and manage tasks through chat commands. Perfect for productivity streams, coding sessions, study streams, or any content where task tracking enhances viewer engagement.

**NEW in v2.2:** 🎪 **Auto-Scroll Carousel** - Automatically cycles through all user tasks with smooth animations!

<div align="center">
  <img src="./images/live-sample.png" alt="Live Task List Sample" width="600">
</div>

## ✨ Features

### 🎯 **Core Functionality**
- **Interactive Chat Commands** - Viewers manage tasks through simple chat commands
- **Real-time Updates** - Tasks appear instantly on the overlay
- **User-specific Task Lists** - Each viewer maintains their own personal task list
- **Persistent Storage** - Tasks are saved and persist across stream sessions
- **Visual Help System** - On-screen command help with `!help`

### 🎪 **Auto-Scroll Carousel** (NEW!)
- **Automatic Scrolling** - Smoothly cycles through all user task cards
- **Configurable Timing** - Adjust pause duration (2-15s) and scroll speed (0.5-3s)
- **Infinite Loop** - Continuously scrolls through all tasks without manual intervention
- **Smart Behavior** - Auto-restarts when tasks are added/edited/deleted
- **Moderator Controls** - Pause/resume carousel via chat commands
- **Optimal Viewing** - Centers each card in viewport for better visibility

### 💬 **Chat Commands**

#### 👥 **For Everyone:**
- `!task [text]` or `!add [text]` - Add new task
- `!edit [#] [new text]` - Edit task by number
- `!done [#]` - Mark task as completed
- `!delete [#]` - Delete task by number
- `!focus [#]` - Highlight/focus on a task
- `!check` - View your task summary
- `!toggle` - Toggle Show/Hide Task
- `!help` - Show command help on screen

#### 🔧 **For Moderators/Broadcasters:**
- `!clearlist` - Clear all tasks from everyone
- `!cleardone` - Remove all completed tasks
- `!clearuser [username]` - Clear specific user's tasks
- `!pausescroll` - Pause auto-scroll carousel ⏸️
- `!resumescroll` - Resume auto-scroll carousel ▶️

### 🎨 **Customization**
- **Multiple Header Options** - Clock, custom text, commands, or tasks-only
- **Color Customization** - Full control over colors and opacity
- **Responsive Design** - Works perfectly in OBS and streaming software
- **Multi-language Support** - Available in 7 languages

## 🚀 Quick Start

1. **Go to StreamElements**
   - Visit [streamelements.com](https://streamelements.com)
   - Navigate to `Overlays` → Your overlay → `Add Widget` → `Custom`

2. **Copy Widget Code**
   - Download this repository
   - Copy the widget.html, widget.js, widget.css, and fields.json
   - Paste into StreamElements custom widget editor

3. **Configure & Deploy**
   - Customize settings in the left panel
   - Click "Done" and position in your overlay
   - Copy url overlay

3. **Add to OBS**
   - Add Browser Source pointing to `url overlay`
   - Set dimensions to 660x1600px

## 🎛️ Configuration Options

### 📋 **Task Settings**
- **Max Tasks Per User** (1-20) - Limit tasks per viewer
- **Show Username Colors** - Display Twitch chat colors

### 🎪 **Auto-Scroll Carousel Settings**
- **Enable Auto-Scroll Carousel** - Toggle on/off (default: ON)
- **Pause Duration Per Card** (2-15s) - How long to show each card (default: 5s)
- **Scroll Transition Speed** (0.5-3s) - Scroll animation speed (default: 1s)

### 📺 **Header Options**
- **Clock** - Real-time clock display
- **Custom Text** - Your personalized message
- **Commands** - Shows "!help for commands"
- **Tasks Only** - Just the task counter

### 🎨 **Visual Styling**
- Card background color & opacity
- Task text colors
- Focus highlight colors
- Header styling options

## 🌍 Multi-language Support

Available in 7 languages with localized commands:
- 🇺🇸 **English** (EN)
- 🇪🇸 **Spanish** (ES) 
- 🇫🇷 **French** (FR)
- 🇯🇵 **Japanese** (JP)
- 🇺🇦 **Ukrainian** (UA)
- 🇩🇪 **German** (DE)
- 🇧🇷 **Portuguese Brazilian** (PT_BR)

## 📸 Screenshots

<div align="center">
  <img src="./images/customize-sample.png" alt="Customization Options" width="600">
  <br>
  <em>Easy customization through StreamElements interface</em>
</div>

## 🛠️ Development

### **Contributing**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🆘 Troubleshooting

### **Common Issues**

**Tasks not appearing?**
- Check browser console (F12) for errors
- Verify widget is properly positioned in overlay
- Ensure chat commands are typed correctly

**StreamElements widget not working?**
- Verify all code sections are properly filled
- Check for JavaScript errors in console
- Try refreshing the overlay in OBS

**Auto-scroll carousel not working?**
- Check "Enable Auto-Scroll Carousel" is ON in settings
- Need at least 2 user cards for carousel to activate
- Try `!resumescroll` command if paused
- Verify browser supports smooth scrolling

**Carousel scrolling too fast/slow?**
- Adjust "Pause Duration Per Card" slider (recommended: 4-7s)
- Adjust "Scroll Transition Speed" slider (recommended: 0.8-1.5s)
- Test different combinations for your stream pace

For detailed troubleshooting, see [DOCUMENTATION.md](DOCUMENTATION.md#troubleshooting)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits

**Original Creator:** [@Jujoco_Dev](https://twitch.tv/Jujoco_Dev)
**StreamElements Integration:** Enhanced with visual help system and SE API integration
**Auto-Scroll Carousel Feature:** Added in v2.2 for improved task visibility
**Community:** Thanks to all contributors and testers

## 📚 Documentation

- **[DOCUMENTATION.md](DOCUMENTATION.md)** - Comprehensive technical documentation
  - Complete command reference
  - Configuration options explained
  - Auto-scroll carousel implementation details
  - Troubleshooting guide
  - Best practices for streamers
  - Technical architecture

- **[test-auto-reload.html](test-auto-reload.html)** - Local testing environment
  - Test auto-scroll carousel functionality
  - Verify task persistence
  - Test pause/resume commands
  - Debug issues before going live  

## ⭐ Support the Project

If this overlay helps your stream, consider:
- ⭐ Starring this repository
- 🐛 Reporting bugs or suggesting features
- 💬 Sharing with other streamers
- 🔄 Contributing improvements

---

<div align="center">
  <strong>Happy Streaming! 🎉</strong><br>
  Made with ❤️ for the Twitch community
</div>
