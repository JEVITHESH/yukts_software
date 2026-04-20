# Workflow Rules

## 1. Code Persistence
**Description:** User-written code must not be automatically deleted or modified.
- Code remains unchanged unless explicitly removed by the user.
- System must not override, sanitize, or auto-edit user code.

## 2. Code Deletion
**Description:** Only user-intended code should be removed.
- If user deletes code, only the selected/targeted portion is removed.
- No cascading deletion (i.e., deleting one block must not affect others).
- Undo support should be available.

## 3. Code Execution
**Description:** All code must execute via terminal environment.
- Code execution must occur in terminal (not browser runtime).
- Execution command should be generated automatically.
- Errors and logs must be shown in terminal output.

## 4. Input Handling
**Description:** Input should be handled intelligently between workflow UI and terminal.
- If user provides input in workflow UI:
    - Do NOT prompt again in terminal.
    - Pass input directly as arguments or stdin.
- If no input is provided in workflow:
    - Prompt user in terminal.
- **Input priority:**
    1. Workflow input
    2. Terminal input

## 5. Terminal Behavior
**Description:** Terminal acts as the single source of execution truth.
- Always display:
    - Execution logs
    - Errors
    - User prompts (if needed)
- Maintain session state (do not reset unless user requests)

## 6. Safety Constraints
**Description:** Prevent unintended destructive actions.
- No automatic file deletion
- No silent overwrites
- Require confirmation for destructive operations

# 🔒 Code Integrity Guideline

## 📌 Objective
Ensure that when a user writes code, it is executed or displayed exactly as written—without any modification, injection, or alteration.

---

## 🧠 Core Principle
User-written code must be treated as **final and authoritative**.
No system, workflow, or external process should:
* Modify the code
* Insert additional logic
* Replace variables or structure
* Wrap it with unrelated templates

---

## ⚠️ Problem Statement
Unexpected changes in code usually happen due to:
* Automated workflows inserting extra blocks
* Editor or platform templates overriding content
* Background processes modifying execution flow

This breaks trust and leads to confusion.

---

## ✅ Expected Behavior
When a user provides code:
* It should remain exactly the same
* Only the intended output should be displayed
* No hidden or additional operations should run

---

## 🚫 What Must NOT Happen
* Adding loops, conditions, or print statements
* Injecting “workflow” or system-generated code
* Replacing user-defined variables
* Altering formatting or indentation logic

---

## 💡 Best Practice
Systems handling user code should:
* Respect input as read-only
* Execute in isolation
* Avoid any automatic transformation
* Clearly separate user code from system logic

---

## 🎯 Conclusion
If a user writes code, that code is the source of truth.
Anything that changes it—directly or indirectly—is a flaw, not a feature.

