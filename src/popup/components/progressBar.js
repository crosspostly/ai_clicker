/**
 * ProgressBar Component
 * Reusable progress bar with status indicators
 */

export class ProgressBar {
  constructor(containerElement, maxValue = 100) {
    this.container = containerElement;
    this.maxValue = maxValue;
    this.currentValue = 0;
    this.startTime = null;
    this.elapsedTime = 0;
    
    this.createElements();
  }

  createElements() {
    // Create progress bar container
    this.progressBarContainer = document.createElement('div');
    this.progressBarContainer.className = 'progress-bar-container';
    
    // Create progress fill element
    this.progressFill = document.createElement('div');
    this.progressFill.className = 'progress-fill';
    
    // Create progress info container
    this.progressInfo = document.createElement('div');
    this.progressInfo.className = 'progress-info';
    
    // Create counter and time elements
    this.counter = document.createElement('span');
    this.counter.className = 'counter';
    this.counter.textContent = '0/0';
    
    this.timeDisplay = document.createElement('span');
    this.timeDisplay.className = 'time';
    this.timeDisplay.textContent = '00:00';
    
    // Assemble the structure
    this.progressBarContainer.appendChild(this.progressFill);
    this.progressInfo.appendChild(this.counter);
    this.progressInfo.appendChild(this.timeDisplay);
    
    // Clear container and add new elements
    this.container.innerHTML = '';
    this.container.appendChild(this.progressBarContainer);
    this.container.appendChild(this.progressInfo);
  }

  update(current, max) {
    this.currentValue = current;
    this.maxValue = max;
    
    // Calculate percentage
    const percentage = max > 0 ? (current / max) * 100 : 0;
    
    // Update progress fill width
    this.progressFill.style.width = `${percentage}%`;
    
    // Update counter text
    this.counter.textContent = `${current}/${max}`;
    
    // Update elapsed time if running
    if (this.startTime) {
      this.updateElapsedTime();
    }
  }

  setTime(elapsed) {
    this.elapsedTime = elapsed;
    this.timeDisplay.textContent = this.formatTime(elapsed);
  }

  updateElapsedTime() {
    if (this.startTime) {
      const now = Date.now();
      const elapsed = Math.floor((now - this.startTime + this.elapsedTime) / 1000);
      this.timeDisplay.textContent = this.formatTime(elapsed);
    }
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  reset() {
    this.currentValue = 0;
    this.maxValue = 0;
    this.startTime = null;
    this.elapsedTime = 0;
    
    this.progressFill.style.width = '0%';
    this.counter.textContent = '0/0';
    this.timeDisplay.textContent = '00:00';
  }

  setStatus(status) {
    // Remove all status classes
    this.progressFill.classList.remove('running', 'paused', 'complete', 'error');
    
    // Add the new status class
    if (status) {
      this.progressFill.classList.add(status);
    }
    
    // Handle timing based on status
    switch (status) {
      case 'running':
        if (!this.startTime) {
          this.startTime = Date.now();
        }
        break;
      case 'paused':
        if (this.startTime) {
          this.elapsedTime += Math.floor((Date.now() - this.startTime) / 1000);
          this.startTime = null;
        }
        break;
      case 'complete':
        if (this.startTime) {
          this.elapsedTime += Math.floor((Date.now() - this.startTime) / 1000);
          this.startTime = null;
        }
        this.updateElapsedTime();
        break;
      case 'error':
        if (this.startTime) {
          this.elapsedTime += Math.floor((Date.now() - this.startTime) / 1000);
          this.startTime = null;
        }
        this.updateElapsedTime();
        break;
    }
  }

  start() {
    this.setStatus('running');
  }

  pause() {
    this.setStatus('paused');
  }

  complete() {
    this.setStatus('complete');
  }

  error() {
    this.setStatus('error');
  }

  getCurrentValue() {
    return this.currentValue;
  }

  getMaxValue() {
    return this.maxValue;
  }

  getPercentage() {
    return this.maxValue > 0 ? (this.currentValue / this.maxValue) * 100 : 0;
  }

  getElapsedTime() {
    return this.elapsedTime;
  }
}