import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import messageService from '../services/messageService';
import { extractErrorMessage } from '../services/authService';
import toast from 'react-hot-toast';

const MessagesPage = () => {
  const { user, token } = useAuth();
  const { socket, isOnline } = useSocket();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [conversations, setConversations] = useState([]);

  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [search, setSearch] = useState('');
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('chats'); // chats | contacts
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    if (token) {
      loadInitialData();
    }
  }, [token]);

  // Handle auto-opening chat from URL parameter
  useEffect(() => {
    const handleUrlUser = async () => {
      if (!userId || !token) return;
      
      console.log("[Chat] URL UserId detected:", userId);
      
      // Try to find in existing lists
      let targetUser = [...conversations, ...contacts].find(u => u.id === parseInt(userId));
      
      if (targetUser) {
        console.log("[Chat] User found in lists:", targetUser.name);
        if (!activeChat || activeChat.id !== targetUser.id) {
          openChat(targetUser);
        }
      } else {
        // Check if we already have this user as activeChat before fetching
        if (activeChat && activeChat.id === parseInt(userId)) {
          return;
        }

        // User not in lists, but we have an ID - this happens when starting a fresh chat from Directory
        console.log("[Chat] User not in lists, fetching basic info...");

        try {
          // We can fetch their public profile to get the name/avatar
          const res = await fetch(`/api/profile/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            const newUser = {
              id: parseInt(userId),
              name: data.data.name,
              avatar_url: data.data.profile_image || data.data.avatar_url,
              role: data.data.role
            };
            console.log("[Chat] Fresh user loaded:", newUser.name);
            openChat(newUser);
          }
        } catch (err) {
          console.error("[Chat] Failed to load user from URL", err);
        }
      }
    };

    handleUrlUser();
  }, [userId, token, conversations.length, contacts.length]);



  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [convData, contactData] = await Promise.all([
        messageService.getConversations(token),
        messageService.getContacts(token)
      ]);
      setConversations(convData.data || []);
      setContacts(contactData.data || []);
    } catch (err) {
      console.error('Failed to load messages data', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (socket) {
      socket.on('new_message', (data) => {
        // If message is for the active chat, add it
        if (activeChat && data.sender_id === activeChat.id) {
          setMessages(prev => [...prev, data]);
          // Mark as read on server
          messageService.markAsRead(activeChat.id, token).catch(() => {});
        }
        
        // Refresh conversations list to show last message and unread count
        refreshConversations();
      });

      socket.on('user_typing', ({ senderId, typing: t }) => {
        if (activeChat && senderId === activeChat.id) {
          setTyping(t);
        }
      });

      return () => {
        socket.off('new_message');
        socket.off('user_typing');
      };
    }
  }, [socket, activeChat, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const refreshConversations = async () => {
    try {
      const convData = await messageService.getConversations(token);
      setConversations(convData.data || []);
    } catch (err) {}
  };

  const openChat = async (chatUser) => {
    console.log("[Chat] Opening chat with:", chatUser.id, chatUser.name);
    setActiveChat(chatUser);
    setTyping(false);
    setMessages([]); // Clear old messages while loading
    
    try {
      const res = await messageService.getMessages(chatUser.id, token);
      console.log("[Chat] Fetched messages count:", res.data?.length || 0);
      setMessages(res.data || []);
      
      // Refresh conversations to clear unread count
      refreshConversations();
      
      // If we're on mobile, maybe scroll to top? 
      // For now, just ensure auto-scroll happens via the messages useEffect
    } catch (err) {
      console.error("[Chat] Failed to fetch messages:", err);
      setMessages([]);
      toast.error("Could not load message history");
    }
  };


  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if ((!newMsg.trim() && !selectedFile && !audioBlob) || !activeChat) return;

    console.log("[Chat] Sending message to:", activeChat.id);
    const content = newMsg.trim();
    const fileToSend = selectedFile || audioBlob;
    
    setNewMsg('');
    setSelectedFile(null);
    setAudioBlob(null);

    try {
      let res;
      if (fileToSend) {
        const formData = new FormData();
        formData.append('file', fileToSend);
        if (content) formData.append('content', content);
        res = await messageService.send(activeChat.id, formData, token);
      } else {
        res = await messageService.send(activeChat.id, content, token);
      }

      const msgObj = res.data;
      console.log("[Chat] Message saved:", msgObj.id);
      
      setMessages(prev => [...prev, msgObj]);
      
      socket?.emit('send_message', { 
        senderId: user.id, 
        receiverId: activeChat.id, 
        ...msgObj 
      });
      
      // Crucial: Refresh list so the chat moves to top or appears if it's new
      refreshConversations();
    } catch (err) {
      console.error("[Chat] Send failed:", err);
      const message = extractErrorMessage(err);
      toast.error(message || 'Failed to send message');
      setNewMsg(content);
    }
  };


  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large (max 10MB)');
        return;
      }
      setSelectedFile(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTyping = () => {
    if (!socket || !activeChat) return;
    
    socket.emit('typing', { senderId: user.id, receiverId: activeChat.id, typing: true });
    
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing', { senderId: user.id, receiverId: activeChat.id, typing: false });
    }, 2000);
  };

  const filteredList = sidebarTab === 'chats' 
    ? conversations.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()))
    : contacts.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));

  const formatTime = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-[#f5f7f8] dark:bg-background-dark min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex max-w-7xl mx-auto w-full px-4 py-4 gap-4 overflow-hidden" style={{ height: 'calc(100vh - 73px)' }}>
        
        {/* Sidebar */}
        <div className="w-80 shrink-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-xl font-black dark:text-white mb-4">Messages</h2>
            
            {/* Search */}
            <div className="relative mb-4">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 dark:text-white dark:placeholder:text-slate-400" 
              />
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <button 
                onClick={() => setSidebarTab('chats')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${sidebarTab === 'chats' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
              >
                Chats
              </button>
              <button 
                onClick={() => setSidebarTab('contacts')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${sidebarTab === 'contacts' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
              >
                Contacts
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-1/2" />
                      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredList.length > 0 ? (
              filteredList.map((u) => (
                <button 
                  key={u.id} 
                  onClick={() => openChat(u)} 
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-50 dark:border-slate-700/50 ${activeChat?.id === u.id ? 'bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
                >
                  <div className="relative shrink-0">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {u.name?.charAt(0)}
                      </div>
                    )}
                    {isOnline(u.id) && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 shadow-sm"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className="text-sm font-bold dark:text-white truncate">{u.name}</p>
                      <span className="text-[10px] text-slate-400 font-medium">{formatTime(u.last_message_at)}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <p className={`text-xs truncate ${u.unread_count > 0 ? 'text-primary dark:text-blue-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                        {u.last_message_type === 'image' ? '📷 Image' :
                         u.last_message_type === 'pdf' ? '📄 PDF Document' :
                         u.last_message_type === 'audio' ? '🎵 Audio' :
                         u.last_message || u.job_title || u.role}
                      </p>
                      {u.unread_count > 0 && (
                        <span className="shrink-0 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                          {u.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-20">chat_bubble</span>
                <p className="text-sm">No {sidebarTab} found</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden shadow-sm">
          {activeChat ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md z-10">
                <div 
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => navigate(`/profile/${activeChat.id}`)}
                >
                  <div className="relative">
                    {activeChat.avatar_url ? (
                      <img src={activeChat.avatar_url} alt={activeChat.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary/30 transition-all" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold group-hover:bg-primary/20 transition-all">
                        {activeChat.name?.charAt(0)}
                      </div>
                    )}
                    {isOnline(activeChat.id) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                    )}
                  </div>
                  <div>
                    <p className="font-black text-sm dark:text-white leading-none mb-1 group-hover:text-primary transition-colors">{activeChat.name}</p>
                    <p className="text-[11px] font-medium text-slate-400">
                      {isOnline(activeChat.id) ? 'Active now' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 text-slate-400 hover:text-primary dark:hover:text-blue-400 rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-xl">info</span>
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-900/10 custom-scrollbar">
                {messages.length > 0 ? (
                  messages.map((m, i) => {
                    const isMe = m.sender_id === user.id;
                    const showAvatar = i === 0 || messages[i-1].sender_id !== m.sender_id;
                    
                    return (
                      <div key={m.id || i} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isMe && (
                          <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden">
                            {showAvatar ? (
                               activeChat.avatar_url ? (
                                 <img src={activeChat.avatar_url} alt="" className="w-full h-full object-cover" />
                               ) : (
                                 <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                   {activeChat.name?.charAt(0)}
                                 </div>
                               )
                            ) : null}
                          </div>
                        )}
                        <div className={`max-w-[70%] group`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm transition-all ${
                            isMe 
                              ? 'bg-primary text-white rounded-br-none' 
                              : 'bg-white dark:bg-slate-700 dark:text-white border border-slate-100 dark:border-slate-600 rounded-bl-none'
                          }`}>
                            {m.message_type === 'image' && (
                              <div className="mb-2">
                                <img 
                                  src={`/${m.file_url}`} 
                                  alt={m.file_name} 
                                  className="rounded-lg max-w-full max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(`/${m.file_url}`, '_blank')}
                                />
                              </div>
                            )}
                            {m.message_type === 'pdf' && (
                              <div className={`flex items-center gap-3 p-3 rounded-xl mb-2 border ${isMe ? 'bg-white/10 border-white/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600'}`}>
                                <span className="material-symbols-outlined text-3xl">picture_as_pdf</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate">{m.file_name}</p>
                                  <a href={`/${m.file_url}`} target="_blank" rel="noreferrer" className={`text-[10px] font-black underline ${isMe ? 'text-white' : 'text-primary'}`}>View PDF</a>
                                </div>
                              </div>
                            )}
                            {m.message_type === 'audio' && (
                              <div className="mb-2 min-w-[200px]">
                                <audio controls className="w-full h-8" src={`/${m.file_url}`}></audio>
                              </div>
                            )}
                            {m.content && <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>}
                          </div>
                          <p className={`text-[10px] mt-1.5 font-medium flex items-center gap-1 ${isMe ? 'justify-end text-slate-400' : 'text-slate-400'}`}>
                            {formatTime(m.created_at)}
                            {isMe && <span className={`material-symbols-outlined text-[14px] ${m.is_read ? 'text-blue-400' : 'text-slate-300'}`}>{m.is_read ? 'done_all' : 'done'}</span>}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                    <span className="material-symbols-outlined text-5xl mb-2">waving_hand</span>
                    <p className="text-sm font-medium">Say hello to {activeChat.name}!</p>
                  </div>
                )}
                {typing && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold ml-10">
                    <div className="flex gap-0.5">
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    {activeChat.name} is typing...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="px-6 py-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                {/* File Preview */}
                {(selectedFile || audioBlob) && (
                  <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-between border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">
                        {audioBlob ? 'mic' : selectedFile.type.startsWith('image/') ? 'image' : 'description'}
                      </span>
                      <div>
                        <p className="text-xs font-bold dark:text-white truncate max-w-[200px]">
                          {audioBlob ? `Voice Note (${formatDuration(recordingTime)})` : selectedFile.name}
                        </p>
                        <p className="text-[10px] text-slate-400">Ready to send</p>
                      </div>
                    </div>
                    <button onClick={() => { setSelectedFile(null); setAudioBlob(null); }} className="text-slate-400 hover:text-red-500 transition-colors">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                )}

                <form onSubmit={sendMessage} className="flex items-center gap-3">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    className="hidden" 
                    accept="image/*,.pdf,audio/*"
                  />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current.click()}
                    className="p-2 text-slate-400 hover:text-primary dark:hover:text-blue-400 rounded-lg transition-colors shrink-0"
                  >
                    <span className="material-symbols-outlined">attach_file</span>
                  </button>
                  
                  {isRecording ? (
                    <div className="flex items-center gap-3 px-4 py-2 bg-red-50 text-red-600 rounded-2xl animate-pulse">
                      <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                      <span className="text-xs font-black">{formatDuration(recordingTime)}</span>
                      <button type="button" onClick={stopRecording} className="ml-2 bg-red-600 text-white rounded-full p-1">
                        <span className="material-symbols-outlined text-sm">stop</span>
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      onClick={startRecording}
                      className="p-2 text-slate-400 hover:text-primary dark:hover:text-blue-400 rounded-lg transition-colors shrink-0"
                    >
                      <span className="material-symbols-outlined">mic</span>
                    </button>
                  )}

                  <div className="flex-1 relative">
                    <input 
                      value={newMsg} 
                      onChange={e => { setNewMsg(e.target.value); handleTyping(); }} 
                      placeholder={isRecording ? "Recording..." : "Type your message..."} 
                      disabled={isRecording}
                      className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 dark:text-white dark:placeholder:text-slate-500 shadow-inner disabled:opacity-50" 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={(!newMsg.trim() && !selectedFile && !audioBlob) || isRecording} 
                    className="w-12 h-12 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center shadow-lg shadow-primary/20 shrink-0"
                  >
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-12 text-center">
              <div className="w-24 h-24 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-5xl opacity-40">forum</span>
              </div>
              <h3 className="text-2xl font-black dark:text-white mb-3">Your Messages</h3>
              <p className="text-sm max-w-xs leading-relaxed">
                Connect with mentors and alumni to start professional conversations. Select a chat from the sidebar to begin.
              </p>
              <button 
                onClick={() => setSidebarTab('contacts')}
                className="mt-8 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-md"
              >
                Start New Chat
              </button>
            </div>
          )}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}} />
    </div>
  );
};

export default MessagesPage;
