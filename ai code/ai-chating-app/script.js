const STORAGE_KEY = "gemini-chat-workspace-v1";

const elements = {
    chatContainer: document.getElementById("chatContainer"),
    chatList: document.getElementById("chatList"),
    chatTitle: document.getElementById("chatTitle"),
    chatMeta: document.getElementById("chatMeta"),
    composer: document.getElementById("composer"),
    prompt: document.getElementById("prompt"),
    sendBtn: document.getElementById("sendBtn"),
    stopBtn: document.getElementById("stopBtn"),
    newChat: document.getElementById("newChat"),
    renameChat: document.getElementById("renameChat"),
    exportTxt: document.getElementById("exportTxt"),
    exportJson: document.getElementById("exportJson"),
    imageBtn: document.getElementById("imageBtn"),
    imageInput: document.getElementById("imageInput"),
    previewContainer: document.getElementById("previewContainer"),
    template: document.getElementById("messageTemplate")
};

let state = loadState();
let activeImage = null;
let abortController = null;
let streamingMessageId = null;

function createChat(title = "New Chat") {
    return {
        id: ChatUtils.uid(),
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
            {
                id: ChatUtils.uid(),
                role: "assistant",
                text: "Hello! Ask me anything, upload an image, or paste code to get started.",
                createdAt: new Date().toISOString()
            }
        ]
    };
}

function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved?.chats?.length) return saved;
    } catch (error) {
        console.warn("Could not load chats", error);
    }

    const firstChat = createChat();
    return { activeChatId: firstChat.id, chats: [firstChat] };
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getActiveChat() {
    return state.chats.find(chat => chat.id === state.activeChatId) || state.chats[0];
}

function setGenerating(isGenerating) {
    elements.stopBtn.disabled = !isGenerating;
    elements.sendBtn.disabled = isGenerating;
    elements.prompt.disabled = isGenerating;
    elements.imageBtn.disabled = isGenerating;
}

function render() {
    renderChatList();
    renderMessages();
    renderPreview();
}

function renderChatList() {
    const activeChat = getActiveChat();
    elements.chatList.innerHTML = "";

    state.chats.forEach(chat => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = `chat-item${chat.id === activeChat.id ? " active" : ""}`;
        item.innerHTML = `<span>${ChatUtils.escapeHtml(chat.title)}</span><small>${chat.messages.length} messages</small>`;
        item.addEventListener("click", () => {
            if (abortController) stopGenerating();
            state.activeChatId = chat.id;
            saveState();
            render();
        });
        elements.chatList.appendChild(item);
    });
}

function renderMessages() {
    const chat = getActiveChat();
    elements.chatTitle.textContent = chat.title;
    elements.chatMeta.textContent = `${chat.messages.length} messages`;
    elements.chatContainer.innerHTML = "";

    chat.messages.forEach(message => {
        const node = elements.template.content.firstElementChild.cloneNode(true);
        node.classList.add(message.role);
        node.dataset.id = message.id;
        node.querySelector(".avatar").textContent = message.role === "user" ? "You" : "AI";

        const bubble = node.querySelector(".bubble");
        bubble.innerHTML = buildBubbleContent(message);

        const actions = node.querySelector(".message-actions");
        buildMessageActions(message).forEach(action => actions.appendChild(action));

        node.querySelector(".time").textContent = ChatUtils.formatTime(message.createdAt);
        elements.chatContainer.appendChild(node);
    });

    autoScroll();
}

function buildBubbleContent(message) {
    const image = message.image ? `<img class="message-image" src="${message.image.dataUrl}" alt="Uploaded image">` : "";
    const text = `<div class="markdown">${ChatUtils.renderMarkdown(message.text || "")}</div>`;
    return `${image}${text}`;
}

function buildMessageActions(message) {
    const actions = [];
    actions.push(actionButton("Copy", () => copyMessage(message)));

    if (message.role === "assistant") {
        actions.push(actionButton("Regenerate", () => regenerateMessage(message.id)));
    }

    if (message.role === "user") {
        actions.push(actionButton("Edit", () => editPrompt(message.id)));
    }

    actions.push(actionButton("Delete", () => deleteMessage(message.id)));
    return actions;
}

function actionButton(label, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", handler);
    return button;
}

function renderPreview() {
    elements.previewContainer.innerHTML = "";
    if (!activeImage) return;

    const preview = document.createElement("div");
    preview.className = "image-preview";
    preview.innerHTML = `
        <img src="${activeImage.dataUrl}" alt="Selected upload">
        <span>${ChatUtils.escapeHtml(activeImage.name)}</span>
        <button type="button" aria-label="Remove image">Remove</button>
    `;
    preview.querySelector("button").addEventListener("click", () => {
        activeImage = null;
        elements.imageInput.value = "";
        renderPreview();
    });
    elements.previewContainer.appendChild(preview);
}

function autoScroll() {
    requestAnimationFrame(() => {
        elements.chatContainer.scrollTo({
            top: elements.chatContainer.scrollHeight,
            behavior: "smooth"
        });
    });
}

async function sendMessage(event) {
    event?.preventDefault();
    const text = elements.prompt.value.trim();
    if ((!text && !activeImage) || abortController) return;

    const chat = getActiveChat();
    const userMessage = {
        id: ChatUtils.uid(),
        role: "user",
        text: text || "Image uploaded",
        image: activeImage,
        createdAt: new Date().toISOString()
    };

    chat.messages.push(userMessage);
    chat.title = chat.title === "New Chat" ? makeTitle(userMessage.text) : chat.title;
    chat.updatedAt = new Date().toISOString();
    elements.prompt.value = "";
    activeImage = null;
    saveState();
    render();

    await createAssistantResponse(userMessage);
}

async function createAssistantResponse(userMessage) {
    const chat = getActiveChat();
    const assistantMessage = {
        id: ChatUtils.uid(),
        role: "assistant",
        text: "",
        createdAt: new Date().toISOString(),
        streaming: true
    };

    chat.messages.push(assistantMessage);
    streamingMessageId = assistantMessage.id;
    abortController = new AbortController();
    setGenerating(true);
    renderMessages();

    try {
        await GeminiClient.streamResponse(
            { text: userMessage.text, image: userMessage.image },
            {
                signal: abortController.signal,
                onToken: token => {
                    assistantMessage.text += token;
                    updateMessageBubble(assistantMessage);
                }
            }
        );
    } catch (error) {
        if (error.name === "AbortError") {
            assistantMessage.text += assistantMessage.text ? "\n\n_Generation stopped._" : "_Generation stopped._";
        } else {
            assistantMessage.text = `Sorry, something went wrong while generating the response.\n\n${error.message || "Unknown error"}`;
        }
    } finally {
        assistantMessage.streaming = false;
        chat.updatedAt = new Date().toISOString();
        abortController = null;
        streamingMessageId = null;
        setGenerating(false);
        saveState();
        render();
    }
}

function updateMessageBubble(message) {
    const node = elements.chatContainer.querySelector(`[data-id="${message.id}"] .bubble`);
    if (node) node.innerHTML = `${buildBubbleContent(message)}<span class="cursor"></span>`;
    autoScroll();
}

function stopGenerating() {
    abortController?.abort();
}

async function regenerateMessage(messageId) {
    if (abortController) return;
    const chat = getActiveChat();
    const assistantIndex = chat.messages.findIndex(message => message.id === messageId);
    if (assistantIndex < 0) return;

    const previousUser = [...chat.messages]
        .slice(0, assistantIndex)
        .reverse()
        .find(message => message.role === "user");

    if (!previousUser) return;
    chat.messages.splice(assistantIndex, 1);
    saveState();
    render();
    await createAssistantResponse(previousUser);
}

async function editPrompt(messageId) {
    if (abortController) return;
    const chat = getActiveChat();
    const index = chat.messages.findIndex(message => message.id === messageId);
    const message = chat.messages[index];
    if (!message) return;

    const nextText = window.prompt("Edit prompt", message.text);
    if (nextText === null) return;

    message.text = nextText.trim() || message.text;
    chat.messages.splice(index + 1);
    saveState();
    render();
    await createAssistantResponse(message);
}

function deleteMessage(messageId) {
    if (abortController && messageId === streamingMessageId) stopGenerating();
    const chat = getActiveChat();
    chat.messages = chat.messages.filter(message => message.id !== messageId);
    saveState();
    render();
}

async function copyMessage(message) {
    const text = message.text || "";

    try {
        await navigator.clipboard.writeText(text);
    } catch (error) {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
    }
}

function makeTitle(text) {
    return text.replace(/\s+/g, " ").slice(0, 34) || "Image chat";
}

function renameActiveChat() {
    const chat = getActiveChat();
    const title = window.prompt("Chat name", chat.title);
    if (!title?.trim()) return;
    chat.title = title.trim();
    saveState();
    render();
}

function exportChat(type) {
    const chat = getActiveChat();
    const safeTitle = chat.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "chat";

    if (type === "json") {
        ChatUtils.downloadFile(`${safeTitle}.json`, JSON.stringify(chat, null, 2), "application/json");
        return;
    }

    const content = chat.messages.map(message => {
        const image = message.image ? `\n[Image: ${message.image.name}]` : "";
        return `${message.role.toUpperCase()} - ${new Date(message.createdAt).toLocaleString()}\n${message.text}${image}`;
    }).join("\n\n---\n\n");
    ChatUtils.downloadFile(`${safeTitle}.txt`, content, "text/plain");
}

function startNewChat() {
    if (abortController) stopGenerating();
    const chat = createChat();
    state.chats.unshift(chat);
    state.activeChatId = chat.id;
    saveState();
    render();
}

function handleImageSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        activeImage = {
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: reader.result
        };
        renderPreview();
    };
    reader.readAsDataURL(file);
}

function resizePrompt() {
    elements.prompt.style.height = "auto";
    elements.prompt.style.height = `${Math.min(elements.prompt.scrollHeight, 160)}px`;
}

elements.composer.addEventListener("submit", sendMessage);
elements.stopBtn.addEventListener("click", stopGenerating);
elements.newChat.addEventListener("click", startNewChat);
elements.renameChat.addEventListener("click", renameActiveChat);
elements.exportTxt.addEventListener("click", () => exportChat("txt"));
elements.exportJson.addEventListener("click", () => exportChat("json"));
elements.imageBtn.addEventListener("click", () => elements.imageInput.click());
elements.imageInput.addEventListener("change", handleImageSelect);
elements.prompt.addEventListener("input", resizePrompt);
elements.prompt.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage(event);
    }
});

render();
resizePrompt();


