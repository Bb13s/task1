// 辩论 AI - WebSocket 客户端

let ws = null;
let currentMode = "free";
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
const roundLabel = document.getElementById("round-label");
const debateInfo = document.getElementById("debate-info");
const userNameInput = document.getElementById("user-name");
const motionInput = document.getElementById("motion");
const backBtn = document.getElementById("back-btn");
const typingDiv = createTypingIndicator();

// ── 设置页：选择器逻辑 ──
document.querySelectorAll(".side-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        btn.parentElement.querySelectorAll(".side-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    });
});

document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        btn.parentElement.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        // 闲聊模式隐藏辩题和立场
        const isChat = btn.dataset.mode === "chat";
        document.getElementById("debate-fields").style.display = isChat ? "none" : "";
    });
});

// ── 页面加载：检查是否有未结束的辩论 ──
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
                debateInfo.textContent = currentMode === "chat" ? "闲聊模式" : `${currentMotion} | 你：${currentUserSide}`;
                roundLabel.textContent = "重新连接中...";
                document.getElementById("back-btn").style.display = "";

                userNameInput.value = currentUserId;
                connectWebSocket(currentUserId, currentMotion, currentUserSide, currentMode);
                return;
            }
        }
    } catch (e) {
        localStorage.removeItem("debate_state");
    }

    // 正常流程：显示设置页，恢复用户名
    setupScreen.style.display = "";
    debateScreen.style.display = "none";
    const savedName = localStorage.getItem("user_name");
    if (savedName) userNameInput.value = savedName;
})();

// ── 开始辩论 ──
startBtn.addEventListener("click", startDebate);

function startDebate() {
    currentUserId = userNameInput.value.trim() || "user" + Math.random().toString(36).slice(2, 6);
    currentMode = document.querySelector(".mode-btn.active")?.dataset.mode || "chat";

    if (currentMode === "chat") {
        currentMotion = "";
        currentUserSide = "";
    } else {
        currentMotion = motionInput.value.trim() || "人工智能应不应该被限制发展";
        currentUserSide = document.querySelector(".side-btn.active")?.dataset.side || "正方";
    }

    localStorage.setItem("user_name", currentUserId);

    setupScreen.style.display = "none";
    debateScreen.style.display = "";
    debateInfo.textContent = currentMode === "chat" ? "闲聊模式" : `${currentMotion} | 你：${currentUserSide}`;
    roundLabel.textContent = "连接中...";
    backBtn.style.display = "none";

    connectWebSocket(currentUserId, currentMotion, currentUserSide, currentMode);
}

function backToSetup() {
    if (ws) ws.close();
    debateActive = false;
    clearDebateState();
    messagesEl.innerHTML = "";
    debateScreen.style.display = "none";
    setupScreen.style.display = "";
    roundLabel.textContent = "";
}

// ── WebSocket 连接 ──
function connectWebSocket(userId, motion, userSide, mode) {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(`${protocol}//${location.host}/ws/debate`);

    ws.onopen = () => {
        ws.send(JSON.stringify({
            type: "connect",
            user_id: userId,
            motion: motion,
            user_side: userSide,
            mode: mode,
            debate_id: debateId || null,     // 恢复已有辩论
        }));
        messagesEl.innerHTML = "";
        addSystem("已连接，准备辩论...");
        debateActive = true;
    };

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
    };

    ws.onclose = () => {
        addSystem("连接已断开 — 刷新页面可重新连接");
        debateActive = false;
    };

    ws.onerror = () => {
        addSystem("连接出错");
    };
}

// ── 消息处理 ──
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
            roundLabel.textContent = msg.label;
            addSystem(`--- 进入：${msg.label} ---`);
            break;
        case "feedback":
            addFeedback(msg.content);
            break;
        case "system":
            addSystem(msg.content);
            if (currentMode === "chat") roundLabel.textContent = "闲聊";
            else if (currentMode === "free") roundLabel.textContent = "自由辩论";
            break;
        case "error":
            addSystem("错误：" + msg.message);
            break;
        case "debate_id":
            // 服务器返回 debate_id，存到本地
            debateId = msg.debate_id;
            saveDebateState();
            break;
    }

    messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ── 状态持久化 ──
function saveDebateState() {
    localStorage.setItem("debate_state", JSON.stringify({
        user_id: currentUserId,
        motion: currentMotion,
        user_side: currentUserSide,
        mode: currentMode,
        debate_id: debateId,
    }));
}

function clearDebateState() {
    localStorage.removeItem("debate_state");
}

// ── UI 操作 ──
function addMessage(sender, content, isSplit) {
    const div = document.createElement("div");
    div.className = `message ${sender === "ai" ? "ai" : "user"}${isSplit ? " split" : ""}`;

    const label = document.createElement("div");
    label.className = "sender-label";
    label.textContent = sender === "ai" ? "徐经纬" : currentUserId;

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = content;

    div.appendChild(label);
    div.appendChild(bubble);
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
    // 简单 Markdown → HTML 转换
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

    div.innerHTML = `<div class="title">赛后点评</div><div class="content">${html}</div>`;
    messagesEl.appendChild(div);
}

function createTypingIndicator() {
    const div = document.createElement("div");
    div.className = "message ai";
    div.style.display = "none";

    const label = document.createElement("div");
    label.className = "sender-label";
    label.textContent = "徐经纬";

    const bubble = document.createElement("div");
    bubble.className = "typing-bubble";
    bubble.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';

    div.appendChild(label);
    div.appendChild(bubble);
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

// ── 发送消息 ──
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

// ── 按钮操作 ──
feedbackBtn.addEventListener("click", () => {
    if (ws && debateActive) {
        ws.send(JSON.stringify({ type: "request_feedback" }));
        addSystem("请求点评中...");
    }
});

backBtn.addEventListener("click", backToSetup);

endBtn.addEventListener("click", () => {
    if (ws && debateActive) {
        ws.send(JSON.stringify({ type: "end_debate" }));
        debateActive = false;
        clearDebateState();
        addSystem("辩论已结束 — 点【返回设置】开始新辩论");
        backBtn.style.display = "";
    }
});
