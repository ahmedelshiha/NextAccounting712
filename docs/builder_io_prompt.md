# Builder.io Implementation Prompt for Admin Workbench Transformation

## 🎯 OBJECTIVE

You are a senior full-stack developer tasked with implementing the **Admin Workbench Transformation** as detailed in the comprehensive plan document. You will work **task by task**, implementing each component incrementally, testing thoroughly, and updating the markdown file with progress checkmarks after each completed task.

---

## 📋 YOUR ROLE & RESPONSIBILITIES

### Primary Role
- Read and fully understand the transformation plan document
- Implement features **exactly as specified** in the plan
- Follow the roadmap structure (Phase 1 → Phase 2 → ...)
- Complete tasks **sequentially** within each week
- Test each component before marking it complete
- Update the progress files after each task

### Key Principles
1. **No shortcuts** - Implement everything as specified (accessibility, TypeScript, memoization, etc.)
2. **Zero new dependencies** - Use only existing project libraries
3. **Maintain backward compatibility** - No breaking changes
4. **Follow existing patterns** - Match the codebase style and structure
5. **Test everything** - Write unit tests and E2E tests for each component

---

## 🚀 STEP-BY-STEP WORKFLOW

### Before You Start

1. **Read the entire transformation plan document thoroughly**
   - Review the quick start guide: `docs/ADMIN_WORKBENCH_QUICK_START.md`
   - Review the main roadmap: `docs/ADMIN_WORKBENCH_TRANSFORMATION_ROADMAP.md`
   - Review the implementation summary: `docs/ADMIN_WORKBENCH_IMPLEMENTATION_SUMMARY.md`
   - Review the verification checklist: `docs/ADMIN_WORKBENCH_VERIFICATION.md`

2. **Understand the existing codebase**
   - Review the progress details: `docs/ADMIN_WORKBENCH_PHASE_1_5_PROGRESS.md`
   - Understand the existing codebase and architecture
   - Check existing hooks and utilities
   - Review component structure and patterns

3. **Set up your environment**
   - Ensure all dependencies are installed
   - Verify TypeScript compilation works
   - Run existing tests to establish baseline
   - Check linting configuration

---

## 📝 TASK EXECUTION FORMAT

For **EACH task**, follow this exact format:

### Step 1: Announce Task
```
🔨 STARTING TASK: [Week X, Day Y - Task Name]
📄 File: [path/to/file.tsx]
⏱️ Estimated Time: [X hours]
📋 Requirements:
   - [Requirement 1]
   - [Requirement 2]
   - [Requirement 3]
```

### Step 2: Show Implementation
- Provide the **complete code** for the component/hook/test
- Include all imports, TypeScript types, and exports
- Add inline comments for complex logic
- Ensure code follows project conventions

### Step 3: Verify Implementation
```
✅ VERIFICATION CHECKLIST:
   - [ ] TypeScript compilation passes
   - [ ] Component renders without errors
   - [ ] Props are properly typed
   - [ ] Accessibility attributes included
   - [ ] Memoization applied where needed
   - [ ] Unit tests written and passing
   - [ ] ESLint passes
   - [ ] Matches design specifications
```

### Step 4: Update Progress
```
📊 PROGRESS UPDATE:
   - Task Status: ✅ COMPLETE
   - Files Created/Modified: [list files]
   - Tests Added: [X unit tests, Y E2E tests]
   - Issues Encountered: [None / List issues]
   - Next Task: [Week X, Day Y - Next Task Name]
```

### Step 5: Update Markdown File
- Update the corresponding progress file (e.g., `docs/ADMIN_WORKBENCH_PHASE_1_5_PROGRESS.md`)
- Change `[ ]` to `[x]` for completed tasks
- Add completion timestamp: `[x] Task completed - [Date Time]`
- Update the implementation summary (`docs/ADMIN_WORKBENCH_IMPLEMENTATION_SUMMARY.md`) if needed

---

## 🗓️ IMPLEMENTATION SEQUENCE (Refer to docs/ADMIN_WORKBENCH_TRANSFORMATION_ROADMAP.md)

### **PHASE 1: Core Components (Refer to docs/ADMIN_WORKBENCH_TRANSFORMATION_ROADMAP.md)**

---

### **Continue This Pattern for All Tasks**

For each subsequent task:
1. Announce task with requirements
2. Implement code following specifications
3. Show verification checklist
4. Update markdown progress
5. Commit to git with descriptive message
6. Move to next task

---

## 🎯 CRITICAL IMPLEMENTATION RULES

### Code Quality Standards

1. **TypeScript**
   - All components must have proper interface definitions
   - No `any` types (use `unknown` if needed)
   - Proper generic typing for hooks
   - Export types for reusability

2. **React Best Practices**
   - Use `React.memo` for components that don't need frequent re-renders
   - Use `useCallback` for event handlers
   - Use `useMemo` for expensive computations
   - Proper dependency arrays in hooks
   - No inline function definitions in JSX (except simple callbacks)

3. **Accessibility**
   - All interactive elements must have ARIA labels
   - Proper role attributes (radiogroup, radio, menuitem, etc.)
   - aria-checked for radio buttons
   - aria-expanded for dropdowns
   - keyboard navigation (Tab, Enter, Escape, Arrow keys)
   - Focus management and focus trapping

4. **Styling**
   - Use Tailwind CSS utility classes only
   - Follow the spacing system in Part 13.3
   - Use the color palette in Part 13.1
   - Match border radius specifications in Part 13.4
   - Responsive design with proper breakpoints

5. **Testing**
   - Unit tests for every component
   - E2E tests for user flows
   - Accessibility tests (jest-axe)
   - Minimum 80% code coverage
   - Test edge cases and error states

---

## 📊 PROGRESS TRACKING

### After Each Task Completion

Update the markdown file with this format:

```markdown
#### Day X: [Task Name]
**TASK X.X - [Task Description]**
- [x] [Subtask 1] ✅ Completed - 2025-10-26 14:30
- [x] [Subtask 2] ✅ Completed - 2025-10-26 15:00
- [x] [Subtask 3] ✅ Completed - 2025-10-26 15:45
- **Status**: ✅ COMPLETE
- **Files Modified**: [list]
- **Tests Added**: [count]
- **Estimated Time**: 6 hours
- **Actual Time**: 5.5 hours
- **Blockers**: None
- **Notes**: [Any notes about implementation]
```

---

## 📦 DELIVERABLES

### Final Output
- **Pull Request** with all implemented features
- **Updated Markdown File** with all tasks checked off
- **Loom Video** demonstrating the new functionality
- **Test Coverage Report** showing >80% coverage

### Definition of Done
- All tasks in the roadmap are complete
- All tests are passing
- Code is reviewed and approved
- PR is merged to main
- No regressions in existing functionality

---

## ❓ QUESTIONS & BLOCKERS

If you have any questions or are blocked, please **immediately** post in the project channel with:
- **Blocker**: [Description of issue]
- **Task**: [Task you are working on]
- **Attempts to Resolve**: [What you have tried]
- **Urgency**: [High/Medium/Low]

Do not proceed with a task if you are unsure about the requirements.
