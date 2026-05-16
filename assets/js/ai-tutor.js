/**
 * TLN AI Tutor — ai-tutor.js
 * Adds an AI Q&A assistant to the student homepage
 * Uses the Anthropic Claude API via a simple fetch call
 * Students can ask questions about any subject
 * Works completely in the browser — no server needed
 */

window.TLNTutor = (function() {

  // ── HTML Inject ────────────────────────────────────────────────────────────
  function inject(containerId) {
    const wrap = document.getElementById(containerId);
    if (!wrap) return;

    wrap.innerHTML = `
      <style>
        .tutor-wrap{background:#0d1117;border:1px solid #30363d;border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
        .tutor-head{background:#161b22;border-bottom:1px solid #30363d;padding:10px 16px;display:flex;align-items:center;gap:10px}
        .tutor-head-icon{width:34px;height:34px;border-radius:8px;background:linear-gradient(135deg,#7c3aed,#a855f7);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0}
        .tutor-head-text h3{font-size:.85rem;font-weight:600;color:#e6edf3;margin:0}
        .tutor-head-text p{font-size:.72rem;color:#8b949e;margin:0}
        .tutor-msgs{padding:12px;display:flex;flex-direction:column;gap:10px;max-height:320px;overflow-y:auto}
        .tutor-msg{display:flex;gap:8px}
        .tutor-av{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;flex-shrink:0}
        .tutor-av.ai{background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff}
        .tutor-av.user{background:linear-gradient(135deg,#0073e6,#00c6ff);color:#fff}
        .tutor-bubble{background:#161b22;border-radius:0 10px 10px 10px;padding:9px 12px;font-size:.8rem;line-height:1.5;color:#e6edf3;max-width:85%}
        .tutor-bubble.user{background:#0d3a6e;border-radius:10px 0 10px 10px;margin-left:auto}
        .tutor-msg.user{flex-direction:row-reverse}
        .tutor-bubble b{color:#00c6ff}
        .tutor-bubble code{background:#21262d;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:.78rem}
        .tutor-input-row{display:flex;gap:8px;padding:12px;border-top:1px solid #30363d}
        .tutor-input{flex:1;background:#21262d;border:1px solid #30363d;border-radius:8px;color:#e6edf3;padding:9px 12px;font-family:inherit;font-size:.82rem;outline:none}
        .tutor-input:focus{border-color:#7c3aed}
        .tutor-send{background:linear-gradient(90deg,#7c3aed,#a855f7);border:none;border-radius:8px;color:#fff;width:38px;height:38px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:.9rem;flex-shrink:0;transition:opacity .15s}
        .tutor-send:hover{opacity:.85}
        .tutor-send:disabled{opacity:.4;cursor:not-allowed}
        .tutor-chips{display:flex;gap:6px;flex-wrap:wrap;padding:0 12px 10px}
        .tutor-chip{background:#21262d;border:1px solid #30363d;border-radius:999px;color:#8b949e;font-size:.72rem;padding:4px 10px;cursor:pointer;transition:all .15s}
        .tutor-chip:hover{background:#30363d;color:#e6edf3;border-color:#8b949e}
        .tutor-typing{display:flex;align-items:center;gap:4px;padding:4px 2px}
        .tutor-typing span{width:6px;height:6px;border-radius:50%;background:#7c3aed;animation:tTyping .8s ease-in-out infinite}
        .tutor-typing span:nth-child(2){animation-delay:.15s}
        .tutor-typing span:nth-child(3){animation-delay:.3s}
        @keyframes tTyping{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}
        .tutor-disclaimer{font-size:.65rem;color:#6b7280;text-align:center;padding:0 12px 8px}
      </style>
      <div class="tutor-wrap">
        <div class="tutor-head">
          <div class="tutor-head-icon">🤖</div>
          <div class="tutor-head-text">
            <h3>TLN AI Tutor</h3>
            <p>Ask me anything — Maths, Science, Hindi, English…</p>
          </div>
        </div>
        <div class="tutor-msgs" id="tutorMsgs">
          <div class="tutor-msg">
            <div class="tutor-av ai">AI</div>
            <div class="tutor-bubble">
              Namaste! 🙏 I'm your AI tutor. Ask me any question about your subjects — I'll explain it clearly.<br><br>
              <b>Try asking:</b> "Explain photosynthesis", "What is Newton's 3rd law?", "Help me with fractions"
            </div>
          </div>
        </div>
        <div class="tutor-chips" id="tutorChips">
          <div class="tutor-chip" onclick="TLNTutor.ask('Explain photosynthesis simply')">Photosynthesis</div>
          <div class="tutor-chip" onclick="TLNTutor.ask('What is Newton\\'s 3rd law?')">Newton's Laws</div>
          <div class="tutor-chip" onclick="TLNTutor.ask('How to add fractions?')">Fractions</div>
          <div class="tutor-chip" onclick="TLNTutor.ask('Explain the water cycle')">Water Cycle</div>
          <div class="tutor-chip" onclick="TLNTutor.ask('What is the difference between simile and metaphor?')">Simile vs Metaphor</div>
        </div>
        <div class="tutor-input-row">
          <input class="tutor-input" id="tutorInput" type="text" placeholder="Type your question…" maxlength="500"
            onkeydown="if(event.key==='Enter'&&!event.shiftKey)TLNTutor.sendFromInput()">
          <button class="tutor-send" id="tutorSend" onclick="TLNTutor.sendFromInput()">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
        <div class="tutor-disclaimer">AI can make mistakes. Always verify important facts with your teacher.</div>
      </div>`;
  }

  // ── Message renderer ──────────────────────────────────────────────────────
  function addMsg(role, text) {
    const msgs = document.getElementById('tutorMsgs');
    if (!msgs) return;
    const div = document.createElement('div');
    div.className = 'tutor-msg' + (role === 'user' ? ' user' : '');
    div.innerHTML = `
      <div class="tutor-av ${role === 'user' ? 'user' : 'ai'}">${role === 'user' ? '👤' : 'AI'}</div>
      <div class="tutor-bubble ${role === 'user' ? 'user' : ''}">${formatText(text)}</div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function formatText(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  function showTyping() {
    const msgs = document.getElementById('tutorMsgs');
    if (!msgs) return null;
    const div = document.createElement('div');
    div.className = 'tutor-msg';
    div.id = 'tutorTyping';
    div.innerHTML = `<div class="tutor-av ai">AI</div><div class="tutor-bubble"><div class="tutor-typing"><span></span><span></span><span></span></div></div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  // ── Conversation history ──────────────────────────────────────────────────
  const history = [];
  const studentName = localStorage.getItem('studentName') || 'Student';
  const studentClass = localStorage.getItem('className') || '';

  const SYSTEM_PROMPT = `You are TLN AI Tutor, a friendly and encouraging AI tutor for Indian school students.
The student's name is ${studentName} and they are in ${studentClass || 'school'}.
Keep explanations simple, clear, and age-appropriate. Use examples from everyday Indian life when helpful.
Format responses with **bold** for key terms. Use bullet points for lists. Keep answers concise (under 150 words unless a longer explanation is truly needed).
Always encourage the student. If they seem confused, offer to explain differently.
Answer questions about all school subjects: Maths, Science, Social Studies, Hindi, English, EVS, History, Geography, Biology, Chemistry, Physics.`;

  // ── API call ──────────────────────────────────────────────────────────────
  async function callClaude(userMessage) {
    history.push({ role: 'user', content: userMessage });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: history.slice(-10) // last 10 turns for context
      })
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Sorry, I could not answer that. Please try again.';
    history.push({ role: 'assistant', content: reply });
    return reply;
  }

  // ── Public ask function ───────────────────────────────────────────────────
  async function ask(question) {
    if (!question || !question.trim()) return;

    const btn = document.getElementById('tutorSend');
    const inp = document.getElementById('tutorInput');
    if (btn) btn.disabled = true;
    if (inp) inp.disabled = true;

    addMsg('user', question);
    if (inp) inp.value = '';

    // Hide quick chips after first use
    const chips = document.getElementById('tutorChips');
    if (chips) chips.style.display = 'none';

    const typing = showTyping();

    try {
      const reply = await callClaude(question);
      if (typing) typing.remove();
      addMsg('assistant', reply);
    } catch(err) {
      if (typing) typing.remove();
      addMsg('assistant', 'I had trouble connecting. Please check your internet and try again. 🙏');
      console.error('TLN Tutor error:', err);
    }

    if (btn) btn.disabled = false;
    if (inp) { inp.disabled = false; inp.focus(); }
  }

  function sendFromInput() {
    const inp = document.getElementById('tutorInput');
    if (inp) ask(inp.value.trim());
  }

  return { inject, ask, sendFromInput };
})();
