/**
 * Main content script
 * Initializes and manages all content script functionality
 */

// Global instances
let elementFinder = null;
let actionRecorder = null;
let actionExecutor = null;

/**
 * Initialize content script
 */
function init() {
  try {
    elementFinder = new ElementFinder();
    actionRecorder = new ActionRecorder(elementFinder);
    actionExecutor = new ActionExecutor(elementFinder);

    setupMessageListeners();
    setupRecorderListeners();
    setupExecutorListeners();
  } catch (error) {
    console.error("[AI-Autoclicker] Initialization error:", error);
  }
}

/**
 * Setup message listeners for background communication
 */
function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
      switch (request.action) {
        case "startRecording":
          handleStartRecording();
          sendResponse({ success: true });
          break;

        case "stopRecording":
          handleStopRecording();
          sendResponse({ success: true });
          break;

        case "playActions":
          handlePlayActions(request.actions, request.speed);
          sendResponse({ success: true });
          break;

        case "startAIMode":
          handleStartAIMode(request.instructions, request.geminiApiKey);
          sendResponse({ success: true });
          break;

        case "stopAIMode":
          handleStopAIMode();
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: "Unknown action" });
      }
    } catch (error) {
      console.error("[AI-Autoclicker] Message handler error:", error);
      sendResponse({ success: false, error: error.message });
    }
  });
}

/**
 * Setup recorder event listeners
 */
function setupRecorderListeners() {
  actionRecorder.on("action-recorded", ({ action, count }) => {
    sendMessageToPopup({
      type: "actionRecorded",
      data: action,
      actionCount: count,
    });
  });

  actionRecorder.on("recording-started", () => {
    showRecordingIndicator(true);
  });

  actionRecorder.on("recording-stopped", ({ _actions }) => {
    showRecordingIndicator(false);
  });
}

/**
 * Setup executor event listeners
 */
function setupExecutorListeners() {
  actionExecutor.on("action-started", ({ action, index, total }) => {
    sendMessageToPopup({
      type: "aiLog",
      message: `▶ ${index + 1}/${total}: ${action.description || action.type}`,
      level: "info",
    });
  });

  actionExecutor.on("action-completed", ({ action }) => {
    sendMessageToPopup({
      type: "aiLog",
      message: `✓ Завершено: ${action.description || action.type}`,
      level: "success",
    });
  });

  actionExecutor.on("action-failed", ({ action, error }) => {
    sendMessageToPopup({
      type: "aiLog",
      message: `✗ Ошибка при ${action.description || action.type}: ${error}`,
      level: "error",
    });
  });

  actionExecutor.on("sequence-completed", ({ actionCount }) => {
    sendMessageToPopup({
      type: "aiStatus",
      status: "завершено успешно",
      message: `✓ Все ${actionCount} действий выполнены`,
      level: "success",
    });
  });

  actionExecutor.on("sequence-stopped", () => {
    sendMessageToPopup({
      type: "aiStatus",
      status: "остановлено",
      message: "⏸ Выполнение остановлено",
      level: "warn",
    });
  });

  actionExecutor.on("sequence-error", ({ _action, error }) => {
    sendMessageToPopup({
      type: "aiStatus",
      status: "ошибка",
      message: `✗ Ошибка: ${error}`,
      level: "error",
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
    console.log("[AI-Autoclicker] Recording started");
  } catch (error) {
    console.error("[AI-Autoclicker] Failed to start recording:", error);
  }
}

/**
 * Handle stop recording
 */
function handleStopRecording() {
  try {
    actionRecorder.stop();
    showRecordingIndicator(false);
    console.log("[AI-Autoclicker] Recording stopped");
  } catch (error) {
    console.error("[AI-Autoclicker] Failed to stop recording:", error);
  }
}

/**
 * Handle play actions
 */
async function handlePlayActions(actions, speed = 1) {
  try {
    if (!Array.isArray(actions) || actions.length === 0) {
      throw new Error("No actions to play");
    }

    sendMessageToPopup({
      type: "aiStatus",
      status: "выполняю записанные действия",
      message: `▶ Начинаю воспроизведение ${actions.length} действий`,
    });

    await actionExecutor.executeSequence(actions, speed);
  } catch (error) {
    console.error("[AI-Autoclicker] Playback error:", error);
    sendMessageToPopup({
      type: "aiStatus",
      status: "ошибка",
      message: `✗ Ошибка воспроизведения: ${error.message}`,
      level: "error",
    });
  }
}

/**
 * Handle start AI mode
 */
async function handleStartAIMode(instructions, geminiApiKey) {
  try {
    sendMessageToPopup({
      type: "aiStatus",
      status: "анализирую инструкции",
      message: "🤖 Анализирую инструкции...",
    });

    // Parse instructions
    const actions = await InstructionParser.parse(
      instructions,
      !!geminiApiKey,
      geminiApiKey,
      document.title,
    );

    sendMessageToPopup({
      type: "aiLog",
      message: `📋 Разобрано ${actions.length} действий`,
      level: "info",
    });

    // Execute actions
    sendMessageToPopup({
      type: "aiStatus",
      status: "выполняю действия",
      message: "▶ Начинаю выполнение действий...",
    });

    await actionExecutor.executeSequence(actions);
  } catch (error) {
    console.error("[AI-Autoclicker] AI mode error:", error);
    sendMessageToPopup({
      type: "aiStatus",
      status: "ошибка",
      message: `✗ Ошибка: ${error.message}`,
      level: "error",
    });
  }
}

/**
 * Handle stop AI mode
 */
function handleStopAIMode() {
  try {
    actionExecutor.stop();
    console.log("[AI-Autoclicker] AI mode stopped");
  } catch (error) {
    console.error("[AI-Autoclicker] Failed to stop AI mode:", error);
  }
}

/**
 * Show/hide recording indicator
 */
function showRecordingIndicator(show) {
  const indicatorId = "ai-recording-indicator";
  let indicator = document.getElementById(indicatorId);

  if (show) {
    if (!indicator) {
      indicator = document.createElement("div");
      indicator.id = indicatorId;
      indicator.innerHTML =
        '<span class="ai-recording-dot"></span>🔴 Запись...';
      document.body.appendChild(indicator);
    }
    indicator.style.display = "flex";
  } else if (indicator) {
    indicator.style.display = "none";
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
    console.warn("[AI-Autoclicker] Failed to send message to popup:", error);
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Handle dynamic imports
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    actionRecorder,
    actionExecutor,
    elementFinder,
  };
}
