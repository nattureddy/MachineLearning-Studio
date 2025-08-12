import React, { useState, useEffect, useRef } from 'react';
import { SendHorizontal, Bot, User, Moon, Sun, Trash, Copy, Info, Loader } from 'lucide-react';

// Utility for smooth delay/async
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper for color themes
const THEME_KEY = "chatbot-ui-theme";

// Simulated About text
const ABOUT_TEXT = `
ML Assistant: Your personable, privacy-focused chatbot for data science, ML, and research.
Tip: Try commands like /clear, /about, /help or ask about datasets, algorithms, or concepts!
`;

function getLocalTheme() {
  return localStorage.getItem(THEME_KEY) || "dark";
}

function setLocalTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

const DEFAULT_BOT_NAME = "ML Assistant";
const BOT_AVATAR = <Bot size={22} className="text-white" />;

// ---- Message Bubble Component ----
function MessageBubble({ message, onCopy, isDark }) {
  const isUser = message.role === "user";
  return (
    <div
      className={`group flex max-w-full relative mb-2 ${
        isUser ? "justify-end pr-2" : "justify-start pl-2"
      }`}
    >
      {!isUser && (
        <div className="flex-shrink-0 mr-2 mt-4">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md 
              ${isDark ? "bg-gradient-to-br from-blue-700 to-indigo-700" : "bg-gradient-to-br from-blue-500 to-indigo-400"}
            `}
          >
            {BOT_AVATAR}
          </div>
        </div>
      )}
      <div
        className={`relative min-w-0 max-w-[75vw] sm:max-w-[60vw] md:max-w-[48vw]
        transition-all duration-300
        ${
          isUser
            ? "bg-blue-700 text-white rounded-2xl rounded-br-sm shadow-xl"
            : "bg-zinc-800 text-blue-100 rounded-2xl rounded-bl-sm shadow-lg"
        }
        px-6 py-4
        break-words
        animate-fadeInSlide
        `}
      >
        <div className="text-base font-normal whitespace-pre-wrap select-text">
          {message.text}
        </div>
        {message.time && (
          <div
            className={`text-xs mt-2 opacity-70 ${
              isUser ? "text-blue-200" : "text-blue-400"
            }`}
          >
            {message.time}
          </div>
        )}
        {/* Copy button appears on hover */}
        <button
          onClick={() => onCopy(message.text)}
          className={`absolute -right-10 top-2 bg-black bg-opacity-0 hover:bg-opacity-30 p-2 rounded-full transition
          ${isUser ? "group-hover:block" : "group-hover:block"} hidden`}
          title="Copy"
        >
          <Copy size={16} className="text-blue-400" />
        </button>
        {/* Like/other icons can be added similarly */}
      </div>
      {isUser && (
        <div className="flex-shrink-0 ml-2 mt-4">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md
              ${isDark ? "bg-zinc-700" : "bg-gray-400"}
            `}
          >
            <User size={22} className="text-white" />
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Typing Indicator ----
function TypingIndicator({ isDark }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg
          ${isDark ? "bg-blue-900" : "bg-blue-600"}
        `}
      >
        <Bot size={22} className="text-white" />
      </div>
      <div
        className={`flex gap-2 px-5 py-3 rounded-2xl
          ${isDark ? "bg-zinc-800" : "bg-blue-100"}
        `}
      >
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></div>
        <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce delay-300"></div>
      </div>
    </div>
  );
}

// ---- Theme Switcher ----
function ThemeToggle({ theme, setTheme }) {
  return (
    <button
      aria-label="Toggle theme"
      className="absolute top-4 right-4 z-40 p-2 rounded-full bg-black/30 hover:bg-black/60 transition"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? <Sun size={22} className="text-yellow-300" /> : <Moon size={22} className="text-indigo-700" />}
    </button>
  );
}

// ---- Chatbot StatusBar ----
function StatusBar({ status, isDark }) {
  return (
    <div
      className={`w-full text-xs py-2 px-4 flex items-center gap-2 font-mono
        ${isDark ? "bg-zinc-900 text-blue-200" : "bg-blue-100 text-blue-700"}
      `}
      style={{ minHeight: 32 }}
    >
      <Loader
        className={`mr-2 ${status === "Connected" ? "text-green-400 animate-spin" : "text-red-400 animate-none"}`}
        size={16}
      />
      {status === "Connected"
        ? "Connected to AI server"
        : status === "Error"
        ? "Server error. Try again later."
        : status}
    </div>
  );
}

// ---- About/Help Panel ----
function InfoPanel({ show, onClose, isDark }) {
  if (!show) return null;
  return (
    <div
      className={`fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center`}
      onClick={onClose}
    >
      <div
        className={`bg-zinc-900 rounded-xl shadow-2xl p-8 max-w-md mx-4 border border-blue-500 relative`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-blue-400 mb-3 flex items-center">
          <Info className="mr-2" /> About & Help
        </h2>
        <pre className="text-blue-100 text-sm whitespace-pre-wrap">{ABOUT_TEXT}</pre>
        <button
          className="absolute top-3 right-4 text-blue-400 font-bold text-lg"
          onClick={onClose}
        >×</button>
      </div>
    </div>
  );
}

// ---- Main Chatbot Component ----
const AIChatbot = () => {
  const [theme, setTheme] = useState(getLocalTheme());
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("Connected");
  const [botName, setBotName] = useState(DEFAULT_BOT_NAME);
  const [showAbout, setShowAbout] = useState(false);
  const chatWindowRef = useRef(null);

  // ---- Theme persistence ----
  useEffect(() => {
    document.body.className = theme === "dark" ? "bg-zinc-950" : "bg-blue-50";
    setLocalTheme(theme);
  }, [theme]);

  // ---- Initial greeting ----
  useEffect(() => {
    setChatHistory([
      {
        role: 'model',
        text: `Hello! I am your personal Machine Learning assistant. How can I help you with your project today?\nI can assist with data analysis, modeling, and explaining concepts.\nType /about for help.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  }, []);

  // ---- Auto scroll ----
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTo({
        top: chatWindowRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatHistory, isLoading]);

  // ---- Message copy action ----
  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      alert("Failed to copy message!");
    }
  };

  // ---- Message send handler ----
  const handleSend = async (e) => {
    e.preventDefault();
    const trimmedInput = userInput.trim();
    if (!trimmedInput) return;

    // Handle quick commands before sending to backend
    if (trimmedInput === "/clear") {
      setChatHistory([]);
      setUserInput('');
      return;
    }
    if (trimmedInput === "/about" || trimmedInput === "/help") {
      setShowAbout(true);
      setUserInput('');
      return;
    }

    const newUserMessage = {
      role: 'user',
      text: trimmedInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const updatedChatHistory = [...chatHistory, newUserMessage];
    setChatHistory(updatedChatHistory);
    setUserInput('');
    setIsLoading(true);

    try {
      setStatus("Connected");
      const response = await fetch('https://machinelearning-studio-1.onrender.com/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatHistory: updatedChatHistory }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      await sleep(400); // Simulate typing delay for realism
      setChatHistory(currentHistory => [
        ...currentHistory,
        {
          role: 'model',
          text: data.message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } catch (error) {
      setStatus("Error");
      setChatHistory(currentHistory => [
        ...currentHistory,
        {
          role: 'model',
          text: "Sorry, I am unable to connect to the server at the moment. Please try again later.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Keyboard shortcut: Enter sends, Shift+Enter adds newline ----
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSend(e);
    }
  };

  // ---- Conversation reset ----
  const handleClear = () => {
    setChatHistory([
      {
        role: 'model',
        text: `Conversation cleared!\nHow can I help you now?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
    setStatus("Connected");
    setUserInput('');
  };

  // ---- Bot name edit ----
  const [editingBotName, setEditingBotName] = useState(false);
  const [newBotName, setNewBotName] = useState(botName);

  // ---- Responsiveness: for mobile ----
  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen flex flex-col font-sans transition
      ${isDark ? "bg-zinc-950 text-blue-100" : "bg-blue-50 text-zinc-800"}
      `}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-30 w-full
          ${isDark ? "bg-zinc-900 shadow-lg" : "bg-blue-200 shadow-md"}
        `}
        style={{ minHeight: 74 }}
      >
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-2xl sm:text-3xl text-blue-400 tracking-tighter">{botName}</span>
            <button
              className="ml-2 text-xs px-2 py-1 bg-blue-900 bg-opacity-30 rounded hover:bg-opacity-50 transition"
              onClick={() => setEditingBotName(true)}
              title="Edit bot name"
              style={{ display: editingBotName ? "none" : "inline-block" }}
            >
              edit
            </button>
            {editingBotName &&
              <input
                autoFocus
                type="text"
                value={newBotName}
                onChange={e => setNewBotName(e.target.value)}
                onBlur={() => {
                  setEditingBotName(false);
                  setBotName(newBotName || DEFAULT_BOT_NAME);
                }}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    setEditingBotName(false);
                    setBotName(newBotName || DEFAULT_BOT_NAME);
                  }
                }}
                className="bg-blue-800 text-blue-100 px-2 py-1 rounded text-xs border-0 outline-none"
                style={{ width: 90 }}
              />
            }
          </div>
          {/* Info/about shortcut */}
          <button
            className="ml-2 px-3 py-1 rounded bg-blue-900 text-blue-200 text-xs hover:bg-blue-700"
            onClick={() => setShowAbout(true)}
          >
            <Info className="inline mr-1" size={14} /> About
          </button>
        </div>
        <ThemeToggle theme={theme} setTheme={setTheme} />
        <StatusBar status={status} isDark={isDark} />
      </header>

      {/* Chat Window */}
      <main
        ref={chatWindowRef}
        className={`flex-grow overflow-y-auto px-2 py-4 flex flex-col space-y-1
          ${isDark ? "scrollbar-dark" : "scrollbar-light"}
        `}
        aria-live="polite"
        style={{ minHeight: 350 }}
      >
        {chatHistory.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} onCopy={handleCopy} isDark={isDark} />
        ))}
        {isLoading && <TypingIndicator isDark={isDark} />}
      </main>

      {/* Input bar with actions */}
      <form
        onSubmit={handleSend}
        className={`sticky bottom-0 z-40 w-full bg-opacity-80
          ${isDark ? "bg-zinc-900 border-t border-blue-800" : "bg-blue-100 border-t border-blue-300"}
          flex items-center gap-2 px-4 py-3 shadow-2xl`}
        style={{ minHeight: 54 }}
      >
        <input
          type="text"
          placeholder="Type a message... (/clear, /help, Shift+Enter = newline)"
          className={`flex-grow px-5 py-3 rounded-full outline-none border-0 font-medium text-base transition
            ${
              isDark
                ? "bg-zinc-800 text-blue-100 placeholder-blue-400 focus:ring-2 focus:ring-blue-700"
                : "bg-blue-50 text-zinc-800 placeholder-blue-600 focus:ring-2 focus:ring-blue-400"
            }
          `}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          autoComplete="off"
          aria-label="Enter your message"
          rows={1}
        />
        <button
          type="submit"
          disabled={isLoading || !userInput.trim()}
          aria-label="Send message"
          className={`ml-1 rounded-full p-3 transition-transform duration-200
            ${isLoading || !userInput.trim()
              ? "bg-gray-400 cursor-not-allowed"
              : isDark
              ? "bg-blue-800 hover:bg-blue-700 active:scale-95"
              : "bg-blue-600 hover:bg-blue-700 active:scale-95"
            }
            text-white flex items-center justify-center shadow-md`}
          title="Send"
        >
          <SendHorizontal size={24} />
        </button>
        <button
          type="button"
          className={`mx-1 rounded-lg p-2 text-xs font-semibold
            ${isDark ? "bg-zinc-800 text-blue-300 hover:bg-blue-900" : "bg-blue-100 text-blue-600 hover:bg-blue-200"}
          `}
          title="Clear Conversation"
          onClick={handleClear}
          disabled={isLoading}
        >
          <Trash size={16} className="inline mr-1" /> Clear
        </button>
      </form>

      {/* About/Help Modal */}
      <InfoPanel show={showAbout} onClose={() => setShowAbout(false)} isDark={isDark} />

      {/* Styles for animations & scrollbar */}
      <style jsx>{`
        @keyframes fadeInSlide {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInSlide {
          animation: fadeInSlide 0.33s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .scrollbar-dark::-webkit-scrollbar {
          width: 6px;
          background: #282a33;
        }
        .scrollbar-dark::-webkit-scrollbar-thumb {
          background: #242635;
          border-radius: 6px;
        }
        .scrollbar-light::-webkit-scrollbar {
          width: 6px;
          background: #cfdfff;
        }
        .scrollbar-light::-webkit-scrollbar-thumb {
          background: #89a8e6;
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
};

export default AIChatbot;
