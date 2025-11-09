/**
 * Main content script
 * Initializes and manages all content script functionality
 */

import { ElementFinder } from './finder/ElementFinder';
import { ActionRecorder } from './recorder/ActionRecorder';
import { ActionExecutor } from './executor/ActionExecutor';
import { InstructionParser } from '../ai/InstructionParser';
import { LiveModeOverlay } from './LiveModeOverlay.js';
import { VoiceInput } from '../common/VoiceInput.js';
import { PlaybackRenderer } from './playbackRenderer.js';
import { PLAYBACK_MESSAGES } from '../common/constants.js';

// Global instances
let elementFinder = null;
let actionRecorder = null;
let actionExecutor = null;

// ✅ Live Mode instances
let liveOverlay = null;
let voiceInput = null;
let isLiveModeActive = false;

// ✅ Playback instances
let playbackRenderer = null;

/**
 * Initialize content script
 */
function init() {
  try {
    elementFinder = new ElementFinder();
    actionRecorder = new ActionRecorder(elementFinder);
    actionExecutor = new ActionExecutor(elementFinder);
    playbackRenderer = new PlaybackRenderer();

    setupMessageListeners();
    setupRecorderListeners();
    setupExecutorListeners();
    setupPlaybackListeners();
  } catch (error) {
    console.error('[AI-Autoclicker] Initialization error:', error);
  }
}

/**
 * Setup message listeners for background communication
 */
function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
      try {
        switch (request.action) {
          case 'startRecording':
            handleStartRecording();
            sendResponse({ success: true });
            break;

          case 'stopRecording':
            handleStopRecording();
            sendResponse({ success: true });
            break;

          case 'playActions':
            await handlePlayActions(request.actions, request.speed);
            sendResponse({ success: true });
            break;

          case 'startAIMode':
            await handleStartAIMode(request.instructions, request.geminiApiKey);
            sendResponse({ success: true });
            break;

          case 'stopAIMode':
            handleStopAIMode();
            sendResponse({ success: true });
            break;

          // ✅ Live Mode actions
          case 'toggleLiveMode':
            await handleToggleLiveMode(request.apiKey);
            sendResponse({ success: true });
            break;

          default:
            // ✅ Handle Live Mode messages
            if (request.type && request.type.startsWith('live-')) {
              handleLiveModeMessage(request);
              sendResponse({ success: true });
            } else {
              sendResponse({ success: false, error: 'Unknown action' });
            }
        }
      } catch (error) {
        console.error('[AI-Autoclicker] Message handler error:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep message channel open for async response
  });
}

/**
 * Setup recorder event listeners
 */
function setupRecorderListeners() {
  actionRecorder.on('action-recorded', ({ action, count }) => {
    sendMessageToPopup({
      type: 'actionRecorded',
      data: action,
      actionCount: count,
    });
  });

  actionRecorder.on('recording-started', () => {
    showRecordingIndicator(true);
  });

  actionRecorder.on('recording-stopped', ({ _actions }) => {
    showRecordingIndicator(false);
  });
}

/**
 * Setup executor event listeners
 */
function setupExecutorListeners() {
  actionExecutor.on('action-started', ({ action, index, total }) => {
    sendMessageToPopup({
      type: 'aiLog',
      message: `▶ ${index + 1}/${total}: ${action.description || action.type}`,
      level: 'info',
    });
  });

  actionExecutor.on('action-completed', ({ action }) => {
    sendMessageToPopup({
      type: 'aiLog',
      message: `✓ Завершено: ${action.description || action.type}`,
      level: 'success',
    });
  });

  actionExecutor.on('action-failed', ({ action, error }) => {
    sendMessageToPopup({
      type: 'aiLog',
      message: `✗ Ошибка при ${action.description || action.type}: ${error}`,
      level: 'error',
    });
  });

  actionExecutor.on('sequence-completed', ({ actionCount }) => {
    sendMessageToPopup({
      type: 'aiStatus',
      status: 'завершено успешно',
      message: `✓ Все ${actionCount} действий выполнены`,
      level: 'success',
    });
  });

  actionExecutor.on('sequence-stopped', () => {
    sendMessageToPopup({
      type: 'aiStatus',
      status: 'остановлено',
      message: '⏸ Выполнение остановлено',
      level: 'warn',
    });
  });

  actionExecutor.on('sequence-error', ({ _action, error }) => {
    sendMessageToPopup({
      type: 'aiStatus',
      status: 'ошибка',
      message: `✗ Ошибка: ${error}`,
      level: 'error',
    });
  });
}

/**
 * Handle start recording
 */
function handleStartRecording() {
  try {
    actionRecorder.start();
    showRecordingIndicator(true);
    console.log('[AI-Autoclicker] Recording started');
  } catch (error) {
    console.error('[AI-Autoclicker] Failed to start recording:', error);
  }
}

/**
 * Handle stop recording
 */
function handleStopRecording() {
  try {
    actionRecorder.stop();
    showRecordingIndicator(false);
    console.log('[AI-Autoclicker] Recording stopped');
  } catch (error) {
    console.error('[AI-Autoclicker] Failed to stop recording:', error);
  }
}

/**
 * Handle play actions
 */
async function handlePlayActions(actions, speed = 1) {
  try {
    if (!Array.isArray(actions) || actions.length === 0) {
      throw new Error('No actions to play');
    }

    sendMessageToPopup({
      type: 'aiStatus',
      status: 'выполняю записанные действия',
      message: `▶ Начинаю воспроизведение ${actions.length} действий`,
    });

    await actionExecutor.executeSequence(actions, speed);
  } catch (error) {
    console.error('[AI-Autoclicker] Playback error:', error);
    sendMessageToPopup({
      type: 'aiStatus',
      status: 'ошибка',
      message: `✗ Ошибка воспроизведения: ${error.message}`,
      level: 'error',
    });
  }
}

/**
 * Handle start AI mode
 */
async function handleStartAIMode(instructions, geminiApiKey) {
  try {
    sendMessageToPopup({
      type: 'aiStatus',
      status: 'анализирую инструкции',
      message: '🤖 Анализирую инструкции...',
    });

    // Parse instructions
    const actions = await InstructionParser.parse(
      instructions,
      !!geminiApiKey,
      geminiApiKey,
      document.title,
    );

    sendMessageToPopup({
      type: 'aiLog',
      message: `📋 Разобрано ${actions.length} действий`,
      level: 'info',
    });

    // Execute actions
    sendMessageToPopup({
      type: 'aiStatus',
      status: 'выполняю действия',
      message: '▶ Начинаю выполнение действий...',
    });

    await actionExecutor.executeSequence(actions);
  } catch (error) {
    console.error('[AI-Autoclicker] AI mode error:', error);
    sendMessageToPopup({
      type: 'aiStatus',
      status: 'ошибка',
      message: `✗ Ошибка: ${error.message}`,
      level: 'error',
    });
  }
}

/**
 * Handle stop AI mode
 */
function handleStopAIMode() {
  try {
    actionExecutor.stop();
    console.log('[AI-Autoclicker] AI mode stopped');
  } catch (error) {
    console.error('[AI-Autoclicker] Failed to stop AI mode:', error);
  }
}

/**
 * ✅ Handle toggle Live Mode
 */
async function handleToggleLiveMode(apiKey) {
  try {
    if (!isLiveModeActive) {
      // Start Live Mode
      console.log('[LiveMode] Starting...');

      // Create overlay
      liveOverlay = new LiveModeOverlay();
      liveOverlay.show();

      // Setup overlay event listeners
      liveOverlay.on('stopAll', () => {
        handleToggleLiveMode(); // Stop everything
      });

      liveOverlay.on('toggleMic', () => {
        if (voiceInput) {
          if (voiceInput.isListening) {
            voiceInput.stop();
            liveOverlay.updateStatus('listening', 'Microphone muted');
          } else {
            startVoiceInput();
          }
        }
      });

      liveOverlay.on('toggleScreen', () => {
        chrome.runtime.sendMessage({ action: 'toggleScreenCapture' });
      });

      liveOverlay.on('close', () => {
        handleToggleLiveMode(); // Stop everything
      });

      // Start voice input
      await startVoiceInput();

      // Notify background to start
      chrome.runtime.sendMessage({
        action: 'startLiveMode',
        apiKey: apiKey,
      });

      isLiveModeActive = true;
      console.log('[LiveMode] Started successfully');
    } else {
      // Stop Live Mode
      console.log('[LiveMode] Stopping...');

      if (voiceInput) {
        voiceInput.stop();
        voiceInput = null;
      }

      if (liveOverlay) {
        liveOverlay.hide();
        liveOverlay = null;
      }

      // Notify background to stop
      chrome.runtime.sendMessage({ action: 'stopLiveMode' });

      isLiveModeActive = false;
      console.log('[LiveMode] Stopped');
    }
  } catch (error) {
    console.error('[LiveMode] Error:', error);
    if (liveOverlay) {
      liveOverlay.updateStatus('error', `Error: ${error.message}`);
    }
  }
}

/**
 * ✅ Start voice input
 */
async function startVoiceInput() {
  try {
    voiceInput = new VoiceInput();

    if (!voiceInput.isSupported()) {
      throw new Error('Voice input not supported in this browser');
    }

    await voiceInput.start(
      // onTranscript
      (transcript, isFinal) => {
        if (liveOverlay) {
          liveOverlay.updateUserTranscript(transcript);
        }

        if (isFinal) {
          // Send final transcript to background
          chrome.runtime.sendMessage({
            action: 'sendUserInput',
            text: transcript,
          });
        }
      },
      // onAudioChunk
      (audioBase64) => {
        // Send audio chunk to background
        chrome.runtime.sendMessage({
          action: 'sendUserInput',
          audio: audioBase64,
        });
      },
    );

    if (liveOverlay) {
      liveOverlay.updateStatus('listening', 'Listening...');
    }
  } catch (error) {
    console.error('[LiveMode] Voice input error:', error);
    throw error;
  }
}

/**
 * ✅ Handle Live Mode messages from background
 */
function handleLiveModeMessage(message) {
  if (!liveOverlay) return;

  switch (message.type) {
    case 'live-response-text':
      liveOverlay.updateAIResponse(message.text);
      break;

    case 'live-response-audio':
      playAudio(message.audio);
      break;

    case 'live-action':
      executeAIAction(message.action);
      break;

    case 'live-status':
      liveOverlay.updateStatus(message.status, message.message);
      break;

    case 'live-screenshot':
      liveOverlay.updateScreenPreview(message.screenshot);
      break;

    case 'live-bandwidth':
      liveOverlay.updateBandwidth(message.bytesPerSecond);
      break;

    case 'live-error':
      liveOverlay.updateStatus('error', message.message);
      break;
  }
}

/**
 * ✅ Play audio response
 */
function playAudio(audioBase64) {
  try {
    const audio = new Audio(`data:audio/pcm;base64,${audioBase64}`);
    audio.play();

    if (liveOverlay) {
      liveOverlay.updateStatus('speaking', 'AI is speaking...');
    }

    audio.onended = () => {
      if (liveOverlay) {
        liveOverlay.updateStatus('listening', 'Listening...');
      }
    };
  } catch (error) {
    console.error('[LiveMode] Audio playback error:', error);
  }
}

/**
 * ✅ Execute AI action with visual feedback
 */
async function executeAIAction(action) {
  try {
    const element = document.querySelector(action.selector);
    if (!element) {
      console.error('[LiveMode] Element not found:', action.selector);
      return;
    }

    // Visual highlight
    element.style.outline = '3px solid #4285f4';
    element.style.outlineOffset = '2px';

    // Wait 500ms for user to see
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Execute action
    await actionExecutor.executeAction(action);

    // Remove highlight
    element.style.outline = 'none';

    // Update overlay
    if (liveOverlay) {
      liveOverlay.addAction(action);
    }
  } catch (error) {
    console.error('[LiveMode] Action execution error:', error);
  }
}

/**
 * Show/hide recording indicator
 */
function showRecordingIndicator(show) {
  const indicatorId = 'ai-recording-indicator';
  let indicator = document.getElementById(indicatorId);

  if (show) {
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = indicatorId;
      indicator.innerHTML =
        '<span class="ai-recording-dot"></span>🔴 Запись...';
      document.body.appendChild(indicator);
    }
    indicator.style.display = 'flex';
  } else if (indicator) {
    indicator.style.display = 'none';
  }
}

/**
 * Send message to popup
 */
function sendMessageToPopup(message) {
  try {
    chrome.runtime.sendMessage(message).catch(() => {
      // Popup might be closed
    });
  } catch (error) {
    console.warn('[AI-Autoclicker] Failed to send message to popup:', error);
  }
}

/**
 * ✅ Setup playback message listeners
 */
function setupPlaybackListeners() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
      try {
        switch (request.type) {
          case PLAYBACK_MESSAGES.EXECUTE: {
            if (!playbackRenderer) {
              sendResponse({ success: false, error: 'Playback renderer not initialized' });
              return;
            }

            const result = await playbackRenderer.execute(request.action);
            
            // Send response back to background
            chrome.runtime.sendMessage({
              type: PLAYBACK_MESSAGES.EXECUTE,
              jobId: request.jobId,
              actionIndex: request.actionIndex,
              response: result,
            });

            sendResponse({ success: true });
            break;
          }

          case PLAYBACK_MESSAGES.STOP:
            if (playbackRenderer) {
              playbackRenderer.cleanup();
            }
            sendResponse({ success: true });
            break;

          case PLAYBACK_MESSAGES.PAUSE:
            // Pause is handled at the engine level
            sendResponse({ success: true });
            break;

          case PLAYBACK_MESSAGES.RESUME:
            // Resume is handled at the engine level
            sendResponse({ success: true });
            break;

          default:
            sendResponse({ success: false, error: 'Unknown playback message type' });
        }
      } catch (error) {
        console.error('[Playback] Message handler error:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep message channel open for async response
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
