/**
 * StatusIndicator Component
 * Reusable status display with icons and type-specific styling
 */

export class StatusIndicator {
  constructor(containerElement) {
    this.container = containerElement;
    this.isVisible = true;
    this.currentType = 'info';
    this.timeoutId = null;
    
    this.createElements();
  }

  createElements() {
    // Create status box element
    this.statusBox = document.createElement('div');
    this.statusBox.className = 'status-box info';
    
    // Create icon element
    this.icon = document.createElement('span');
    this.icon.className = 'status-icon';
    
    // Create message element
    this.message = document.createElement('span');
    this.message.className = 'status-message';
    
    // Assemble the structure
    this.statusBox.appendChild(this.icon);
    this.statusBox.appendChild(this.message);
    
    // Clear container and add status box
    this.container.innerHTML = '';
    this.container.appendChild(this.statusBox);
  }

  show(message, type = 'info', autoHide = false) {
    this.message.textContent = message;
    this.setType(type);
    this.setVisible(true);
    
    // Auto-hide functionality
    if (autoHide) {
      this.setAutoHide(autoHide);
    }
  }

  hide() {
    this.setVisible(false);
    this.clearAutoHide();
  }

  setType(type) {
    // Remove all type classes
    this.statusBox.classList.remove('info', 'success', 'error', 'warning');
    
    // Add the new type class
    this.statusBox.classList.add(type);
    this.currentType = type;
    
    // Update icon
    this.setIcon(type);
  }

  setIcon(type) {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
    };
    
    this.icon.textContent = icons[type] || icons.info;
  }

  setVisible(visible) {
    this.isVisible = visible;
    this.statusBox.style.display = visible ? 'flex' : 'none';
  }

  setAutoHide(delay) {
    // Clear any existing timeout
    this.clearAutoHide();
    
    // Set new timeout
    this.timeoutId = setTimeout(() => {
      this.hide();
    }, delay);
  }

  clearAutoHide() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  // Convenience methods for different status types
  info(message, autoHide = false) {
    this.show(message, 'info', autoHide);
  }

  success(message, autoHide = false) {
    this.show(message, 'success', autoHide);
  }

  error(message, autoHide = false) {
    this.show(message, 'error', autoHide);
  }

  warning(message, autoHide = false) {
    this.show(message, 'warning', autoHide);
  }

  // Method to update message without changing type
  updateMessage(message) {
    this.message.textContent = message;
  }

  // Method to get current state
  getState() {
    return {
      message: this.message.textContent,
      type: this.currentType,
      visible: this.isVisible,
    };
  }

  // Method to reset to default state
  reset() {
    this.clearAutoHide();
    this.show('Ready to play', 'info');
  }

  // Method to add custom styling
  setCustomStyle(styles) {
    Object.assign(this.statusBox.style, styles);
  }

  // Method to add animation
  animate(animationClass, duration = 1000) {
    this.statusBox.classList.add(animationClass);
    setTimeout(() => {
      this.statusBox.classList.remove(animationClass);
    }, duration);
  }
}