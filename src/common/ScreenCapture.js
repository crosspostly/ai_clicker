/**
 * Screen Capture Service - Production Ready
 * Captures screenshots with user selection and optimization
 */

export class ScreenCapture {
  constructor() {
    this.streamId = null;
    this.stream = null;
    this.captureInterval = null;
    this.isCapturing = false;
    this.lastScreenshot = null;
    this.video = null;
  }

  /**
   * ✅ Let user choose what to capture (screen/window/tab)
   */
  async requestScreenSelection() {
    return new Promise((resolve, reject) => {
      chrome.desktopCapture.chooseDesktopMedia(
        ['screen', 'window', 'tab'], // All options available
        (streamId) => {
          if (!streamId) {
            reject(new Error('User cancelled screen selection'));
            return;
          }
          console.log('[ScreenCapture] User selected stream:', streamId);
          this.streamId = streamId;
          resolve(streamId);
        }
      );
    });
  }

  /**
   * ✅ Get media stream from selected source
   */
  async getStream() {
    if (!this.streamId) {
      await this.requestScreenSelection();
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: this.streamId,
            maxWidth: 1920,
            maxHeight: 1080
          }
        }
      });

      console.log('[ScreenCapture] Stream acquired');
      return this.stream;
    } catch (error) {
      console.error('[ScreenCapture] Error getting stream:', error);
      throw error;
    }
  }

  /**
   * ✅ Capture screenshot with optimization
   */
  async captureOptimized() {
    if (!this.stream) {
      await this.getStream();
    }

    if (!this.video) {
      this.video = document.createElement('video');
      this.video.srcObject = this.stream;
      this.video.play();

      await new Promise(resolve => {
        this.video.onloadedmetadata = resolve;
      });
    }

    const canvas = document.createElement('canvas');
    
    // ✅ OPTIMIZATION: Resize to 960x540 (16:9)
    canvas.width = 960;
    canvas.height = 540;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.video, 0, 0, canvas.width, canvas.height);

    // ✅ OPTIMIZATION: JPEG with 60% quality (smaller size)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
    const base64 = dataUrl.split(',')[1];
    
    // ✅ OPTIMIZATION: Diff detection - don't send duplicates
    if (this.lastScreenshot === base64) {
      return null; // No changes
    }
    
    this.lastScreenshot = base64;
    return base64;
  }

  /**
   * Start capturing screenshots periodically
   */
  async start(onCapture, intervalMs = 3000) {
    if (this.isCapturing) return;
    
    try {
      // Request screen selection first
      await this.requestScreenSelection();
      
      this.isCapturing = true;
      
      // Immediate first capture
      const screenshot = await this.captureOptimized();
      if (screenshot && onCapture) {
        onCapture(screenshot);
      }
      
      // Then periodic captures
      this.captureInterval = setInterval(async () => {
        try {
          const screenshot = await this.captureOptimized();
          if (screenshot && onCapture) {
            onCapture(screenshot);
          }
        } catch (error) {
          console.error('[ScreenCapture] Error in capture loop:', error);
        }
      }, intervalMs);
      
      console.log(`[ScreenCapture] Started capturing at ${intervalMs}ms interval`);
    } catch (error) {
      console.error('[ScreenCapture] Failed to start:', error);
      this.isCapturing = false;
      throw error;
    }
  }

  /**
   * Stop capturing
   */
  stop() {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }
    
    this.isCapturing = false;
    this.lastScreenshot = null;
    console.log('[ScreenCapture] Stopped');
  }

  /**
   * Get current capture status
   */
  getStatus() {
    return {
      isCapturing: this.isCapturing,
      hasStream: !!this.stream,
      streamId: this.streamId
    };
  }
}
