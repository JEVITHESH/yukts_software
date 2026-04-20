# Antigravity AI Studio - Project Documentation (A to Z)

## 1. Project Overview
**Antigravity AI Studio** is a modern, professional IDE designed for building autonomous multi-agent workflows. It bridges the gap between low-code visual automation and high-code professional development. Users can visually design complex logic using a node-connector interface, which the AI then translates into high-performance Python code in real-time.

The core philosophy of the project is **"Autonomous Orchestration"**, where a central Main Agent analyzes tasks and delegates them to specialized sub-agents (Data, Script, Search, Action).

---

## 2. Key Features
- **Visual Workflow Builder**: A premium node-connector interface built with XYFlow (React Flow).
- **Pro Code Editor**: An integrated Monaco Editor for fine-tuning the generated Python scripts.
- **Multi-Agent System**:
  - **Main Agent (Orchestrator)**: The brain that analyzes and delegates.
  - **Data Agent**: Specialized in file parsing (Excel, CSV) and data manipulation.
  - **Script Agent**: Handles complex logic, math, and custom algorithmic tasks.
  - **Search Agent**: Real-time web and knowledge retrieval.
  - **Action Agent**: Executes final tasks like sending emails or notifications.
- **Integrated Terminal**: A real-time xterm.js terminal connected to a backend PTY (PowerShell/Bash).
- **AI Chat & Analysis**: Built-in AI assistant powered by Llama-3 (Groq) for building workflows from natural language or file uploads.
- **Bi-Directional Persistence**: Manual code edits are preserved via a "Dirty State" flag, preventing visual sync from overwriting custom logic.
- **Rule-Based Execution**: Automated command generation for terminal-based Python execution (Rule 3 & 4).
- **Enterprise UI/UX**: Dark-mode primary design with glassmorphism, responsive panels, and professional connectivity.

---

## 3. Technology Stack

### **Frontend**
- **Core**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Workflow Graph**: [@xyflow/react](https://reactflow.dev/) (Advanced node management)
- **Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/) (via @monaco-editor/react)
- **Terminal**: [@xterm/xterm](https://xtermjs.org/) with xterm-addon-fit
- **Styling**: [TailwindCSS 4](https://tailwindcss.com/), [Motion](https://motion.dev/) (Framer Motion)
- **Icons**: [Lucide-React](https://lucide.dev/)
- **Real-time**: [Socket.io-client](https://socket.io/)

### **Backend**
- **Server**: [Express](https://expressjs.com/) (running via `tsx` for TypeScript support)
- **Real-time Terminal**: [node-pty](https://github.com/microsoft/node-pty) (Pseudo-terminal for OS-level shell access)
- **Communication**: [Socket.io](https://socket.io/) (Bi-directional terminal stream)
- **File Systems**: Node `fs`, `path`, and `xlsx` for Excel parsing.
- **Execution Engine**: `child_process.spawn` for running Python/Node scripts in memory.

### **AI Engine**
- **Model**: Llama-3.3-70b-versatile (via [Groq](https://groq.com/))
- **Intelligence**: Custom agentic prompt engineering for workflow orchestration.

---

## 4. Architecture

### **State Management (`src/store.tsx`)**
The application uses a unified **Context API** pattern. It manages:
- **Graph State**: Nodes and edges for the workflow.
- **Code State**: The generated Python string.
- **UI State**: Panel widths, open modals, active tabs, and terminal logs.
- **AI State**: Message history, loading states, and agent-specific logs.

### **Node Registry (`src/components/WorkflowBuilder.tsx`)**
Over 20+ specialized node types are registered, each with a custom UI:
- **Logic**: `ConditionNode`, `LoopNode`, `SwitchNode`, `JoinNode`, `WaitNode`.
- **Agents**: `MainAgentNode`, `DataAgentNode`, `ScriptAgentNode`, `SearchAgentNode`, `ActionAgentNode`.
- **Utility**: `ExcelNode`, `EmailNode`, `FilterNode`, `SortNode`, `MergeNode`, `CollateNode`.
- **Flow Control**: `ConditionNode`, `LoopNode`, `JoinNode`, `WaitNode`.
- **Core**: `StartNode`, `EndNode`, `InputNode`.

### **Terminal & Execution (Rule 3 & 4)**
The system adheres to a strict terminal-first execution model:
- **Rule 3**: All generated code must be executed within the terminal environment to ensure environmental consistency.
- **Rule 4 (Intelligent Input)**: Terminal commands automatically collect inputs from `InputNode` UI elements and pipe them to the Python process (`echo -e ... | python ...`).
- **Sync Lock**: A state-based lock (`isInternalSync`) prevents feedback loops during rapid file modifications.

### **Terminal & Execution Pipeline**
1. **Frontend**: Xterm.js captures input and displays output.
2. **Socket.io**: Streams PTY data between the browser and server.
3. **Server**: `node-pty` spawns a persistent shell process (e.g., PowerShell on Windows).
4. **Execution API**: `/api/execute` takes raw code, creates a temporary file, and uses `spawn` to run it, streaming results via Server-Sent Events (SSE).

---

## 5. Project Structure

```text
ai-studio-editor-workflow/
├── assets/                 # User-uploaded files (Excel, CSV, etc.)
├── src/                    # Frontend source code
│   ├── components/         # React components (UI library)
│   │   ├── WorkflowBuilder.tsx     # The Visual Graph Core
│   │   ├── WorkflowCodeEditor.tsx  # Monaco Editor Wrapper
│   │   ├── AIChatPanel.tsx         # AI Assistant Interaction
│   │   ├── SidePanel.tsx           # Explorer & Properties
│   │   ├── BottomPanel.tsx         # Output, Terminal & Logs
│   │   ├── Terminal.tsx            # Xterm.js Terminal Implementation
│   │   ├── SettingsModal.tsx       # Configuration & Personalization
│   │   └── MenuBar.tsx             # Global Actions (Run, Save, Mode)
│   ├── services/           #  .io & API handlers
│   ├── store.tsx           # The Brain: Context State & Orchestration
│   ├── App.tsx             # Layout & View Management
│   └── index.css           # Design System (Glassmorphic Dark Theme)
├── server.ts               # Express Backend (PTY Terminal & File API)
├── package.json            # Scripts: `npm run dev` (Express + Vite)
├── .env                    # Credentials (GROQ_API_KEY)
└── PROJECT_DETAILS.md      # This document
```

---

## 6. Development & Implementation Detail

### **Workflow-to-Code Sync**
The `syncWorkflowToCode` function in `store.tsx` performs a **Depth-First Search (DFS)** traversal of the graph starting from the `StartNode`. It intelligently handles:
- **Branching**: `if/elif/else` blocks with indentation.
- **Loops**: `while` loops for repeating logic.
- **Join Nodes**: Identifying where branches merge back together to maintain valid Python scope.

### **Code-to-Workflow Parsing**
The AI uses a sophisticated parser to translate Python scripts back into the visual node graph. It identifies core patterns (e.g., `pd.read_excel` -> Excel Node) to ensure the visual and textual views stay in sync.

---

## 7. Getting Started

### **Prerequisites**
- Node.js (v18+)
- Python 3.x (for script execution)

### **Installation**
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment:
   Create a `.env` file in the root:
   ```env
   VITE_GROQ_API_KEY=your_groq_api_key_here
   ```

### **Running the Project**
1. Start the main app (Express + Vite):
   ```bash
   npm run dev
   ```
The app will be available at `http://localhost:3000`.

---


## 8. UI/UX Guide
- **Workflow Canvas**: Middle area for dragging and connecting nodes.
- **Left Sidebar**: Access to the Explorer, AI Chat, and Extension management.
- **Right Panel**: Detailed node properties and agent logs.
- **Bottom Panel**: Real-time Terminal for executing generated workflows.
- **MenuBar**: File actions, settings, and profile management.

---

## 9. Recent Milestones
- [x] **Recursive Factorial Orchestration**: Successfully implemented a multi-agent workflow (Main -> Script -> Action) that calculates factorials using recursive logic and error-resilient branches.
- [x] **Manual Sync Decoupling**: Integrated a `dirtyState` check to ensure manual code fine-tuning in Monaco is never accidentally overwritten by visual graph updates.
- [x] **Intelligent Terminal Piping**: Implemented Rule 4, allowing visual input values to be automatically piped into Python's `stdin` via terminal commands.

---
## 10. Future Roadmap
- [ ] **Custom Node Extensions**: Allow users to drag-and-drop their own Python scripts as reusable nodes.
- [ ] **Real-time Collaboration**: Multi-user shared canvas and shared terminal sessions.
- [ ] **Workflow Export/Import**: Full project bundling for cloud deployment.
- [ ] **GPU Acceleration**: Integration for running local LLMs via Ollama/LocalAI.

---
*Generated by Antigravity AI - Professional Multi-Agent IDE*
