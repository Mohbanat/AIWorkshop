const STORAGE_KEY = "ai4all-government-workshop-v1";

const modules = [
  {
    id: "start",
    icon: "S",
    title: "Start & Participant Details",
    description: "Tell us who you are and what you want from the workshop.",
    questions: [
      { id: "name", label: "Full name", type: "text", required: true, placeholder: "Enter your name" },
      { id: "role", label: "Role / job title", type: "text", required: true, placeholder: "e.g. Policy officer" },
      { id: "goal", label: "What is one outcome you want from this workshop?", type: "textarea", required: true, placeholder: "Describe the outcome you want to achieve." }
    ]
  },
  {
    id: "patterns",
    icon: "1",
    title: "Agent Design Patterns",
    description: "Explore common patterns for reliable, human-centred AI agents.",
    questions: [
      { id: "pattern", label: "Which agent design pattern best fits your use case?", type: "select", required: true, options: ["Planner", "Retriever", "Evaluator", "Human-in-the-loop", "Workflow"] },
      { id: "why", label: "Why did you choose this pattern?", type: "textarea", required: true, placeholder: "Explain the fit, benefits, and trade-offs." }
    ]
  },
  {
    id: "loop",
    icon: "2",
    title: "The Agent Loop",
    description: "Map the sense → decide → act → evaluate loop for your agent.",
    questions: [
      { id: "sense", label: "What information will the agent sense or receive?", type: "textarea", required: true, placeholder: "Inputs, documents, requests, signals..." },
      { id: "act", label: "What action should the agent take?", type: "textarea", required: true, placeholder: "Describe the action or tool call." }
    ]
  },
  {
    id: "canvas",
    icon: "3",
    title: "Agent Design Canvas",
    description: "Define the purpose, users, boundaries, and success criteria.",
    questions: [
      { id: "purpose", label: "Agent purpose", type: "textarea", required: true, placeholder: "What problem does the agent solve?" },
      { id: "users", label: "Primary users", type: "text", required: true, placeholder: "Who will use or rely on it?" },
      { id: "guardrails", label: "Key guardrails", type: "textarea", required: true, placeholder: "Human approvals, privacy, escalation, prohibited actions..." }
    ]
  },
  {
    id: "workflow",
    icon: "4",
    title: "Agent Workflow",
    description: "Turn your concept into a clear sequence of steps.",
    questions: [
      { id: "steps", label: "Describe the workflow", type: "textarea", required: true, placeholder: "Step 1... Step 2... Step 3..." },
      { id: "handoff", label: "Where does a human need to intervene?", type: "textarea", required: true, placeholder: "Define approval, escalation, or review points." }
    ]
  },
  {
    id: "build",
    icon: "5",
    title: "Build a Simple Agent",
    description: "Capture a minimal implementation plan you could prototype.",
    questions: [
      { id: "tools", label: "What tools or data sources will your agent need?", type: "textarea", required: true, placeholder: "Search, database, document store, calculator, API..." },
      { id: "test", label: "How will you test it?", type: "textarea", required: true, placeholder: "Describe tests, evaluation criteria, and failure cases." },
      { id: "next", label: "What is the next practical step?", type: "text", required: true, placeholder: "e.g. Draft a prototype workflow" }
    ]
  }
];

const state = loadState();
let currentView = state.currentView || "start";

function defaultState() {
  return {
    currentView: "start",
    answers: {},
    evidence: []
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch (error) {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateSaveStatus("Saved locally");
}

let saveTimer;
function scheduleSave() {
  updateSaveStatus("Saving…");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveState, 250);
}

function updateSaveStatus(text) {
  const el = document.getElementById("saveStatus");
  if (el) el.querySelector("span:last-child").textContent = text;
}

function allQuestions() {
  return modules.flatMap(module => module.questions.map(q => ({ ...q, moduleId: module.id, moduleTitle: module.title })));
}

function getAnswer(questionId) {
  return state.answers[questionId] || "";
}

function setAnswer(questionId, value) {
  state.answers[questionId] = value;
  scheduleSave();
  updateProgress();
}

function isComplete(question) {
  if (!question.required) return true;
  const value = getAnswer(question.id);
  return String(value).trim().length > 0;
}

function getProgress() {
  const qs = allQuestions().filter(q => q.required);
  const completed = qs.filter(isComplete).length;
  const percent = qs.length ? Math.round((completed / qs.length) * 100) : 100;
  return { total: qs.length, completed, percent };
}

function moduleComplete(module) {
  return module.questions.filter(q => q.required).every(isComplete);
}

function renderNav() {
  const nav = document.getElementById("moduleNav");
  nav.innerHTML = "";

  modules.forEach(module => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `module-item${currentView === module.id ? " active" : ""}`;
    button.innerHTML = `
      <span class="module-icon">${module.icon}</span>
      <span class="module-label">${escapeHtml(module.title)}</span>
      <span class="module-check">${moduleComplete(module) ? "✓" : ""}</span>
    `;
    button.addEventListener("click", () => goTo(module.id));
    nav.appendChild(button);
  });

  const finalButton = document.createElement("button");
  finalButton.type = "button";
  finalButton.className = `module-item${currentView === "submission" ? " active" : ""}`;
  finalButton.innerHTML = `
    <span class="module-icon">✓</span>
    <span class="module-label">Review & Submission</span>
    <span class="module-check">${getProgress().percent === 100 ? "✓" : ""}</span>
  `;
  finalButton.addEventListener("click", () => goTo("submission"));
  nav.appendChild(finalButton);
}

function renderPage() {
  const container = document.getElementById("pageContent");
  if (currentView === "submission") {
    container.innerHTML = document.getElementById("submissionTemplate").innerHTML;
    wireSubmission();
    renderEvidence();
    updateSubmission();
    return;
  }

  const module = modules.find(m => m.id === currentView) || modules[0];
  container.innerHTML = `
    <section class="card module-card">
      <div class="card-header">
        <div>
          <div class="eyebrow">MODULE ${modules.indexOf(module) + 1}</div>
          <h2>${escapeHtml(module.title)}</h2>
          <p>${escapeHtml(module.description)}</p>
        </div>
      </div>
      <div class="module-page">
        <div class="intro">Complete the required fields below. Your responses are automatically saved in this browser.</div>
        <div class="question-grid" id="questionGrid"></div>
      </div>
    </section>
  `;

  const grid = document.getElementById("questionGrid");
  module.questions.forEach((question, index) => {
    grid.appendChild(renderQuestion(question, index + 1));
  });
}

function renderQuestion(question, number) {
  const wrapper = document.createElement("div");
  wrapper.className = "question-card";
  const required = question.required ? '<span class="required-star"> *</span>' : "";
  const hint = question.hint ? `<p class="hint">${escapeHtml(question.hint)}</p>` : "";

  const fieldId = `field-${question.id}`;
  let field = "";
  if (question.type === "textarea") {
    field = `<textarea id="${fieldId}" data-question="${question.id}" placeholder="${escapeAttr(question.placeholder || "")}">${escapeHtml(getAnswer(question.id))}</textarea>`;
  } else if (question.type === "select") {
    const options = question.options.map(option => `<option value="${escapeAttr(option)}" ${getAnswer(question.id) === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("");
    field = `<select id="${fieldId}" data-question="${question.id}"><option value="">Select an option</option>${options}</select>`;
  } else {
    field = `<input id="${fieldId}" type="text" data-question="${question.id}" value="${escapeAttr(getAnswer(question.id))}" placeholder="${escapeAttr(question.placeholder || "")}" />`;
  }

  wrapper.innerHTML = `
    <label for="${fieldId}">${number}. ${escapeHtml(question.label)}${required}</label>
    ${hint}
    ${field}
    <div class="field-footer">
      <span class="required-note">${question.required ? "Required" : "Optional"}</span>
      <span class="field-complete" data-complete-for="${question.id}">${isComplete(question) ? "Complete ✓" : ""}</span>
    </div>
  `;

  const control = wrapper.querySelector(`[data-question="${question.id}"]`);
  control.addEventListener("input", event => {
    setAnswer(question.id, event.target.value);
    wrapper.querySelector(`[data-complete-for="${question.id}"]`).textContent = isComplete(question) ? "Complete ✓" : "";
    renderNav();
    updateProgress();
  });
  control.addEventListener("change", event => {
    setAnswer(question.id, event.target.value);
    wrapper.querySelector(`[data-complete-for="${question.id}"]`).textContent = isComplete(question) ? "Complete ✓" : "";
    renderNav();
    updateProgress();
  });

  return wrapper;
}

function wireSubmission() {
  document.getElementById("reviewUnansweredBtn").addEventListener("click", () => {
    const first = allQuestions().find(q => q.required && !isComplete(q));
    if (!first) {
      toast("Everything is complete.");
      return;
    }
    goTo(first.moduleId);
    setTimeout(() => document.getElementById(`field-${first.id}`)?.focus(), 50);
  });

  document.getElementById("printPdfBtn").addEventListener("click", () => {
    preparePrintView();
    window.print();
  });

  document.getElementById("emailBtn").addEventListener("click", () => {
    const subject = encodeURIComponent("AI for Government Services — Workshop Handout");
    const body = encodeURIComponent(buildEmailBody());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    document.getElementById("emailNote").textContent = "Your email app should open with a draft. Attach the printed PDF before sending.";
  });

  document.getElementById("evidenceInput").addEventListener("change", event => {
    const files = Array.from(event.target.files || []);
    const additions = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: file.name,
      size: file.size,
      type: file.type || "file"
    }));
    state.evidence = [...state.evidence, ...additions];
    saveState();
    renderEvidence();
    event.target.value = "";
    toast(`${additions.length} evidence file${additions.length === 1 ? "" : "s"} added.`);
  });
}

function renderEvidence() {
  const list = document.getElementById("evidenceList");
  if (!list) return;
  if (!state.evidence.length) {
    list.innerHTML = '<div class="mini-note">No evidence files added yet.</div>';
    return;
  }
  list.innerHTML = "";
  state.evidence.forEach(file => {
    const item = document.createElement("div");
    item.className = "evidence-item";
    item.innerHTML = `
      <div class="evidence-meta">
        <span class="file-dot"></span>
        <div>
          <div class="file-name">${escapeHtml(file.name)}</div>
          <div class="file-size">${formatBytes(file.size)}</div>
        </div>
      </div>
      <button type="button" class="file-remove" aria-label="Remove ${escapeAttr(file.name)}">Remove</button>
    `;
    item.querySelector(".file-remove").addEventListener("click", () => {
      state.evidence = state.evidence.filter(x => x.id !== file.id);
      saveState();
      renderEvidence();
    });
    list.appendChild(item);
  });
}

function updateSubmission() {
  const { percent } = getProgress();
  const ring = document.getElementById("completionRing");
  const text = document.getElementById("completionRingText");
  const title = document.getElementById("completionTitle");
  const message = document.getElementById("completionMessage");
  if (!ring) return;

  text.textContent = `${percent}%`;
  if (percent === 100) {
    title.textContent = "Your handout is complete";
    message.textContent = "All required responses are complete. You are ready to create and email your PDF.";
  } else {
    title.textContent = "Keep going";
    message.textContent = `You have completed ${getProgress().completed} of ${getProgress().total} required responses. Finish the remaining fields to reach 100%.`;
  }
}

function updateProgress() {
  const { completed, total, percent } = getProgress();
  document.getElementById("progressPercent").textContent = `${percent}%`;
  document.getElementById("progressFill").style.width = `${percent}%`;
  document.getElementById("progressCopy").textContent = `${completed} of ${total} required responses completed.`;
  if (currentView === "submission") updateSubmission();
}

function goTo(view) {
  currentView = view;
  state.currentView = view;
  saveState();
  renderNav();
  renderPage();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function preparePrintView() {
  const { completed, total, percent } = getProgress();
  const root = document.getElementById("pageContent");
  const oldPrint = root.querySelector(".print-only");
  if (oldPrint) oldPrint.remove();

  const print = document.createElement("div");
  print.className = "print-only";
  print.innerHTML = `
    <hr />
    <h2>AI for Government Services — Completed Handout</h2>
    <p><strong>Progress:</strong> ${completed} of ${total} required responses (${percent}%)</p>
    <div>
      ${modules.map(module => `
        <h3>${escapeHtml(module.title)}</h3>
        ${module.questions.map(q => `
          <div style="margin: 0 0 14px;">
            <strong>${escapeHtml(q.label)}</strong>
            <div style="white-space: pre-wrap; margin-top: 4px;">${escapeHtml(getAnswer(q.id) || "Not answered")}</div>
          </div>`).join("")}
      `).join("")}
      <h3>Uploaded Evidence</h3>
      <p>${state.evidence.length ? state.evidence.map(e => escapeHtml(e.name)).join(", ") : "None"}</p>
    </div>
  `;
  root.appendChild(print);
}

function buildEmailBody() {
  const { completed, total, percent } = getProgress();
  const lines = [
    "Hello,",
    "",
    "Please find my completed AI for Government Services workshop handout attached.",
    "",
    `Completion: ${completed}/${total} required responses (${percent}%)`,
    `Evidence files recorded: ${state.evidence.length}`,
    "",
    "Please attach the downloaded PDF before sending.",
    "",
    "Thank you."
  ];
  return lines.join("\n");
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2200);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function escapeAttr(value) { return escapeHtml(value); }

// Reset button

document.getElementById("resetBtn").addEventListener("click", () => {
  const ok = window.confirm("Reset all workshop responses and evidence? This cannot be undone.");
  if (!ok) return;
  localStorage.removeItem(STORAGE_KEY);
  Object.assign(state, defaultState());
  currentView = "start";
  renderNav();
  renderPage();
  updateProgress();
  toast("Workshop reset.");
});

// Initial render
renderNav();
renderPage();
updateProgress();
