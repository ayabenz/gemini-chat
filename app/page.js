"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Settings, Plus, MessageSquare, Trash2, Send, ChevronDown, 
  Menu, X, Key, Server, Cpu, Sparkles, Check, Edit2, ExternalLink
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Home() {
  // State for Gateways & Models
  const [gateways, setGateways] = useState([
    {
      id: "gw-default-openai",
      name: "OpenAI Official",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "",
      models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"]
    },
    {
      id: "gw-default-openrouter",
      name: "OpenRouter",
      baseUrl: "https://openrouter.ai/api/v1",
      apiKey: "",
      models: ["anthropic/claude-3.5-sonnet", "deepseek/deepseek-chat", "google/gemini-pro-1.5"]
    }
  ]);

  // Active configuration
  const [activeGatewayId, setActiveGatewayId] = useState("gw-default-openai");
  const [activeModel, setActiveModel] = useState("gpt-4o-mini");

  // Chats State
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // UI Modals & Menus
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // Settings tab management
  const [newGwName, setNewGwName] = useState("");
  const [newGwUrl, setNewGwUrl] = useState("");
  const [newGwKey, setNewGwKey] = useState("");
  const [newGwModels, setNewGwModels] = useState("");
  const [editingGwId, setEditingGwId] = useState(null);

  const messagesEndRef = useRef(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedGw = localStorage.getItem("gemini_gateways");
    const savedChats = localStorage.getItem("gemini_chats");
    const savedActiveGw = localStorage.getItem("gemini_active_gw");
    const savedActiveModel = localStorage.getItem("gemini_active_model");

    if (savedGw) {
      try { setGateways(JSON.parse(savedGw)); } catch(e){}
    }
    if (savedChats) {
      try { setChats(JSON.parse(savedChats)); } catch(e){}
    }
    if (savedActiveGw) setActiveGatewayId(savedActiveGw);
    if (savedActiveModel) setActiveModel(savedActiveModel);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem("gemini_gateways", JSON.stringify(gateways));
  }, [gateways]);

  useEffect(() => {
    localStorage.setItem("gemini_chats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem("gemini_active_gw", activeGatewayId);
  }, [activeGatewayId]);

  useEffect(() => {
    localStorage.setItem("gemini_active_model", activeModel);
  }, [activeModel]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, isGenerating]);

  // Current active chat helper
  const currentChat = chats.find(c => c.id === currentChatId) || null;
  const currentGateway = gateways.find(g => g.id === activeGatewayId) || gateways[0];

  // Create new chat
  const handleNewChat = () => {
    const newChat = {
      id: "chat-" + Date.now(),
      title: "New Conversation",
      messages: []
    };
    setChats([newChat, ...chats]);
    setCurrentChatId(newChat.id);
  };

  // Delete chat
  const handleDeleteChat = (e, id) => {
    e.stopPropagation();
    const updated = chats.filter(c => c.id !== id);
    setChats(updated);
    if (currentChatId === id) {
      setCurrentChatId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // Add or update gateway
  const handleSaveGateway = (e) => {
    e.preventDefault();
    if (!newGwName || !newGwUrl || !newGwModels) {
      alert("Please fill in Name, Base URL, and at least one Model.");
      return;
    }

    const modelList = newGwModels.split(",").map(m => m.trim()).filter(Boolean);

    if (editingGwId) {
      setGateways(gateways.map(g => g.id === editingGwId ? {
        ...g,
        name: newGwName,
        baseUrl: newGwUrl,
        apiKey: newGwKey !== undefined ? newGwKey : g.apiKey,
        models: modelList
      } : g));
      setEditingGwId(null);
    } else {
      const newGw = {
        id: "gw-" + Date.now(),
        name: newGwName,
        baseUrl: newGwUrl,
        apiKey: newGwKey,
        models: modelList
      };
      setGateways([...gateways, newGw]);
      setActiveGatewayId(newGw.id);
      setActiveModel(modelList[0]);
    }

    setNewGwName("");
    setNewGwUrl("");
    setNewGwKey("");
    setNewGwModels("");
  };

  const handleEditGateway = (gw) => {
    setEditingGwId(gw.id);
    setNewGwName(gw.name);
    setNewGwUrl(gw.baseUrl);
    setNewGwKey(gw.apiKey);
    setNewGwModels(gw.models.join(", "));
  };

  const handleDeleteGateway = (id) => {
    if (gateways.length <= 1) {
      alert("You must keep at least one gateway.");
      return;
    }
    const updated = gateways.filter(g => g.id !== id);
    setGateways(updated);
    if (activeGatewayId === id) {
      setActiveGatewayId(updated[0].id);
      setActiveModel(updated[0].models[0]);
    }
  };

  // Send Message with Streaming via API Proxy
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isGenerating) return;

    let activeChatId = currentChatId;
    let updatedChats = [...chats];

    // If no chat selected, create one
    if (!activeChatId) {
      activeChatId = "chat-" + Date.now();
      const newChat = {
        id: activeChatId,
        title: inputMessage.slice(0, 30) + (inputMessage.length > 30 ? "..." : ""),
        messages: []
      };
      updatedChats = [newChat, ...updatedChats];
      setCurrentChatId(activeChatId);
    }

    const userMsg = { role: "user", content: inputMessage };
    
    // Find chat object
    let chatIndex = updatedChats.findIndex(c => c.id === activeChatId);
    updatedChats[chatIndex] = {
      ...updatedChats[chatIndex],
      title: updatedChats[chatIndex].messages.length === 0 ? inputMessage.slice(0, 30) : updatedChats[chatIndex].title,
      messages: [...updatedChats[chatIndex].messages, userMsg]
    };

    setChats(updatedChats);
    setInputMessage("");
    setIsGenerating(true);

    // Add placeholder for assistant response
    const assistantMsgId = "msg-" + Date.now();
    const assistantMsg = { role: "assistant", content: "" };
    
    updatedChats[chatIndex].messages.push(assistantMsg);
    setChats([...updatedChats]);

    try {
      const currentGw = gateways.find(g => g.id === activeGatewayId);
      if (!currentGw) throw new Error("Selected gateway not found");

      // Prepare payload for our internal Next.js API route (which acts as a CORS proxy)
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: currentGw.baseUrl,
          apiKey: currentGw.apiKey,
          model: activeModel,
          messages: updatedChats[chatIndex].messages.slice(0, -1), // Exclude empty assistant msg
          stream: true
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to connect to gateway");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedContent = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Parse SSE (Server Sent Events) format typical of OpenAI compatible endpoints
        const lines = chunk.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data:")) {
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(dataStr);
              const contentDelta = parsed.choices?.[0]?.delta?.content || "";
              accumulatedContent += contentDelta;

              // Update state in real-time
              const cIdx = updatedChats.findIndex(c => c.id === activeChatId);
              if (cIdx !== -1) {
                const msgs = updatedChats[cIdx].messages;
                msgs[msgs.length - 1].content = accumulatedContent;
                setChats([...updatedChats]);
              }
            } catch (e) {
              // Ignore invalid JSON chunks
            }
          }
        }
      }

    } catch (err) {
      console.error(err);
      const cIdx = updatedChats.findIndex(c => c.id === activeChatId);
      if (cIdx !== -1) {
        const msgs = updatedChats[cIdx].messages;
        msgs[msgs.length - 1].content = `⚠️ **Error:** ${err.message}`;
        setChats([...updatedChats]);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#131314] text-[#e3e3e3] overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`bg-[#1e1f20] flex flex-col transition-all duration-300 z-20 ${isSidebarOpen ? 'w-72' : 'w-0 overflow-hidden'} md:relative fixed inset-y-0 left-0`}>
        <div className="p-4 flex items-center justify-between border-b border-[#3c4043]/40">
          <button 
            onClick={handleNewChat}
            className="flex items-center gap-2 bg-[#282a2c] hover:bg-[#333538] border border-[#3c4043] px-4 py-2.5 rounded-full text-sm font-medium transition shadow-sm w-full justify-center"
          >
            <Plus size={18} className="text-[#8ab4f8]" />
            <span>New chat</span>
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-xs font-semibold text-[#8e918f] px-3 py-2 uppercase tracking-wider">Recent Chats</div>
          {chats.map(chat => (
            <div 
              key={chat.id}
              onClick={() => { setCurrentChatId(chat.id); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm cursor-pointer transition ${currentChatId === chat.id ? 'bg-[#333538] text-white font-medium' : 'hover:bg-[#282a2c] text-[#c4c7c5]'}`}
            >
              <div className="flex items-center gap-3 truncate">
                <MessageSquare size={16} className="text-[#8e918f] shrink-0" />
                <span className="truncate">{chat.title}</span>
              </div>
              <button 
                onClick={(e) => handleDeleteChat(e, chat.id)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 transition"
                title="Delete chat"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Sidebar Footer / Settings button */}
        <div className="p-3 border-t border-[#3c4043]/40">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-[#282a2c] text-sm text-[#c4c7c5] transition"
          >
            <Settings size={18} className="text-[#8e918f]" />
            <span>Gateways & Settings</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full bg-[#131314] relative">
        
        {/* TOP HEADER */}
        <header className="h-14 border-b border-[#3c4043]/40 flex items-center justify-between px-4 bg-[#131314] z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-[#282a2c] rounded-lg transition text-[#8e918f] hover:text-[#e3e3e3]"
              title="Toggle Sidebar"
            >
              <Menu size={20} />
            </button>

            {/* Model Selector Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="flex items-center gap-2 bg-[#1e1f20] hover:bg-[#282a2c] border border-[#3c4043] px-3.5 py-1.5 rounded-full text-sm font-medium transition"
              >
                <Sparkles size={16} className="text-[#8ab4f8]" />
                <span className="max-w-[200px] truncate">{activeModel}</span>
                <span className="text-xs text-[#8e918f] bg-[#333538] px-2 py-0.5 rounded-full ml-1">
                  {currentGateway?.name}
                </span>
                <ChevronDown size={14} className="text-[#8e918f]" />
              </button>

              {/* Dropdown Menu */}
              {isModelDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-[#1e1f20] border border-[#3c4043] rounded-2xl shadow-2xl p-2 z-50">
                  <div className="text-xs font-semibold text-[#8e918f] px-3 py-2">Select Gateway & Model</div>
                  <div className="max-h-72 overflow-y-auto space-y-3">
                    {gateways.map(gw => (
                      <div key={gw.id} className="p-1.5 rounded-xl bg-[#131314]/50 border border-[#3c4043]/50">
                        <div className="text-xs font-bold text-[#8ab4f8] px-2 py-1 flex items-center justify-between">
                          <span>{gw.name}</span>
                          <span className="text-[10px] text-[#8e918f] font-normal">{gw.models.length} models</span>
                        </div>
                        <div className="space-y-0.5 mt-1">
                          {gw.models.map(m => (
                            <button
                              key={m}
                              onClick={() => {
                                setActiveGatewayId(gw.id);
                                setActiveModel(m);
                                setIsModelDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left transition ${activeGatewayId === gw.id && activeModel === m ? 'bg-[#333538] text-white font-medium' : 'hover:bg-[#282a2c] text-[#c4c7c5]'}`}
                            >
                              <span className="truncate">{m}</span>
                              {activeGatewayId === gw.id && activeModel === m && <Check size={14} className="text-[#8ab4f8]" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 bg-[#1e1f20] hover:bg-[#282a2c] border border-[#3c4043] px-3.5 py-1.5 rounded-full text-xs font-medium transition text-[#8ab4f8]"
            >
              <Settings size={14} />
              <span>Configure Gateways</span>
            </button>
          </div>
        </header>

        {/* CHAT MESSAGES CONTAINER */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {!currentChat || currentChat.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-purple-500/20 border border-[#3c4043] flex items-center justify-center text-3xl">
                ✨
              </div>
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Hello, Benny
              </h2>
              <p className="text-sm text-[#8e918f]">
                How can I help you today? Using model <strong className="text-[#e3e3e3]">{activeModel}</strong> via gateway <strong className="text-[#e3e3e3]">{currentGateway?.name}</strong>.
              </p>
              <div className="grid grid-cols-2 gap-2 w-full pt-4">
                <button 
                  onClick={() => setInputMessage("Explain quantum computing in simple terms")}
                  className="p-3 bg-[#1e1f20] hover:bg-[#282a2c] border border-[#3c4043] rounded-xl text-xs text-left transition"
                >
                  💡 Explain quantum computing...
                </button>
                <button 
                  onClick={() => setInputMessage("Write a python script to parse CSV files")}
                  className="p-3 bg-[#1e1f20] hover:bg-[#282a2c] border border-[#3c4043] rounded-xl text-xs text-left transition"
                >
                  💻 Write python script for CSV...
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {currentChat.messages.map((msg, index) => (
                <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                      ✨
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-[#282a2c] text-white rounded-br-sm border border-[#3c4043]/50' 
                      : 'bg-[#1e1f20] text-[#e3e3e3] rounded-bl-sm border border-[#3c4043]'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="markdown-body prose prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content || (isGenerating && index === currentChat.messages.length - 1 ? "Thinking..." : "")}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-[#333538] flex items-center justify-center shrink-0 font-bold text-xs text-[#8ab4f8]">
                      U
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* INPUT FOOTER */}
        <div className="p-4 bg-[#131314] max-w-3xl w-full mx-auto">
          <form onSubmit={handleSendMessage} className="relative bg-[#1e1f20] border border-[#3c4043] rounded-3xl p-2 shadow-lg focus-within:border-[#8ab4f8] transition">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder={`Ask ${activeModel}... (Shift+Enter for new line)`}
              rows={1}
              className="w-full bg-transparent px-4 py-2.5 text-sm text-[#e3e3e3] placeholder-[#8e918f] focus:outline-none resize-none max-h-32"
            />
            <div className="flex items-center justify-between px-3 py-1 border-t border-[#3c4043]/40 mt-1">
              <div className="text-[11px] text-[#8e918f] flex items-center gap-1.5">
                <Server size={12} />
                <span>{currentGateway?.name}</span>
              </div>
              <button
                type="submit"
                disabled={!inputMessage.trim() || isGenerating}
                className={`p-2 rounded-full transition ${inputMessage.trim() && !isGenerating ? 'bg-[#8ab4f8] text-[#131314] hover:bg-blue-300' : 'bg-[#333538] text-[#8e918f] cursor-not-allowed'}`}
              >
                <Send size={16} />
              </button>
            </div>
          </form>
          <div className="text-center text-[11px] text-[#8e918f] mt-2">
            Gemini-style multi-gateway UI with CORS proxy & streaming. Ready for Vercel deployment.
          </div>
        </div>

      </main>

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1f20] border border-[#3c4043] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#3c4043] flex items-center justify-between bg-[#282a2c]">
              <div className="flex items-center gap-2">
                <Settings className="text-[#8ab4f8]" size={20} />
                <h2 className="text-lg font-bold">API Gateways & Endpoints Management</h2>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 hover:bg-[#333538] rounded-xl text-[#8e918f] hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Form Add / Edit Gateway */}
              <form onSubmit={handleSaveGateway} className="bg-[#131314] border border-[#3c4043] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#8ab4f8]">
                    {editingGwId ? "✏️ Edit Gateway Configuration" : "➕ Add New API Gateway"}
                  </h3>
                  {editingGwId && (
                    <button 
                      type="button" 
                      onClick={() => { setEditingGwId(null); setNewGwName(""); setNewGwUrl(""); setNewGwKey(""); setNewGwModels(""); }}
                      className="text-xs text-[#8e918f] hover:text-white underline"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#8e918f] mb-1">Gateway Name</label>
                    <input 
                      type="text" 
                      value={newGwName}
                      onChange={(e) => setNewGwName(e.target.value)}
                      placeholder="e.g. My Custom Proxy, Groq, OpenRouter"
                      className="w-full bg-[#1e1f20] border border-[#3c4043] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#8ab4f8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8e918f] mb-1">Base URL (Endpoint)</label>
                    <input 
                      type="text" 
                      value={newGwUrl}
                      onChange={(e) => setNewGwUrl(e.target.value)}
                      placeholder="https://api.openai.com/v1 or http://localhost:8080/v1"
                      className="w-full bg-[#1e1f20] border border-[#3c4043] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#8ab4f8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#8e918f] mb-1">API Key</label>
                    <input 
                      type="password" 
                      value={newGwKey}
                      onChange={(e) => setNewGwKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full bg-[#1e1f20] border border-[#3c4043] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#8ab4f8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8e918f] mb-1">Models (Comma separated)</label>
                    <input 
                      type="text" 
                      value={newGwModels}
                      onChange={(e) => setNewGwModels(e.target.value)}
                      placeholder="gpt-4o, gpt-4o-mini, claude-3.5-sonnet"
                      className="w-full bg-[#1e1f20] border border-[#3c4043] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#8ab4f8]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    type="submit"
                    className="bg-[#8ab4f8] text-[#131314] hover:bg-blue-300 px-5 py-2 rounded-xl text-sm font-semibold transition"
                  >
                    {editingGwId ? "Update Gateway" : "Add Gateway"}
                  </button>
                </div>
              </form>

              {/* List of Configured Gateways */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[#8e918f] uppercase tracking-wider">Configured Gateways ({gateways.length})</h3>
                {gateways.map(gw => (
                  <div key={gw.id} className="bg-[#131314] border border-[#3c4043] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{gw.name}</span>
                        <span className="text-[10px] bg-[#282a2c] text-[#8ab4f8] px-2 py-0.5 rounded-full border border-[#3c4043]">
                          {gw.models.length} models
                        </span>
                      </div>
                      <div className="text-xs text-[#8e918f] font-mono mt-0.5">{gw.baseUrl}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {gw.models.map(m => (
                          <span key={m} className="text-[10px] bg-[#1e1f20] text-[#c4c7c5] px-2 py-0.5 rounded border border-[#3c4043]/50">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button 
                        onClick={() => handleEditGateway(gw)}
                        className="p-2 hover:bg-[#282a2c] rounded-xl text-[#8e918f] hover:text-white transition"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteGateway(gw.id)}
                        className="p-2 hover:bg-[#282a2c] rounded-xl text-[#8e918f] hover:text-red-400 transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#3c4043] bg-[#282a2c] flex justify-between items-center text-xs text-[#8e918f]">
              <span>All keys are saved locally in your browser storage.</span>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="bg-[#333538] hover:bg-[#444649] text-white px-5 py-2 rounded-xl font-medium transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
