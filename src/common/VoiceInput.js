/**
 * Voice Input Service - Production Ready
 * Records user voice with error handling
 */

export class VoiceInput {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
  }

  /**
   * ✅ Check if Web Speech API is supported
   */
  isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Start listening to user voice
   */
  async start(onTranscript, onAudioChunk) {
    if (this.isListening) return;
    
    // ✅ Check browser support
    if (!this.isSupported()) {
      throw new Error('Web Speech API not supported in this browser');
    }
    
    try {
      // Initialize Web Speech API for transcript
      this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      
      this.recognition.onresult = (event) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;
        const isFinal = event.results[last].isFinal;
        
        if (onTranscript) {
          onTranscript(transcript, isFinal);
        }
      };
      
      this.recognition.onerror = (event) => {
        console.error('[VoiceInput] Recognition error:', event.error);
        if (event.error === 'no-speech') {
          // Restart recognition
          setTimeout(() => {
            if (this.isListening) {
              this.recognition.start();
            }
          }, 1000);
        }
      };
      
      this.recognition.onend = () => {
        // Auto-restart if still listening
        if (this.isListening) {
          this.recognition.start();
        }
      };
      
      this.recognition.start();
      
      // Initialize MediaRecorder for raw audio
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      
      // ✅ Check MediaRecorder support
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4';
      
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          
          // Convert to base64 and send
          if (onAudioChunk) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result.split(',')[1];
              onAudioChunk(base64);
            };
            reader.readAsDataURL(event.data);
          }
        }
      };
      
      this.mediaRecorder.onerror = (event) => {
        console.error('[VoiceInput] MediaRecorder error:', event.error);
      };
      
      // Capture audio chunks every 1 second
      this.mediaRecorder.start(1000);
      
      this.isListening = true;
      console.log('[VoiceInput] Started listening');
    } catch (error) {
      console.error('[VoiceInput] Error starting:', error);
      
      if (error.name === 'NotAllowedError') {
        throw new Error('Microphone permission denied');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No microphone found');
      } else {
        throw error;
      }
    }
  }

  /**
   * Stop listening
   */
  stop() {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.audioChunks = [];
    this.isListening = false;
    console.log('[VoiceInput] Stopped');
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isListening: this.isListening,
      isSupported: this.isSupported(),
    };
  }
}
