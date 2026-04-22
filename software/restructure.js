const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const componentsDir = path.join(srcDir, 'components');

const dirsToMake = [
  path.join(componentsDir, 'layout'),
  path.join(componentsDir, 'workflow'),
  path.join(componentsDir, 'chat'),
  path.join(componentsDir, 'terminal'),
  path.join(componentsDir, 'modals'),
  path.join(srcDir, 'store'),
  path.join(srcDir, 'hooks'),
];

dirsToMake.forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Remove unused useApp.ts
if (fs.existsSync(path.join(srcDir, 'useApp.ts'))) {
  fs.unlinkSync(path.join(srcDir, 'useApp.ts'));
}

const moves = [
  // Layout
  ['components/MenuBar.tsx', 'components/layout/MenuBar.tsx'],
  ['components/Sidebar.tsx', 'components/layout/Sidebar.tsx'],
  ['components/SidePanel.tsx', 'components/layout/SidePanel.tsx'],
  ['components/BottomPanel.tsx', 'components/layout/BottomPanel.tsx'],
  // Workflow
  ['components/WorkflowBuilder.tsx', 'components/workflow/WorkflowBuilder.tsx'],
  ['components/WorkflowCodeEditor.tsx', 'components/workflow/WorkflowCodeEditor.tsx'],
  // Chat
  ['components/AIChatPanel.tsx', 'components/chat/AIChatPanel.tsx'],
  // Terminal
  ['components/Terminal.tsx', 'components/terminal/Terminal.tsx'],
  // Modals
  ['components/ConfirmationModal.tsx', 'components/modals/ConfirmationModal.tsx'],
  ['components/ProfileModal.tsx', 'components/modals/ProfileModal.tsx'],
  ['components/PromptModal.tsx', 'components/modals/PromptModal.tsx'],
  // Store
  ['store.tsx', 'store/index.tsx'],
];

moves.forEach(([from, to]) => {
  const fromPath = path.join(srcDir, from);
  const toPath = path.join(srcDir, to);
  if (fs.existsSync(fromPath)) {
    fs.renameSync(fromPath, toPath);
  }
});

function updateImports(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      updateImports(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const relativeToSrc = path.relative(srcDir, fullPath);
      const depth = relativeToSrc.split(path.sep).length - 1;
      let storeImportPath = depth === 0 ? './store' : '../'.repeat(depth) + 'store';
      
      // Fix store imports
      content = content.replace(/from ["']\.\.\/store["']/g, `from "${storeImportPath}"`);
      content = content.replace(/from ["']\.\/store["']/g, `from "${storeImportPath}"`);
      
      // Inside App.tsx
      if (fullPath.endsWith('App.tsx')) {
        content = content.replace(/from "\.\/components\/MenuBar"/g, 'from "./components/layout/MenuBar"');
        content = content.replace(/from "\.\/components\/Sidebar"/g, 'from "./components/layout/Sidebar"');
        content = content.replace(/from "\.\/components\/SidePanel"/g, 'from "./components/layout/SidePanel"');
        content = content.replace(/from "\.\/components\/BottomPanel"/g, 'from "./components/layout/BottomPanel"');
        content = content.replace(/from "\.\/components\/AIChatPanel"/g, 'from "./components/chat/AIChatPanel"');
        content = content.replace(/from "\.\/components\/ConfirmationModal"/g, 'from "./components/modals/ConfirmationModal"');
        content = content.replace(/from "\.\/components\/PromptModal"/g, 'from "./components/modals/PromptModal"');
        content = content.replace(/from "\.\/components\/WorkflowBuilder"/g, 'from "./components/workflow/WorkflowBuilder"');
        content = content.replace(/from "\.\/components\/WorkflowCodeEditor"/g, 'from "./components/workflow/WorkflowCodeEditor"');
      }

      // Inside BottomPanel.tsx
      if (fullPath.endsWith('BottomPanel.tsx')) {
        content = content.replace(/from "\.\/Terminal"/g, 'from "../terminal/Terminal"');
      }

      fs.writeFileSync(fullPath, content);
    }
  });
}

updateImports(srcDir);
console.log('Restructured files successfully');
