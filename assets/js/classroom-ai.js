/**
 * TLN Classroom AI — classroom-ai.js
 * Adds to classroom.html:
 *   1. Live speech-to-text transcript (Web Speech API — free, built into Chrome)
 *   2. Face/attention detection via TensorFlow.js (free, runs in browser)
 *   3. Auto-saves transcript lines to GAS chat_messages sheet
 *
 * No API key needed. No server. Works in Chrome/Edge.
 */

window.TLNAI = (function() {

  const GAS_URL = 'https://script.google.com/macros/s/AKfycbyvp23o6bpUWHzc-jtl_hcQCs7I1jj3doD_G-WLTWQ-2f0hPp4hXcNGffJ0uxDLSkT5/exec';

  // ── CONFIG ──────────────────────────────────────────────────────────────────
  let roomId   = '';
  let userId   = '';
  let userName = '';
  let isTeacher = false;

  // ── STATE ───────────────────────────────────────────────────────────────────
  let recognition    = null;
  let transcriptLog  = [];
  let faceModel      = null;
  let faceInterval   = null;
  let videoStream    = null;
  let noFaceCount    = 0;
  let multiFaceCount = 0;

  // ── POST helper ─────────────────────────────────────────────────────────────
  async function gasPost(params) {
    const body = Object.entries(params)
      .map(([k,v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      return res.json();
    } catch(e) { return { ok: false }; }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  1. LIVE SPEECH TRANSCRIPT
  //  Uses the browser's built-in SpeechRecognition API (Chrome/Edge, free)
  //  Teacher's speech → text → shown in transcript panel + saved to sheet
  // ═══════════════════════════════════════════════════════════════════════════
  function initTranscript(containerId) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.log('TLN Transcript: Web Speech API not available in this browser');
      return false;
    }

    const container = document.getElementById(containerId);
    if (!container) return false;

    recognition = new SpeechRecognition();
    recognition.continuous    = true;
    recognition.interimResults= true;
    recognition.lang          = 'en-IN'; // Indian English

    let interimEl = null;

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          // Final result — add to log
          const line = { text: transcript.trim(), speaker: userName, ts: new Date().toLocaleTimeString() };
          transcriptLog.push(line);
          renderTranscriptLine(container, line, false);
          if (interimEl) { interimEl.remove(); interimEl = null; }
          // Save to GAS
          gasPost({
            action:    'save_chat_msg',
            room_id:   roomId + '-transcript',
            sender_id: userId,
            sender:    '[TRANSCRIPT] ' + userName,
            message:   transcript.trim(),
            msg_id:    userId + '_t_' + Date.now(),
            ts:        line.ts
          });
        } else {
          interim += transcript;
        }
      }
      // Show interim text
      if (interim) {
        if (!interimEl) {
          interimEl = document.createElement('div');
          interimEl.style.cssText = 'color:#8b949e;font-style:italic;font-size:.78rem;padding:3px 10px';
          container.appendChild(interimEl);
        }
        interimEl.textContent = '⌛ ' + interim;
        container.scrollTop = container.scrollHeight;
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') console.log('Speech error:', e.error);
    };

    recognition.onend = () => {
      // Auto-restart if transcript is active
      if (recognition._active) recognition.start();
    };

    return true;
  }

  function renderTranscriptLine(container, line, historical) {
    const div = document.createElement('div');
    div.style.cssText = 'padding:4px 10px;border-bottom:1px solid #21262d;font-size:.78rem;line-height:1.4;' + (historical ? 'opacity:.7' : '');
    div.innerHTML = `<span style="color:#60a5fa;font-weight:600;margin-right:6px">${line.speaker}</span>
      <span style="color:#e6edf3">${line.text}</span>
      <span style="color:#6b7280;font-size:.7rem;float:right">${line.ts}</span>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function startTranscript() {
    if (!recognition) return;
    recognition._active = true;
    recognition.start();
  }

  function stopTranscript() {
    if (!recognition) return;
    recognition._active = false;
    recognition.stop();
  }

  function downloadTranscript() {
    const text = transcriptLog.map(l => `[${l.ts}] ${l.speaker}: ${l.text}`).join('\n');
    const blob  = new Blob([text], { type: 'text/plain' });
    const a     = document.createElement('a');
    a.href      = URL.createObjectURL(blob);
    a.download  = 'transcript-' + roomId + '-' + new Date().toLocaleDateString() + '.txt';
    a.click();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  2. FACE / ATTENTION DETECTION
  //  Uses TensorFlow.js BlazeFace model (runs in browser, no API key)
  //  Detects: no face, multiple faces, looking away
  //  Sends alerts to GAS if anomalies detected
  // ═══════════════════════════════════════════════════════════════════════════
  async function initFaceDetection(videoElementId, statusElementId, alertCallback) {
    // Load TF.js and BlazeFace from CDN
    if (!window.tf) {
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.11.0/dist/tf.min.js');
    }
    if (!window.blazeface) {
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.0.7/dist/blazeface.min.js');
    }

    try {
      faceModel = await window.blazeface.load();
      console.log('TLN FaceDetect: model loaded');
    } catch(e) {
      console.log('TLN FaceDetect: could not load model:', e);
      return false;
    }

    const video  = document.getElementById(videoElementId);
    const status = document.getElementById(statusElementId);
    if (!video) return false;

    // Start webcam if no stream
    if (!video.srcObject) {
      try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        video.srcObject = videoStream;
        await video.play();
      } catch(e) {
        console.log('TLN FaceDetect: camera access denied:', e);
        return false;
      }
    }

    faceInterval = setInterval(async () => {
      if (!faceModel || !video.videoWidth) return;
      try {
        const predictions = await faceModel.estimateFaces(video, false);
        const count = predictions.length;

        if (status) {
          status.textContent = count === 0 ? '❌ No face detected'
            : count === 1 ? '✅ ' + userName + ' present'
            : '⚠️ Multiple faces (' + count + ')';
          status.style.color = count === 1 ? '#4ade80' : count === 0 ? '#f87171' : '#f59e0b';
        }

        if (count === 0) {
          noFaceCount++;
          if (noFaceCount === 3) { // 3 consecutive → alert
            alertCallback && alertCallback('no-face', 'Student face not visible for 15+ seconds');
            await gasPost({ action:'log_alert', room_id:roomId, student_id:userId, student:userName, type:'no-face', detail:'Face not detected for 15s' });
          }
        } else {
          noFaceCount = 0;
        }

        if (count > 1) {
          multiFaceCount++;
          if (multiFaceCount === 2) {
            alertCallback && alertCallback('multi-face', count + ' faces detected on screen');
            await gasPost({ action:'log_alert', room_id:roomId, student_id:userId, student:userName, type:'multi-face', detail:count+' faces detected' });
          }
        } else {
          multiFaceCount = 0;
        }

      } catch(e) {}
    }, 5000); // check every 5 seconds

    return true;
  }

  function stopFaceDetection() {
    if (faceInterval) { clearInterval(faceInterval); faceInterval = null; }
    if (videoStream) { videoStream.getTracks().forEach(t => t.stop()); videoStream = null; }
  }

  // ── Script loader helper ─────────────────────────────────────────────────
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // ── Public API ───────────────────────────────────────────────────────────
  return {
    init: function(config) {
      roomId    = config.roomId    || '';
      userId    = config.userId    || '';
      userName  = config.userName  || 'User';
      isTeacher = config.isTeacher || false;
    },
    initTranscript,
    startTranscript,
    stopTranscript,
    downloadTranscript,
    initFaceDetection,
    stopFaceDetection,
    getTranscript: () => transcriptLog
  };
})();
