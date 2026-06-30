const STORAGE_KEY = "gemini-chat-html-history-v1";
const API_KEY_STORAGE = "gemini-chat-api-key";
const THEME_STORAGE = "gemini-chat-theme";

const $ = (selector) => document.querySelector(selector);
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const els = {
  sidebar: $("#sidebar"),
  menuBtn: $("#menuBtn"),
  newChatBtn: $("#newChatBtn"),
  clearAllBtn: $("#clearAllBtn"),
  chatList: $("#chatList"),
  chatTitle: $("#chatTitle"),
  chatMeta: $("#chatMeta"),
  messages: $("#messages"),
  composer: $("#composer"),
  promptInput: $("#promptInput"),
  sendBtn: $("#sendBtn"),
  stopBtn: $("#stopBtn"),
  imageBtn: $("#imageBtn"),
  fileInput: $("#fileInput"),
  previewGrid: $("#previewGrid"),
  dropZone: $("#dropZone"),
  statusText: $("#statusText"),
  toast: $("#toast"),
  apiKeyInput: $("#apiKeyInput"),
  saveKeyBtn: $("#saveKeyBtn"),
  modelInput: $("#modelInput"),
  themeBtn: $("#themeBtn"),
  exportJsonBtn: $("#exportJsonBtn"),
  exportTxtBtn: $("#exportTxtBtn"),
};

let state = {
  chats: [],
  activeChatId: null,
  pendingImages: [],
  isLoading: false,
  abortController: null,
  stopRequested: false,
};

function boot() {
  configureMarkdown();
  loadState();
  bindEvents();
  renderAll();
  hydrateIcons();
  resizeTextarea();
}

function configureMarkdown() {
  if (!window.marked) return;
  marked.setOptions({
    breaks: true,
    gfm: true,
    highlight(code, lang) {
      if (!window.hljs) return escapeHtml(code);
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  });
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const theme = localStorage.getItem(THEME_STORAGE) || "dark";
  document.documentElement.dataset.theme = theme;
  els.apiKeyInput.value = localStorage.getItem(API_KEY_STORAGE) || "";

  try {
    state.chats = saved ? JSON.parse(saved) : [];
  } catch {
    state.chats = [];
  }

  if (!state.chats.length) {
    state.chats.push(createChat());
  }
  state.activeChatId = state.chats[0].id;
}

function bindEvents() {
  els.newChatBtn.addEventListener("click", () => {
    const chat = createChat();
    state.chats.unshift(chat);
    state.activeChatId = chat.id;
    saveState();
    renderAll();
    closeMobileSidebar();
  });

  els.clearAllBtn.addEventListener("click", () => {
    if (!confirm("Delete all saved chats?")) return;
    state.chats = [createChat()];
    state.activeChatId = state.chats[0].id;
    saveState();
    renderAll();
  });

  els.menuBtn.addEventListener("click", () => els.sidebar.classList.toggle("open"));
  els.saveKeyBtn.addEventListener("click", saveApiKey);
  els.themeBtn.addEventListener("click", toggleTheme);
  els.exportJsonBtn.addEventListener("click", () => exportChat("json"));
  els.exportTxtBtn.addEventListener("click", () => exportChat("txt"));
  els.imageBtn.addEventListener("click", () => els.fileInput.click());
  els.fileInput.addEventListener("change", (event) => addFiles(event.target.files));
  els.stopBtn.addEventListener("click", stopGenerating);

  els.chatTitle.addEventListener("input", () => {
    const chat = getActiveChat();
    chat.title = els.chatTitle.value.trim() || "Untitled Chat";
    chat.updatedAt = Date.now();
    saveState();
    renderChatList();
  });

  els.modelInput.addEventListener("change", () => {
    toast(`Model set to ${els.modelInput.value.trim() || "gemini-3.5-flash"}`);
  });

  els.composer.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage();
  });

  els.promptInput.addEventListener("input", resizeTextarea);
  els.promptInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });

  ["dragenter", "dragover"].forEach((name) => {
    els.dropZone.addEventListener(name, (event) => {
      event.preventDefault();
      els.dropZone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((name) => {
    els.dropZone.addEventListener(name, (event) => {
      event.preventDefault();
      els.dropZone.classList.remove("dragover");
    });
  });

  els.dropZone.addEventListener("drop", (event) => addFiles(event.dataTransfer.files));

  document.addEventListener("paste", (event) => {
    const files = [...event.clipboardData.files].filter((file) => file.type.startsWith("image/"));
    if (files.length) addFiles(files);
  });

  els.messages.addEventListener("click", handleMessageClick);
}

function createChat() {
  return {
    id: uid(),
    title: "New Chat",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };
}

function getActiveChat() {
  return state.chats.find((chat) => chat.id === state.activeChatId) || state.chats[0];
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.chats));
}

function saveApiKey() {
  const key = els.apiKeyInput.value.trim();
  if (!key) {
    localStorage.removeItem(API_KEY_STORAGE);
    toast("API key removed");
    return;
  }
  localStorage.setItem(API_KEY_STORAGE, key);
  toast("API key saved in this browser");
}

function renderAll() {
  renderChatList();
  renderActiveChat();
  renderPreviews();
}

function renderChatList() {
  els.chatList.innerHTML = "";
  state.chats.forEach((chat) => {
    const button = document.createElement("button");
    button.className = `chat-item ${chat.id === state.activeChatId ? "active" : ""}`;
    button.type = "button";
    button.innerHTML = `
      <span>
        <strong>${escapeHtml(chat.title || "New Chat")}</strong>
        <span>${chat.messages.length} messages</span>
      </span>
      <i data-lucide="message-square"></i>
    `;
    button.addEventListener("click", () => {
      state.activeChatId = chat.id;
      renderAll();
      closeMobileSidebar();
    });
    els.chatList.appendChild(button);
  });
  hydrateIcons();
}

function renderActiveChat() {
  const chat = getActiveChat();
  els.chatTitle.value = chat.title || "New Chat";
  els.chatMeta.textContent = chat.messages.length
    ? `${chat.messages.length} messages - ${formatTime(chat.updatedAt)}`
    : "Ready for text, image, or both";
  renderMessages();
}

function renderMessages() {
  const chat = getActiveChat();
  els.messages.innerHTML = "";

  if (!chat.messages.length) {
    els.messages.appendChild(emptyState());
    return;
  }

  chat.messages.forEach((message) => els.messages.appendChild(messageNode(message)));
  enhanceCodeBlocks();
  hydrateIcons();
  scrollToBottom();
}

function emptyState() {
  const section = document.createElement("section");
  section.className = "empty-state";
  section.innerHTML = `
    <div class="empty-state-inner">
      <h1>আজ কী বানাবো?</h1>
      <p>Text লিখুন, image দিন, অথবা দুটো একসাথে পাঠান। Conversation history localStorage-এ থাকবে।</p>
      <div class="suggestions">
        <button type="button">একটি landing page-এর copy লিখে দাও</button>
        <button type="button">এই image দেখে product description বানাও</button>
        <button type="button">JavaScript bug explain করো</button>
        <button type="button">Bangla + English mixed reply দাও</button>
      </div>
    </div>
  `;
  section.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      els.promptInput.value = button.textContent.trim();
      resizeTextarea();
      els.promptInput.focus();
    });
  });
  return section;
}

function messageNode(message) {
  const article = document.createElement("article");
  article.className = `message ${message.role}`;
  article.dataset.id = message.id;
  const roleLabel = message.role === "user" ? "You" : "AI";
  const canRegen = message.role === "assistant";
  const canEdit = message.role === "user";

  article.innerHTML = `
    <div class="avatar">${message.role === "user" ? "Y" : "AI"}</div>
    <div class="bubble-wrap">
      <div class="bubble">
        ${imageStrip(message.images)}
        <div class="markdown">${renderMarkdown(message.content)}</div>
      </div>
      <div class="message-meta">
        <span class="message-time">${roleLabel} - ${formatTime(message.createdAt)}</span>
        <div class="message-actions">
          <button class="message-action" data-action="copy" title="Copy" aria-label="Copy"><i data-lucide="copy"></i></button>
          ${canEdit ? '<button class="message-action" data-action="edit" title="Edit prompt" aria-label="Edit prompt"><i data-lucide="pencil"></i></button>' : ""}
          ${canRegen ? '<button class="message-action" data-action="regenerate" title="Regenerate" aria-label="Regenerate"><i data-lucide="refresh-cw"></i></button>' : ""}
          <button class="message-action" data-action="delete" title="Delete" aria-label="Delete"><i data-lucide="trash"></i></button>
        </div>
      </div>
    </div>
  `;
  return article;
}

function imageStrip(images = []) {
  if (!images.length) return "";
  return `
    <div class="image-strip">
      ${images.map((img) => `<img src="${img.dataUrl}" alt="${escapeHtml(img.name)}" />`).join("")}
    </div>
  `;
}

function renderMarkdown(text = "") {
  if (!text) return '<div class="typing"><span></span><span></span><span></span></div>';
  if (window.marked) {
    const html = marked.parse(text);
    return window.DOMPurify ? DOMPurify.sanitize(html) : html;
  }
  return escapeHtml(text).replace(/\n/g, "<br>");
}

function enhanceCodeBlocks() {
  if (window.hljs) {
    els.messages.querySelectorAll("pre code").forEach((block) => hljs.highlightElement(block));
  }
  els.messages.querySelectorAll("pre").forEach((pre) => {
    if (pre.querySelector(".copy-code")) return;
    const button = document.createElement("button");
    button.className = "copy-code";
    button.type = "button";
    button.textContent = "Copy";
    button.addEventListener("click", () => {
      navigator.clipboard.writeText(pre.innerText.replace(/^Copy\s*/, ""));
      toast("Code copied");
    });
    pre.appendChild(button);
  });
}

async function addFiles(fileList) {
  const files = [...fileList].filter((file) => file.type.startsWith("image/"));
  if (!files.length) return;

  const converted = await Promise.all(files.map(fileToImagePayload));
  state.pendingImages.push(...converted);
  renderPreviews();
  toast(`${files.length} image added`);
}

function fileToImagePayload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      resolve({
        id: uid(),
        name: file.name,
        mimeType: file.type,
        dataUrl,
        base64: String(dataUrl).split(",")[1],
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderPreviews() {
  els.previewGrid.innerHTML = state.pendingImages
    .map((image) => `
      <div class="preview" data-id="${image.id}">
        <img src="${image.dataUrl}" alt="${escapeHtml(image.name)}" />
        <button type="button" title="Remove image" aria-label="Remove image">&times;</button>
      </div>
    `)
    .join("");
  els.previewGrid.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.closest(".preview").dataset.id;
      state.pendingImages = state.pendingImages.filter((image) => image.id !== id);
      renderPreviews();
    });
  });
}

async function sendMessage({ promptOverride, imagesOverride, regenerateFromId } = {}) {
  if (state.isLoading) return;
  const prompt = (promptOverride ?? els.promptInput.value).trim();
  const images = imagesOverride ?? [...state.pendingImages];
  if (!prompt && !images.length) return;

  const apiKey = els.apiKeyInput.value.trim() || localStorage.getItem(API_KEY_STORAGE);
  if (!apiKey) {
    toast("Add your Gemini API key first");
    els.apiKeyInput.focus();
    return;
  }

  const chat = getActiveChat();
  if (!regenerateFromId) {
    chat.messages.push({
      id: uid(),
      role: "user",
      content: prompt,
      images,
      createdAt: Date.now(),
    });
  }

  const assistantMessage = {
    id: uid(),
    role: "assistant",
    content: "",
    images: [],
    createdAt: Date.now(),
  };
  chat.messages.push(assistantMessage);
  chat.updatedAt = Date.now();
  if (chat.title === "New Chat" && prompt) chat.title = prompt.slice(0, 42);

  els.promptInput.value = "";
  state.pendingImages = [];
  setLoading(true);
  saveState();
  renderAll();
  resizeTextarea();

  try {
    const contents = buildGeminiContents(chat.messages, assistantMessage.id);
    const stream = await streamGemini({ apiKey, contents });
    for await (const chunk of stream) {
      assistantMessage.content += chunk;
      updateMessageContent(assistantMessage.id, assistantMessage.content);
      scrollToBottom();
    }
    if (!assistantMessage.content.trim()) assistantMessage.content = "No response received.";
  } catch (error) {
    if (state.stopRequested) {
      assistantMessage.content = assistantMessage.content.trim() || "_Generation stopped._";
    } else {
      assistantMessage.content = `**Error:** ${error.message || "Something went wrong."}`;
    }
  } finally {
    chat.updatedAt = Date.now();
    setLoading(false);
    state.abortController = null;
    state.stopRequested = false;
    saveState();
    renderAll();
  }
}

function buildGeminiContents(messages, stopAtId) {
  const contents = [];
  for (const message of messages) {
    if (message.id === stopAtId) break;
    if (!message.content && !message.images?.length) continue;

    const parts = [];
    if (message.content) parts.push({ text: message.content });
    if (message.role === "user") {
      (message.images || []).forEach((image) => {
        parts.push({
          inline_data: {
            mime_type: image.mimeType,
            data: image.base64,
          },
        });
      });
    }

    contents.push({
      role: message.role === "assistant" ? "model" : "user",
      parts,
    });
  }
  return contents;
}

async function* streamGemini({ apiKey, contents }) {
  const model = els.modelInput.value.trim() || "gemini-3.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;
  state.abortController = new AbortController();

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents }),
    signal: state.abortController.signal,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(parseGeminiError(details) || `Gemini request failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      const parsed = JSON.parse(payload);
      const text = parsed.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
      if (text) yield text;
    }
  }
}

function stopGenerating() {
  if (state.abortController) {
    state.stopRequested = true;
    state.abortController.abort();
    toast("Generation stopped");
  }
}

function setLoading(isLoading) {
  state.isLoading = isLoading;
  els.sendBtn.disabled = isLoading;
  els.promptInput.disabled = isLoading;
  els.statusText.textContent = isLoading ? "Generating..." : "Idle";
  els.stopBtn.classList.toggle("hidden", !isLoading);
  els.dropZone.querySelector(".input-row").classList.toggle("has-stop", isLoading);
}

function updateMessageContent(messageId, content) {
  const node = els.messages.querySelector(`[data-id="${messageId}"] .markdown`);
  if (!node) return;
  node.innerHTML = renderMarkdown(content);
  enhanceCodeBlocks();
  hydrateIcons();
}

function handleMessageClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const messageEl = button.closest(".message");
  const id = messageEl.dataset.id;
  const chat = getActiveChat();
  const index = chat.messages.findIndex((message) => message.id === id);
  const message = chat.messages[index];
  const action = button.dataset.action;

  if (action === "copy") {
    navigator.clipboard.writeText(message.content);
    toast("Copied");
  }

  if (action === "delete") {
    chat.messages.splice(index, 1);
    saveState();
    renderAll();
  }

  if (action === "edit") {
    els.promptInput.value = message.content;
    state.pendingImages = [...(message.images || [])];
    chat.messages.splice(index);
    saveState();
    renderAll();
    renderPreviews();
    resizeTextarea();
    els.promptInput.focus();
  }

  if (action === "regenerate") {
    const userMessage = findPreviousUserMessage(chat.messages, index);
    if (!userMessage) return;
    chat.messages.splice(index, 1);
    saveState();
    renderAll();
    sendMessage({
      promptOverride: userMessage.content,
      imagesOverride: userMessage.images || [],
      regenerateFromId: userMessage.id,
    });
  }
}

function findPreviousUserMessage(messages, startIndex) {
  for (let i = startIndex - 1; i >= 0; i -= 1) {
    if (messages[i].role === "user") return messages[i];
  }
  return null;
}

function exportChat(type) {
  const chat = getActiveChat();
  if (type === "json") {
    download(`${safeFileName(chat.title)}.json`, JSON.stringify(chat, null, 2), "application/json");
    return;
  }

  const text = chat.messages
    .map((message) => {
      const images = message.images?.length ? `\n[${message.images.length} image(s)]` : "";
      return `${message.role.toUpperCase()} - ${new Date(message.createdAt).toLocaleString()}\n${message.content}${images}`;
    })
    .join("\n\n---\n\n");
  download(`${safeFileName(chat.title)}.txt`, text, "text/plain");
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_STORAGE, next);
}

function resizeTextarea() {
  els.promptInput.style.height = "auto";
  els.promptInput.style.height = `${Math.min(els.promptInput.scrollHeight, 180)}px`;
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    els.messages.scrollTop = els.messages.scrollHeight;
  });
}

function closeMobileSidebar() {
  els.sidebar.classList.remove("open");
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseGeminiError(details) {
  try {
    return JSON.parse(details).error?.message;
  } catch {
    return details.slice(0, 160);
  }
}

function safeFileName(value) {
  return (value || "chat").replace(/[\\/:*?"<>|]/g, "-").slice(0, 60);
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function hydrateIcons() {
  if (window.lucide) lucide.createIcons();
}

boot();
