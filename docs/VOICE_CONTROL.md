# Voice Control System

The Voice Control system enables hands-free automation of web pages using natural language commands powered by Google Gemini Live API.

## Overview

Voice Control transforms spoken commands into executable browser actions, providing a seamless hands-free automation experience. The system supports multiple languages, real-time transcription, and intelligent command parsing.

## Features

- **Real-time Voice Streaming**: Continuous audio streaming with low latency
- **Multi-language Support**: English, Russian, and auto-detection
- **Intelligent Command Parsing**: Natural language to action conversion
- **Fallback Chain**: Multiple Gemini models for maximum reliability
- **Audio Feedback**: Visual and audio confirmation of commands
- **Error Recovery**: Graceful handling of network issues and misunderstandings

## Setup

### Prerequisites

1. **Google Gemini API Key**: Required for voice processing
2. **Microphone Permission**: Browser must have microphone access
3. **HTTPS Environment**: Required for Web Audio API

### Configuration

1. Open Extension Settings → Voice tab
2. Enter your Gemini API key
3. Select preferred language (English, Russian, or Auto-detect)
4. Choose voice model (Auto recommended)
5. Test microphone and API connection

## Voice Commands

### Basic Actions

#### Click Commands
```
"click the submit button"
"нажми кнопку отправки"
"click on login"
"кликни по входу"
```

#### Input Commands
```
"type hello world in the search box"
"введи привет мир в поле поиска"
"fill in the email field with user@example.com"
"заполни поле email значением user@example.com"
```

#### Scroll Commands
```
"scroll down"
"прокрути вниз"
"scroll up"
"прокрути вверх"
"scroll to the bottom"
"прокрути вниз до конца"
```

#### Double and Right Click
```
"double click the file"
"двойной клик по файлу"
"right click on the image"
"правый клик по изображению"
```

#### Wait Commands
```
"wait 2 seconds"
"подожди 2 секунды"
"pause for a moment"
"сделай паузу"
```

### Complex Commands

#### Sequential Actions
```
"click the login button then type admin in the username field"
"нажми кнопку входа, затем введи admin в поле имени"
"scroll down, click the first link, then wait"
"прокрути вниз, кликни первую ссылку, потом подожди"
```

#### Context-aware Commands
```
"click the blue submit button"
"нажми синюю кнопку отправки"
"type my password in the password field"
"введи мой пароль в поле пароля"
```

## Language Support

### English Commands
- Natural language processing
- Contextual understanding
- Flexible phrasing
- Synonym support

### Russian Commands
- Native Russian processing
- Grammatical variations
- Cultural context
- Cyrillic support

### Auto-detection
- Automatic language identification
- Mixed language support
- Adaptive processing
- Fallback to English

## Technical Architecture

### Audio Processing Pipeline

1. **Microphone Capture**: Web Audio API captures audio stream
2. **Audio Encoding**: Real-time audio compression and encoding
3. **API Streaming**: Continuous streaming to Gemini Live
4. **Transcription**: Real-time speech-to-text conversion
5. **Command Parsing**: Natural language to structured commands
6. **Action Execution**: Command translation to browser actions
7. **Feedback Loop**: Visual and audio confirmation

### Message Flow

```
Microphone → AudioContext → VoiceHandler → GeminiLive → CommandParser → PlaybackEngine → ContentScript → DOM
     ↑                                                                 ↓
Audio Feedback ← VoiceHandler ← Background ← ContentScript ← Action Results
```

### Components

#### VoiceHandler (`src/background/voiceHandler.js`)
- Manages voice sessions
- Handles audio streaming
- Coordinates with Gemini Live
- Maintains command history

#### GeminiLiveService (`src/services/geminiLive.js`)
- API communication
- Fallback chain management
- Error handling and retry logic
- Response processing

#### VoicePlaybackIntegration (`src/services/voicePlaybackIntegration.js`)
- Command-to-action conversion
- Playback engine coordination
- Queue management
- State synchronization

## API Reference

### VoiceHandler Methods

#### `startVoiceSession(options)`
Starts a new voice session.

```javascript
const result = await voiceHandler.startVoiceSession({
  tabId: 123,
  language: 'en',
  model: 'auto'
});
```

**Parameters:**
- `options.tabId` (number): Target tab ID
- `options.language` (string): Language code ('en', 'ru', 'auto')
- `options.model` (string): Gemini model ('auto', 'gemini-2.0-flash-exp', etc.)

**Returns:** Promise<{ success: boolean, sessionId?: string }>

#### `stopVoiceSession()`
Stops the current voice session.

```javascript
await voiceHandler.stopVoiceSession();
```

#### `processAudioData(audioData)`
Processes raw audio data.

```javascript
const result = await voiceHandler.processAudioData(audioBuffer);
```

### GeminiLiveService Methods

#### `initialize(apiKey, settings)`
Initializes the Gemini Live connection.

```javascript
const result = await geminiLive.initialize(apiKey, {
  model: 'auto',
  language: 'en'
});
```

#### `streamAudio(audioData)`
Streams audio data for processing.

```javascript
const response = await geminiLive.streamAudio(audioData);
```

**Returns:**
```javascript
{
  transcription: string,
  command: {
    type: string,
    target?: string,
    text?: string,
    direction?: string,
    amount?: number,
    duration?: number
  },
  confidence: number
}
```

### Command Types

#### Click Command
```javascript
{
  type: 'click',
  target: string,  // CSS selector or description
  confidence: number
}
```

#### Input Command
```javascript
{
  type: 'input',
  target: string,   // CSS selector or description
  text: string,     // Text to type
  confidence: number
}
```

#### Scroll Command
```javascript
{
  type: 'scroll',
  direction: 'up' | 'down' | 'left' | 'right',
  amount?: number,  // Pixels to scroll
  confidence: number
}
```

#### Wait Command
```javascript
{
  type: 'wait',
  duration: number,  // Milliseconds
  confidence: number
}
```

## Error Handling

### Common Errors

#### Microphone Permission Denied
```
Error: Microphone permission denied
Solution: Grant microphone permission in browser settings
```

#### API Key Invalid
```
Error: Invalid API key
Solution: Verify Gemini API key in settings
```

#### Network Connection Failed
```
Error: Network connection failed
Solution: Check internet connection and try again
```

#### Speech Not Recognized
```
Error: Speech not recognized
Solution: Speak clearly and reduce background noise
```

### Recovery Strategies

#### Automatic Retry
- Failed commands are automatically retried
- Different Gemini models are tried in sequence
- Exponential backoff for network errors

#### Fallback Commands
- Ambiguous commands prompt for clarification
- Failed actions suggest alternative phrasing
- Context-aware suggestions provided

#### Error Feedback
- Visual error indicators
- Audio error notifications
- Detailed error messages in console

## Performance Optimization

### Latency Reduction
- Real-time audio streaming
- Local command caching
- Predictive text processing
- Optimized API calls

### Resource Management
- Automatic cleanup of audio streams
- Memory-efficient audio buffering
- Connection pooling
- Garbage collection optimization

### Network Efficiency
- Compressed audio transmission
- Batched API requests
- Intelligent retry logic
- Connection reuse

## Troubleshooting

### Voice Recognition Issues

#### Poor Accuracy
1. Check microphone quality
2. Reduce background noise
3. Speak clearly and at moderate pace
4. Try different language settings
5. Use more specific command phrasing

#### No Response
1. Verify microphone permission
2. Check API key validity
3. Test internet connection
4. Restart voice session
5. Clear browser cache

### Audio Problems

#### No Sound
1. Check system volume
2. Verify audio permissions
3. Test with different browser
4. Check audio hardware
5. Update audio drivers

#### Echo/Feedback
1. Use headphones
2. Reduce microphone volume
3. Move away from speakers
4. Enable echo cancellation
5. Adjust audio settings

### API Issues

#### Rate Limiting
1. Check API quota usage
2. Implement request throttling
3. Use higher tier plan
4. Optimize command frequency
5. Cache frequent responses

#### Model Failures
1. Check model availability
2. Try fallback models
3. Update API configuration
4. Contact support if persistent
5. Monitor service status

## Best Practices

### Command Phrasing
- Be specific and clear
- Use consistent terminology
- Include context when helpful
- Avoid ambiguous language
- Use natural speech patterns

### Environment Setup
- Quiet environment for better accuracy
- Good quality microphone
- Stable internet connection
- Updated browser version
- Proper permissions granted

### Performance Tips
- Use shorter commands when possible
- Group related actions
- Avoid unnecessary repetition
- Monitor API usage
- Optimize network conditions

## Advanced Usage

### Custom Commands
Create custom voice commands for specific workflows:

```javascript
// Custom command registration
voiceHandler.registerCommand('login', async (params) => {
  await executeCommand({ type: 'click', target: '#username' });
  await executeCommand({ type: 'input', target: '#username', text: params.username });
  await executeCommand({ type: 'input', target: '#password', text: params.password });
  await executeCommand({ type: 'click', target: '#login-button' });
});

// Usage: "login with username admin and password secret"
```

### Multi-tab Control
Control multiple tabs with voice commands:

```javascript
// Tab switching commands
"switch to the second tab"
"переключись на вторую вкладку"
"open new tab"
"открой новую вкладку"
"close current tab"
"закрой текущую вкладку"
```

### Integration with Other Systems
Combine voice control with other extension features:

```javascript
// Voice + Recording
"start recording and click the submit button"

// Voice + Playback
"replay the last recorded sequence"

// Voice + Settings
"enable dark theme and increase playback speed"
```

## Security Considerations

### API Key Protection
- API keys stored securely in Chrome storage
- No keys exposed in source code
- Encrypted transmission to API
- Regular key rotation recommended

### Privacy Protection
- Audio data processed securely
- No audio data stored locally
- Transient processing only
- GDPR compliant handling

### Permission Management
- Minimal required permissions
- Granular access control
- User consent required
- Transparent data usage

## Future Enhancements

### Planned Features
- Additional language support
- Custom voice training
- Advanced command chaining
- Context-aware suggestions
- Voice biometrics

### Technical Improvements
- Lower latency processing
- Better noise cancellation
- Enhanced accuracy
- Offline mode support
- Voice shortcuts

## Support

### Documentation
- [API Reference](#api-reference)
- [Troubleshooting Guide](#troubleshooting)
- [Best Practices](#best-practices)
- [Examples](#examples)

### Community
- [GitHub Issues](https://github.com/crosspostly/ai-autoclicker/issues)
- [Discussions](https://github.com/crosspostly/ai-autoclicker/discussions)
- [Wiki](https://github.com/crosspostly/ai-autoclicker/wiki)

### Contact
- Email: support@ai-autoclicker.com
- Discord: [Community Server](https://discord.gg/ai-autoclicker)
- Twitter: [@AIAutoclicker](https://twitter.com/AIAutoclicker)

---

**Voice Control System v3.0.0** - Transform your browsing experience with the power of voice! 🎤