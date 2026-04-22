import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendChatMessage, clearMessages } from '../redux/slices/aiSlice';

const AIChat = () => {
  const dispatch = useDispatch();
  const { messages, sessionId, loading } = useSelector((state) => state.ai);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const message = input.trim();
    setInput('');
    
    await dispatch(sendChatMessage({ message, sessionId }));
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      dispatch(clearMessages());
    }
  };

  const suggestedPrompts = [
    'What tasks should I focus on today?',
    'Help me organize my upcoming tasks',
    'Give me productivity tips',
    'What are my overdue tasks?',
  ];

  const handleSuggestedPrompt = (prompt) => {
    setInput(prompt);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-4rem)]">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🤖 AI Assistant</h1>
            <p className="text-gray-600">Ask me anything about your tasks and productivity</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Clear Chat
            </button>
          )}
        </div>

        {/* Chat Container */}
        <div className="flex-1 bg-white rounded-lg shadow-md flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Start a conversation
                </h3>
                <p className="text-gray-500 mb-6">
                  Ask me about your tasks, productivity tips, or anything else!
                </p>
                
                {/* Suggested Prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                  {suggestedPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedPrompt(prompt)}
                      className="p-3 text-sm text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p
                        className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Form */}
          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="input-field flex-1"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              💡 Tip: Ask about your tasks, request productivity advice, or get AI-powered suggestions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;