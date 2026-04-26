import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const QUICK_QUESTIONS = {
  en: ['How to treat leaf blight?', 'Best fertilizer for tomatoes?', 'When to irrigate rice?'],
  hi: ['पत्ती झुलसा का इलाज?', 'टमाटर के लिए सबसे अच्छा खाद?', 'चावल में सिंचाई कब करें?'],
  kn: ['ಎಲೆ ಬ್ಲೈಟ್ ಚಿಕಿತ್ಸೆ?', 'ಟೊಮೇಟೋಗೆ ಉತ್ತಮ ಗೊಬ್ಬರ?', 'ಭತ್ತಕ್ಕೆ ನೀರು ಯಾವಾಗ?'],
};

// ── Chat via Backend (uses KEY_CHATBOT) ──────────────────────────────────────
async function askBackend(messages, language) {
  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, language }),
    });
    if (!res.ok) throw new Error(`Chat API error: ${res.status}`);
    const data = await res.json();
    return data.reply || 'Sorry, please try again.';
  } catch (err) {
    console.error('Chat error:', err);
    return "I'm having trouble connecting. Please check your connection.";
  }
}

// ── Voice Recording Hook ─────────────────────────────────────────────────────
function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);

  // Try Web Speech API first (browser-native, zero latency)
  const hasSpeechAPI = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startBrowserRecognition = (lang, onResult) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'hi' ? 'hi-IN' : lang === 'kn' ? 'kn-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setIsRecording(false);
      onResult(text);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    setIsRecording(true);
    return recognition;
  };

  // Fallback: record audio and send to backend /api/voice-to-text
  const startMediaRecording = async (lang, onResult) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunks.current = [];

      recorder.ondataavailable = (e) => chunks.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setIsTranscribing(true);
        try {
          const blob = new Blob(chunks.current, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');
          formData.append('language', lang);
          const res = await fetch(`${API_BASE}/api/voice-to-text`, {
            method: 'POST', body: formData,
          });
          const data = await res.json();
          if (data.text) onResult(data.text);
        } catch (err) {
          console.error('Transcription error:', err);
        }
        setIsTranscribing(false);
      };

      recorder.start();
      mediaRecorder.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Mic access denied:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop();
    }
    setIsRecording(false);
  };

  return { isRecording, isTranscribing, hasSpeechAPI, startBrowserRecognition, startMediaRecording, stopRecording };
}

// ── Component ────────────────────────────────────────────────────────────────
export default function AskAgent() {
  const { t, lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const voice = useVoiceRecorder();

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);
  useEffect(() => { if (isOpen && inputRef.current) setTimeout(() => inputRef.current?.focus(), 300); }, [isOpen]);

  // Auto-translate last message on language change
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'bot') {
      setMessages([{ role: 'bot', text: t('agent.greeting') }]);
    } else if (messages.length > 1 && !isTyping) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'bot') {
        const chatHistory = messages.slice(0, -1).map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));
        setIsTyping(true);
        askBackend(chatHistory, lang).then(reply => {
          setIsTyping(false);
          setMessages(prev => [...prev.slice(0, -1), { role: 'bot', text: reply }]);
        }).catch(() => setIsTyping(false));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) setMessages([{ role: 'bot', text: t('agent.greeting') }]);
  };

  const handleSend = async (text) => {
    const msgText = text || input.trim();
    if (!msgText) return;
    const userMsg = { role: 'user', text: msgText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages); setInput(''); setIsTyping(true);

    const chatHistory = newMessages.filter(m => m.role === 'user' || m.role === 'bot')
      .map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));

    const reply = await askBackend(chatHistory, lang);
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'bot', text: reply }]);
  };

  const handleVoice = () => {
    if (voice.isRecording) {
      if (recognitionRef.current?.abort) recognitionRef.current.abort();
      voice.stopRecording();
      return;
    }
    if (voice.hasSpeechAPI) {
      recognitionRef.current = voice.startBrowserRecognition(lang, (text) => {
        setInput(text);
        handleSend(text);
      });
    } else {
      voice.startMediaRecording(lang, (text) => {
        setInput(text);
        handleSend(text);
      });
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const quickQs = QUICK_QUESTIONS[lang] || QUICK_QUESTIONS.en;

  return (
    <>
      {!isOpen && (
        <button onClick={handleOpen} className="ask-agent-fab" aria-label="Ask AgriLens AI">
          <svg viewBox="0 0 24 24" fill="none" style={{ width: '1.5rem', height: '1.5rem' }} stroke="currentColor" strokeWidth="1.5">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="ask-agent-fab-pulse" />
        </button>
      )}

      {isOpen && (
        <div className="ask-agent-box">
          <div className="ask-agent-header">
            <div>
              <h3 className="ask-agent-title">{t('agent.title')}</h3>
              <p className="ask-agent-subtitle">{t('agent.subtitle')}</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="ask-agent-close" aria-label="Close chat">
              <svg viewBox="0 0 16 16" fill="none" style={{ width: '0.875rem', height: '0.875rem' }} stroke="currentColor" strokeWidth="2">
                <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="ask-agent-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`ask-agent-msg ${msg.role === 'user' ? 'ask-agent-msg-user' : 'ask-agent-msg-bot'}`}>
                {msg.text}
              </div>
            ))}
            {isTyping && (
              <div className="ask-agent-msg ask-agent-msg-bot">
                <span className="ask-agent-typing"><span /><span /><span /></span>
              </div>
            )}
            {messages.length <= 1 && !isTyping && (
              <div className="ask-agent-quick">
                {quickQs.map((q, i) => (
                  <button key={i} onClick={() => handleSend(q)} className="ask-agent-quick-btn">{q}</button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ask-agent-input-bar">
            {/* Voice Button */}
            <button
              onClick={handleVoice}
              className={`ask-agent-voice ${voice.isRecording ? 'recording' : ''}`}
              disabled={isTyping || voice.isTranscribing}
              aria-label={voice.isRecording ? 'Stop recording' : 'Voice input'}
              title={voice.isRecording ? 'Tap to stop' : 'Tap to speak'}
            >
              {voice.isTranscribing ? (
                <svg viewBox="0 0 16 16" style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} fill="currentColor">
                  <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="30" strokeDashoffset="10"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" style={{ width: '1.1rem', height: '1.1rem' }} stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="2" width="6" height="12" rx="3"/>
                  <path d="M5 10a7 7 0 0014 0M12 18v4M8 22h8" strokeLinecap="round"/>
                </svg>
              )}
            </button>

            <input
              ref={inputRef} type="text" value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={voice.isRecording ? '🎙 Listening...' : t('agent.placeholder')}
              className="ask-agent-input" disabled={isTyping || voice.isRecording}
            />
            <button onClick={() => handleSend()} disabled={!input.trim() || isTyping} className="ask-agent-send" aria-label="Send">
              <svg viewBox="0 0 16 16" fill="none" style={{ width: '1rem', height: '1rem' }} stroke="currentColor" strokeWidth="2">
                <path d="M14 2L7 9M14 2l-5 12-2-5-5-2 12-5z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
