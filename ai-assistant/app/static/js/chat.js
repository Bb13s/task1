// 辩论 AI - WebSocket 客户端

let ws = null;
let currentMode = "chat";
let currentUserId = "";
let currentMotion = "";
let currentUserSide = "";
let debateActive = false;
let debateId = null;

// ── DOM 引用 ──
const setupScreen = document.getElementById("setup-screen");
const debateScreen = document.getElementById("debate-screen");
const messagesEl = document.getElementById("messages");
const msgInput = document.getElementById("msg-input");
const sendBtn = document.getElementById("send-btn");
const startBtn = document.getElementById("start-btn");
const feedbackBtn = document.getElementById("feedback-btn");
const endBtn = document.getElementById("end-btn");
const backBtn = document.getElementById("back-btn");
const headerName = document.getElementById("header-name");
const headerMode = document.getElementById("header-mode");
const userNameInput = document.getElementById("user-name");
const motionInput = document.getElementById("motion");
const debateFields = document.getElementById("debate-fields");
const typingDiv = createTypingIndicator();

// ── 设置页：模式选择 ──
document.querySelectorAll(".mode-card").forEach(card => {
    card.addEventListener("click", () => {
        document.querySelectorAll(".mode-card").forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        const isDebate = card.dataset.mode === "free";
        debateFields.style.display = isDebate ? "" : "none";
        startBtn.textContent = isDebate ? "开始辩论" : "开始对话";
    });
});

// 立场按钮
document.querySelectorAll(".side-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        btn.parentElement.querySelectorAll(".side-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    });
});

// ── 页面加载：检查未结束辩论 ──
(function checkSavedDebate() {
    try {
        const saved = localStorage.getItem("debate_state");
        if (saved) {
            const state = JSON.parse(saved);
            if (state.user_id) {
                currentUserId = state.user_id;
                currentMotion = state.motion || "";
                currentUserSide = state.user_side || "";
                currentMode = state.mode || "chat";
                debateId = state.debate_id;
                setupScreen.style.display = "none";
                debateScreen.style.display = "";
                updateHeader();
                userNameInput.value = currentUserId;
                connectWebSocket(currentUserId, currentMotion, currentUserSide, currentMode);
                return;
            }
        }
    } catch (e) {
        localStorage.removeItem("debate_state");
    }

    setupScreen.style.display = "";
    debateScreen.style.display = "none";
    const savedName = localStorage.getItem("user_name");
    if (savedName) userNameInput.value = savedName;
})();

// ── 开始 ──
startBtn.addEventListener("click", startDebate);

function startDebate() {
    currentUserId = userNameInput.value.trim() || "user" + Math.random().toString(36).slice(2, 6);
    currentMode = document.querySelector(".mode-card.active")?.dataset.mode || "chat";

    if (currentMode === "chat") {
        currentMotion = "";
        currentUserSide = "";
    } else {
        currentMotion = motionInput.value.trim() || "未指定辩题";
        currentUserSide = document.querySelector(".side-btn.active")?.dataset.side || "正方";
    }

    localStorage.setItem("user_name", currentUserId);

    setupScreen.style.display = "none";
    debateScreen.style.display = "";
    updateHeader();
    connectWebSocket(currentUserId, currentMotion, currentUserSide, currentMode);
}

function updateHeader() {
    headerName.textContent = "小B";
    headerMode.textContent = currentMode === "chat" ? "闲聊" : currentMotion;
}

// ── WebSocket ──
function connectWebSocket(userId, motion, userSide, mode) {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(`${protocol}//${location.host}/ws/debate`);

    ws.onopen = () => {
        ws.send(JSON.stringify({
            type: "connect", user_id: userId, motion, user_side: userSide,
            mode, debate_id: debateId || null,
        }));
        messagesEl.innerHTML = "";
        addSystem("已连接");
        debateActive = true;
    };

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
    };

    ws.onclose = () => {
        addSystem("连接已断开 — 刷新页面重新连接");
        debateActive = false;
    };

    ws.onerror = () => addSystem("连接出错");
}

function handleMessage(msg) {
    removeTyping();

    switch (msg.type) {
        case "message":
            addMessage(msg.sender, msg.content, msg.is_split);
            break;
        case "typing":
            if (msg.is_typing) showTyping();
            else removeTyping();
            break;
        case "round_change":
            addSystem(`—— ${msg.label} ——`);
            break;
        case "feedback":
            addFeedback(msg.content);
            break;
        case "system":
            addSystem(msg.content);
            break;
        case "error":
            addSystem("错误：" + msg.message);
            break;
        case "debate_id":
            debateId = msg.debate_id;
            saveDebateState();
            break;
    }

    messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ── 状态持久化 ──
function saveDebateState() {
    localStorage.setItem("debate_state", JSON.stringify({
        user_id: currentUserId, motion: currentMotion,
        user_side: currentUserSide, mode: currentMode, debate_id: debateId,
    }));
}

function clearDebateState() {
    localStorage.removeItem("debate_state");
}

// ── 消息渲染 ──
function addMessage(sender, content, isSplit) {
    const now = new Date();
    const time = now.getHours().toString().padStart(2,'0') + ":" +
                 now.getMinutes().toString().padStart(2,'0');

    const div = document.createElement("div");
    div.className = `message ${sender === "ai" ? "ai" : "user"}${isSplit ? " split" : ""}`;

    const row = document.createElement("div");
    row.className = "message-row";

    const avatar = document.createElement("div");
    avatar.className = "msg-avatar";
    avatar.textContent = sender === "ai" ? "B" : currentUserId.charAt(0).toUpperCase();

    const contentDiv = document.createElement("div");
    contentDiv.className = "msg-content";

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = content;

    const timeDiv = document.createElement("div");
    timeDiv.className = "msg-time";
    timeDiv.textContent = time;

    contentDiv.appendChild(timeDiv);
    contentDiv.appendChild(bubble);
    row.appendChild(avatar);
    row.appendChild(contentDiv);
    div.appendChild(row);
    messagesEl.appendChild(div);
}

function addSystem(text) {
    const div = document.createElement("div");
    div.className = "system-msg";
    div.textContent = text;
    messagesEl.appendChild(div);
}

function addFeedback(content) {
    const div = document.createElement("div");
    div.className = "feedback-box";
    let html = content
        .replace(/^### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^## (.+)$/gm, '<h3>$1</h3>')
        .replace(/^# (.+)$/gm, '<h2>$1</h2>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
        .replace(/\|(.+)\|/g, (match) => {
            if (match.includes('---')) return '';
            const cells = match.split('|').filter(c => c.trim());
            const tag = match.includes('评分') ? 'th' : 'td';
            return '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
        })
        .replace(/(<tr>.*<\/tr>)/gs, '<table>$1</table>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');

    div.innerHTML = '<div class="title">赛后点评</div><div class="content">' + html + '</div>';
    messagesEl.appendChild(div);
}

// 打字指示器
function createTypingIndicator() {
    const div = document.createElement("div");
    div.className = "message ai typing";
    div.style.display = "none";

    const row = document.createElement("div");
    row.className = "message-row";

    const avatar = document.createElement("div");
    avatar.className = "msg-avatar";
    avatar.textContent = "B";

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';

    row.appendChild(avatar);
    row.appendChild(bubble);
    div.appendChild(row);
    return div;
}

function showTyping() {
    messagesEl.appendChild(typingDiv);
    typingDiv.style.display = "";
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function removeTyping() {
    typingDiv.style.display = "none";
}

// ── 发送 ──
function sendMessage() {
    const text = msgInput.value.trim();
    if (!text || !debateActive || !ws || ws.readyState !== WebSocket.OPEN) return;

    addMessage("user", text, false);
    ws.send(JSON.stringify({ type: "chat", content: text }));
    msgInput.value = "";
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

sendBtn.addEventListener("click", sendMessage);
msgInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
});

// ── 按钮 ──
feedbackBtn.addEventListener("click", () => {
    if (ws && debateActive) {
        ws.send(JSON.stringify({ type: "request_feedback" }));
        addSystem("请求点评中...");
    }
});

backBtn.addEventListener("click", () => {
    if (ws) ws.close();
    debateActive = false;
    clearDebateState();
    messagesEl.innerHTML = "";
    debateScreen.style.display = "none";
    setupScreen.style.display = "";
});

endBtn.addEventListener("click", () => {
    if (ws && debateActive) {
        ws.send(JSON.stringify({ type: "end_debate" }));
        debateActive = false;
        clearDebateState();
        addSystem("辩论已结束");
    }
});
