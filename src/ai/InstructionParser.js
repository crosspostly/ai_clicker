/**
 * Unified instruction parser for both Gemini AI and fallback parsing
 * Updated to use Gemini 2.0/2.5 Flash (Nov 2025)
 */

// Gemini model priority: 2.0 Flash Experimental → 2.0 Flash GA → 1.5 Flash → 1.5 Pro
const GEMINI_MODELS = [
  'gemini-2.0-flash-exp',     // Experimental (best performance)
  'gemini-2.0-flash-001',     // GA (stable)
  'gemini-1.5-flash',         // Fallback
  'gemini-1.5-pro',            // Last resort
];

// Export action types for external use
export const ACTION_TYPES = {
  CLICK: 'click',
  INPUT: 'input',
  SELECT: 'select',
  SCROLL: 'scroll',
  WAIT: 'wait',
  HOVER: 'hover',
  DOUBLE_CLICK: 'double_click',
  RIGHT_CLICK: 'right_click',
};

export class InstructionParser {
  /**
   * Parse instructions using AI or fallback method
   */
  static async parse(
    instructions,
    useGemini = false,
    geminiApiKey = null,
    pageContext = '',
  ) {
    try {
      if (useGemini && geminiApiKey) {
        return await this.parseWithGemini(
          instructions,
          geminiApiKey,
          pageContext,
        );
      }
    } catch (error) {
      console.warn(
        'Gemini parsing failed, falling back to rule-based parser:',
        error,
      );
    }

    return this.parseWithFallback(instructions);
  }

  /**
   * Parse using Gemini API with automatic model fallback
   */
  static async parseWithGemini(instructions, apiKey, pageContext = '') {
    const systemPrompt = `Ты - ассистент автоматизации веб-действий. 
Пользователь дает инструкции на естественном языке. 
Твоя задача разбить инструкции на точные действия в формате JSON.

Ответь ТОЛЬКО JSON массивом действий, без дополнительного текста.
Каждое действие должно иметь:
{
  "type": "click|input|select|scroll|wait|hover|double_click|right_click",
  "target": "описание элемента или текст кнопки",
  "value": "для input - текст для ввода",
  "description": "краткое описание действия на русском"
}`;

    const userMessage = `Контекст страницы: ${pageContext || 'неизвестен'}

Инструкции пользователя: ${instructions}

Разбей эти инструкции на точные действия.`;

    const payload = {
      contents: [
        {
          parts: [
            {
              text: systemPrompt + '\n\n' + userMessage,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_NONE',
        },
      ],
    };

    // Try models in priority order: 2.0 → 2.5 Flash → 2.5 Pro
    let lastError = null;
    
    for (const model of GEMINI_MODELS) {
      try {
        console.log(`[InstructionParser] Attempting model: ${model}`);
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok) {
          const error = await response.json();
          lastError = new Error(
            `${model}: ${error.error?.message || response.statusText}`,
          );
          console.warn(`[InstructionParser] ❌ ${model} failed:`, lastError.message);
          continue; // Try next model
        }

        const data = await response.json();
        const responseText = data.candidates[0]?.content?.parts[0]?.text || '';

        console.log(`[InstructionParser] ✅ SUCCESS with model: ${model}`);
        
        try {
          const jsonMatch = responseText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        } catch (parseError) {
          console.error('[InstructionParser] Failed to parse JSON response:', parseError);
          throw new Error('Invalid JSON response from Gemini');
        }
        
      } catch (error) {
        lastError = error;
        console.warn(`[InstructionParser] ❌ ${model} error:`, error.message);
        // Continue to next model
      }
    }
    
    // All models failed - throw comprehensive error
    throw new Error(
      'Все модели Gemini не сработали. ' +
      `Последняя ошибка: ${lastError?.message || 'Неизвестно'}. ` +
      `Пробовали: ${GEMINI_MODELS.join(', ')}. ` +
      'Проверьте API ключ или используйте ручной режим.',
    );
  }

  /**
   * Parse using rule-based fallback method
   */
  static parseWithFallback(instructions) {
    const actions = [];
    const lines = instructions.split('\n').filter((l) => l.trim());

    for (const line of lines) {
      const lower = line.toLowerCase();

      // Click action
      if (lower.includes('клик') || lower.includes('нажми')) {
        const match = line.match(/'([^']+)'|"([^"]+)"|«([^«]+)»/);
        const text = match ? match[1] || match[2] || match[3] : line;
        if (text && text.trim().length > 0) {
          actions.push({
            type: 'click',
            target: text.trim(),
            description: `Клик на "${text.trim()}"`,
          });
        }
      }

      // Input action
      if (lower.includes('введи') || lower.includes('ввод')) {
        const match = line.match(/'([^']+)'|"([^"]+)"|«([^«]+)»/);
        const text = match ? match[1] || match[2] || match[3] : '';
        if (text) {
          actions.push({
            type: 'input',
            value: text,
            description: `Введи: "${text}"`,
          });
        }
      }

      // Hover action
      if (lower.includes('наведи') || lower.includes('наведение')) {
        const match = line.match(/'([^']+)'|"([^"]+)"|«([^«]+)»/);
        const text = match ? match[1] || match[2] || match[3] : '';
        if (text) {
          actions.push({
            type: 'hover',
            target: text,
            description: `Наведение на "${text}"`,
          });
        }
      }

      // Double click action
      if (lower.includes('двойной клик') || lower.includes('двойное нажатие')) {
        const match = line.match(/'([^']+)'|"([^"]+)"|«([^«]+)»/);
        const text = match ? match[1] || match[2] || match[3] : '';
        if (text) {
          actions.push({
            type: 'double_click',
            target: text,
            description: `Двойной клик на "${text}"`,
          });
        }
      }

      // Right click action
      if (lower.includes('правый клик') || lower.includes('контекстное меню')) {
        const match = line.match(/'([^']+)'|"([^"]+)"|«([^«]+)»/);
        const text = match ? match[1] || match[2] || match[3] : '';
        if (text) {
          actions.push({
            type: 'right_click',
            target: text,
            description: `Правый клик на "${text}"`,
          });
        }
      }

      // Scroll action
      if (lower.includes('прокрут')) {
        const match = line.match(/(\d+)/);
        const pixels = match ? parseInt(match[1]) : 400;
        actions.push({
          type: 'scroll',
          pixels,
          description: `Прокрутка на ${pixels}px`,
        });
      }

      // Wait action
      if (lower.includes('жди') || lower.includes('ожид')) {
        const match = line.match(/(\d+)/);
        const duration = match ? parseInt(match[1]) * 1000 : 2000;
        actions.push({
          type: 'wait',
          duration,
          description: `Ожидание ${duration}ms`,
        });
      }

      // Select action
      if (lower.includes('выбери') || lower.includes('выбрать')) {
        const match = line.match(/'([^']+)'|"([^"]+)"|«([^«]+)»/);
        const text = match ? match[1] || match[2] || match[3] : '';
        if (text) {
          actions.push({
            type: 'select',
            value: text,
            description: `Выбрать "${text}"`,
          });
        }
      }
    }

    return actions;
  }

  /**
   * Validate parsed actions
   */
  static validateActions(actions) {
    if (!Array.isArray(actions)) {
      throw new Error('Actions must be an array');
    }

    const validTypes = [
      'click',
      'input',
      'hover',
      'scroll',
      'wait',
      'select',
      'double_click',
      'right_click',
    ];

    for (const action of actions) {
      if (!action.type || !validTypes.includes(action.type)) {
        throw new Error(`Invalid action type: ${action.type}`);
      }
    }

    return true;
  }

  /**
   * Merge duplicate actions
   */
  static mergeDuplicates(actions) {
    const merged = [];
    let previousAction = null;

    for (const action of actions) {
      if (
        previousAction &&
        previousAction.type === action.type &&
        previousAction.target === action.target &&
        previousAction.value === action.value
      ) {
        // Skip duplicate
        continue;
      }
      merged.push(action);
      previousAction = action;
    }

    return merged;
  }

  /**
   * Optimize action sequence (remove unnecessary waits, etc.)
   */
  static optimizeSequence(actions) {
    const optimized = [];

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const nextAction = actions[i + 1];

      // Remove consecutive wait actions, keep only the longest
      if (action.type === 'wait' && nextAction && nextAction.type === 'wait') {
        continue;
      }

      // Remove wait if very short
      if (action.type === 'wait' && action.duration < 100) {
        continue;
      }

      optimized.push(action);
    }

    return optimized;
  }
}
