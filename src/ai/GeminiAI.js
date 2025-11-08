/**
 * GeminiAI - Integration with Google Gemini API
 */

class GeminiAI {
  static API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

  constructor(apiKey) {
    this.apiKey = apiKey;
    this.model = 'gemini-pro';
  }

  /**
   * Validate API key format
   * @param {string} key - API key
   * @returns {boolean}
   */
  static validateKey(key) {
    return key && key.length === 39 && key.startsWith('AIza');
  }

  /**
   * Generate content using Gemini API
   * @param {string} prompt - Prompt text
   * @returns {Promise<string>} Generated content
   * @throws {Error} If API call fails
   */
  async generate(prompt) {
    if (!this.apiKey) {
      throw new Error('API key not set');
    }

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid prompt');
    }

    try {
      const response = await fetch(`${GeminiAI.API_ENDPOINT}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from API');
      }

      const content = data.candidates[0].content.parts[0].text;
      return content;
    } catch (error) {
      Logger.error('GeminiAI', 'Generation failed', error);
      throw error;
    }
  }

  /**
   * Parse instructions to actions
   * @param {string} instructions - User instructions
   * @returns {Promise<Array>} Parsed actions
   */
  async parseInstructions(instructions) {
    const prompt = `Parse the following web automation instructions and convert them to a JSON array of action objects. Each action must have 'type' (click, input, select, scroll, wait, double_click, right_click, hover) and 'selector' (CSS selector). Return ONLY valid JSON.

Instructions: "${instructions}"

Format example:
[
  {"type": "click", "selector": "button.submit"},
  {"type": "input", "selector": "#email", "value": "user@example.com"}
]

Return only the JSON array, no other text.`;

    const response = await this.generate(prompt);

    try {
      const actions = JSON.parse(response);
      if (!Array.isArray(actions)) {
        throw new Error('Response is not an array');
      }
      return actions;
    } catch (error) {
      Logger.error('GeminiAI', 'Failed to parse response', error);
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  /**
   * Analyze webpage for suggestions
   * @param {string} pageContent - Webpage content
   * @returns {Promise<string>} Analysis results
   */
  async analyzeWebpage(pageContent) {
    const prompt = `Analyze this webpage content and suggest possible automation actions. Be concise.

Content: ${pageContent.substring(0, 2000)}`;

    return this.generate(prompt);
  }

  /**
   * Test API connection
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection() {
    try {
      await this.generate('Hello');
      return true;
    } catch (error) {
      Logger.error('GeminiAI', 'Connection test failed', error);
      return false;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GeminiAI;
}
