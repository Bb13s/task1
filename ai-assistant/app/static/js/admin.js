// 管理面板

document.addEventListener("DOMContentLoaded", () => {
    loadCharacters();
    loadKnowledge();
    loadDebates();
});

// ── 角色管理 ──

async function loadCharacters() {
    try {
        const res = await fetch("/api/characters");
        const data = await res.json();
        const list = document.getElementById("char-list");
        list.innerHTML = data.characters.map(c => `
            <div class="char-card ${c.active ? 'active' : ''}">
                <span class="char-name">${c.name}</span>
                ${c.active
                    ? '<span class="badge">当前</span>'
                    : `<button class="btn-sm" onclick="switchChar('${c.id}')">切换</button>`
                }
            </div>
        `).join("");
    } catch (e) {
        document.getElementById("char-list").innerHTML = "加载失败";
    }
}

async function switchChar(id) {
    try {
        const res = await fetch("/api/characters/switch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        const data = await res.json();
        if (data.status === "ok") {
            loadCharacters();
        }
    } catch (e) {
        alert("切换失败");
    }
}

// ── 知识库 ──

async function loadKnowledge() {
    try {
        const res = await fetch("/api/knowledge");
        const data = await res.json();
        const s = data.stats;

        document.getElementById("kb-stats").innerHTML = `
            <div class="stat-row">
                <span class="stat-label">总文档数</span>
                <span class="stat-value">${s.total_docs}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">FTS5 关键词搜索</span>
                <span class="stat-value">${s.fts_ready ? "✅ 正常" : "❌ 未就绪"}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">ChromaDB 语义搜索</span>
                <span class="stat-value">${s.chroma_ready ? "✅ 正常" : "⚠️ 未安装"}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">辩题数</span>
                <span class="stat-value">${s.motions.length}</span>
            </div>
        `;

        // 文档列表
        const docs = data.documents || [];
        document.getElementById("kb-docs").innerHTML = `
            <h3>文档列表</h3>
            <table>
                <tr><th>文档</th><th>立场</th><th>类型</th><th>触发词</th></tr>
                ${docs.map(d => `
                    <tr>
                        <td>${d.path}</td>
                        <td>${d.side}</td>
                        <td>${d.type}</td>
                        <td>${(d.triggers || []).slice(0,4).join(", ")}</td>
                    </tr>
                `).join("")}
            </table>
        `;
    } catch (e) {
        document.getElementById("kb-stats").innerHTML = "加载失败";
    }
}

// ── 辩论存档 ──

async function loadDebates() {
    try {
        const res = await fetch("/api/debates");
        const data = await res.json();
        const debates = data.debates || [];

        if (debates.length === 0) {
            document.getElementById("debate-list").innerHTML = "<p style='color:#666'>暂无辩论记录</p>";
            return;
        }

        document.getElementById("debate-list").innerHTML = `
            <table>
                <tr><th>时间</th><th>辩题</th><th>立场</th><th>消息数</th><th>点评</th><th></th></tr>
                ${debates.map(d => `
                    <tr>
                        <td>${(d.created || "").slice(0,16)}</td>
                        <td>${d.motion || "闲聊"}</td>
                        <td>${d.user_side || "-"}</td>
                        <td>${d.messages}</td>
                        <td>${d.has_feedback ? "✅" : "-"}</td>
                        <td><button class="btn-sm" onclick="viewDebate('${d.id}')">查看</button></td>
                    </tr>
                `).join("")}
            </table>
        `;
    } catch (e) {
        document.getElementById("debate-list").innerHTML = "加载失败";
    }
}

async function viewDebate(id) {
    try {
        const res = await fetch(`/api/debates/${id}`);
        const data = await res.json();

        let html = `<h3>辩论详情</h3>
            <p>辩题：${data.motion || "闲聊"} | 用户持${data.user_side || "-"} | AI持${data.ai_side || "-"}</p>
            <div class="debate-transcript">`;

        for (const [round, msgs] of Object.entries(data.rounds || {})) {
            html += `<h4>${round}</h4>`;
            for (const m of msgs) {
                const speaker = m.speaker === "ai" ? "徐经纬" : "你";
                html += `<p><strong>${speaker}：</strong>${m.content}</p>`;
            }
        }
        html += "</div>";

        if (data.feedback) {
            html += `<div class="feedback-box"><div class="title">赛后点评</div><div class="content">${data.feedback}</div></div>`;
        }

        html += `<br><button class="btn-sm" onclick="document.getElementById('debate-detail').style.display='none'">关闭</button>`;

        const detail = document.getElementById("debate-detail");
        detail.innerHTML = html;
        detail.style.display = "";
        detail.scrollIntoView();
    } catch (e) {
        alert("加载失败");
    }
}
