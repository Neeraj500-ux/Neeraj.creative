import { JSDOM } from "jsdom";
import assert from "node:assert/strict";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:5173",
});
for (const name of [
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "HTMLElement",
  "HTMLInputElement",
  "MutationObserver",
  "CustomEvent",
  "HTMLSelectElement",
  "Event",
  "MouseEvent",
  "NodeFilter",
  "Node",
  "getComputedStyle",
])
  Object.defineProperty(globalThis, name, {
    value: (dom.window as any)[name],
    configurable: true,
  });
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const React = await import("react");
(globalThis as any).React = React;
const { render, screen, fireEvent, waitFor, cleanup, act } =
  await import("@testing-library/react");
const { MemoryRouter } = await import("react-router-dom");
const { Provider, useWorkspace, scoped } =
  await import("../src/services/workspace");
const { seed, demoUsers } = await import("../src/lib/seed");
const { TaskPanel } = await import("../src/components/TaskPanel");
const { Editor } = await import("../src/components/Editor");
const { Attendance, Approvals } = await import("../src/pages/Operations");
let store: ReturnType<typeof useWorkspace>;
function Capture() {
  store = useWorkspace();
  return null;
}
function mount(child: React.ReactNode) {
  return render(
    <MemoryRouter>
      <Provider>
        <Capture />
        {child}
      </Provider>
    </MemoryRouter>,
  );
}
const initial = seed();
assert.equal(initial.employees.length, 22);
assert.equal(initial.projects.length, 10);
assert.equal(initial.tasks.length, 60);
assert(
  scoped(initial.tasks, demoUsers[6]).every(
    (t) => t.assignee === demoUsers[6].id,
  ),
);
assert(
  scoped(initial.tasks, demoUsers[2]).every(
    (t) => t.team_id === demoUsers[2].team_id || t.assignee === demoUsers[2].id,
  ),
);
mount(null);
await act(async () => store.demo("u0"));
await act(async () =>
  store.save("projects", {
    name: "QA Project",
    status: "Active",
    team_id: "Creative",
  }),
);
const project = store!.data.projects.find((p) => p.name === "QA Project")!;
await act(async () =>
  store.save("tasks", {
    name: "QA deliverable",
    status: "To Do",
    project_id: project.id,
    assignee: "u6",
    team_id: "Creative",
    hours: 3,
  }),
);
const task = store!.data.tasks.find((t) => t.name === "QA deliverable")!;
assert.equal(task.project_id, project.id);
assert(store!.data.notifications.some((n) => n.assignee === "u6"));
assert(store!.data.activity_logs.length >= 2);
cleanup();
mount(<TaskPanel task={task} onClose={() => {}} />);
fireEvent.change(
  screen.getByPlaceholderText("Add context, feedback or a question…"),
  { target: { value: "Approved brand direction" } },
);
fireEvent.click(screen.getByLabelText("Send comment"));
await waitFor(() =>
  assert(
    store!.data.comments.some(
      (c) => c.description === "Approved brand direction",
    ),
  ),
);
fireEvent.click(screen.getByText("Complete task"));
await waitFor(() =>
  assert.equal(
    store!.data.tasks.find((t) => t.id === task.id)?.status,
    "Completed",
  ),
);
cleanup();
mount(<Attendance />);
fireEvent.click(screen.getByText("Check in"));
await waitFor(() => assert.equal(store!.data.attendance.length, 1));
fireEvent.click(screen.getByText("Check out"));
await waitFor(() =>
  assert.equal(store!.data.attendance[0].status, "Checked Out"),
);
cleanup();
mount(<Editor table="clients" onClose={() => {}} />);
fireEvent.change(screen.getByLabelText("Name *"), {
  target: { value: "QA Client" },
});
fireEvent.click(screen.getByText("Save changes"));
await waitFor(() =>
  assert(store!.data.clients.some((c) => c.name === "QA Client")),
);
cleanup();
mount(null);
await act(async () => store.remove("tasks", task.id));
assert(!store!.data.tasks.some((t) => t.id === task.id));
assert(
  JSON.parse(localStorage.getItem("ca-data")!).clients.some(
    (c: any) => c.name === "QA Client",
  ),
);
cleanup();
console.log(
  "PASS: seed, role scoping, project/task assignment, notifications, audit history, comments, completion, attendance, validated creation, deletion and persistence.",
);
