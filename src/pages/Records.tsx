import { useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Download,
  ArrowUpDown,
  Pencil,
  Trash2,
  ArrowRight,
} from "lucide-react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useWorkspace, scoped } from "../services/workspace";
import { Button, Badge, Avatar, Empty, Modal } from "../components/ui";
import { Editor } from "../components/Editor";
import { TaskPanel } from "../components/TaskPanel";
import { statuses, type Entity } from "../types";
export function exportCSV(rows: Entity[], title: string) {
  const keys = ["name", "status", "due", "assignee", "hours", "amount"];
  const csv = [
    keys.join(","),
    ...rows.map((r) =>
      keys
        .map((k) => '"' + String(r[k] ?? "").replaceAll('"', '""') + '"')
        .join(","),
    ),
  ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = title + ".csv";
  a.click();
  URL.revokeObjectURL(url);
}
function Draggable({ row, onClick }: { row: Entity; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: row.id,
  });
  return (
    <article
      ref={setNodeRef}
      style={{
        transform: transform
          ? `translate(${transform.x}px,${transform.y}px)`
          : undefined,
      }}
      className="kanban-card"
    >
      <button
        className="drag-handle"
        {...listeners}
        {...attributes}
        aria-label={"Drag " + row.name}
      >
        ⠿
      </button>
      <button className="task-title" onClick={onClick}>
        {row.name}
      </button>
      <Badge value={row.priority || "Medium"} />
      <div className="flex between muted">
        <small>{row.due}</small>
        <small>{row.hours}h</small>
      </div>
    </article>
  );
}
function Column({
  status,
  rows,
  onOpen,
}: {
  status: string;
  rows: Entity[];
  onOpen: (r: Entity) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      className={"kanban-column " + (isOver ? "over" : "")}
    >
      <h3>
        {status}
        <span>{rows.length}</span>
      </h3>
      {rows.map((r) => (
        <Draggable key={r.id} row={r} onClick={() => onOpen(r)} />
      ))}
    </section>
  );
}
export default function Records({ fixedTable }: { fixedTable?: string }) {
  const params = useParams();
  const location = useLocation();
  const table = fixedTable || params.table || "tasks";
  const { data, user, save, remove } = useWorkspace();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [department, setDepartment] = useState("All");
  const [view, setView] = useState("list");
  const [edit, setEdit] = useState<Entity | null | undefined>();
  const [detail, setDetail] = useState<Entity | null>(null);
  const [page, setPage] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [error, setError] = useState("");
  let rows = [
    "tasks",
    "projects",
    "content_items",
    "requests",
    "time_entries",
  ].includes(table)
    ? scoped(data[table] || [], user)
    : data[table] || [];
  if (table === "projects" && user?.role === "employee")
    rows = (data.projects || []).filter((p) =>
      (data.tasks || []).some(
        (t) => t.project_id === p.id && t.assignee === user.id,
      ),
    );
  if (location.pathname.includes("/my-"))
    rows = rows.filter(
      (x) =>
        x.assignee === user?.id ||
        (table === "projects" &&
          (data.tasks || []).some(
            (t) => t.project_id === x.id && t.assignee === user?.id,
          )),
    );
  rows = rows
    .filter(
      (x) =>
        (x.name + " " + x.email + " " + x.description)
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (filter === "All" || x.status === filter) &&
        (department === "All" || x.department === department),
    )
    .sort((a, b) =>
      reverse ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name),
    );
  const title = table
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const canCreate = table !== "activity_logs" && (
    ["admin", "super_admin", "leader"].includes(user?.role || "") ||
    ["requests", "time_entries"].includes(table));
  const progress = (id: string) => {
    const t = (data.tasks || []).filter((x) => x.project_id === id);
    return t.length
      ? Math.round(
          (t.filter((x) => x.status === "Completed").length / t.length) * 100,
        )
      : 0;
  };
  async function drag(e: DragEndEvent) {
    if (!e.over) return;
    const row = rows.find((x) => x.id === e.active.id);
    if (row)
      try {
        await save("tasks", { ...row, status: String(e.over.id) });
      } catch (e) {
        setError((e as Error).message);
      }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR CONNECTED WORKSPACE</span>
          <h1>{title}</h1>
          <p className="muted">
            A clear view of what matters, and who's moving it forward.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setEdit(null)}>
            <Plus size={17} /> Add {table === "employees" ? "employee" : "new"}
          </Button>
        )}
      </div>
      <div className="toolbar card">
        <div className="search">
          <Search size={17} />
          <input
            aria-label="Search records"
            placeholder={"Search " + title.toLowerCase() + "…"}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <select
          aria-label="Filter status"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(0);
          }}
        >
          <option>All</option>
          {[...new Set((data[table] || []).map((x) => x.status))].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select
          aria-label="Filter department"
          value={department}
          onChange={(e) => {
            setDepartment(e.target.value);
            setPage(0);
          }}
        >
          <option>All</option>
          {[
            ...new Set(
              (data[table] || []).map((x) => x.department).filter(Boolean),
            ),
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <Button
          className="secondary icon-btn"
          aria-label="Sort by name"
          onClick={() => setReverse(!reverse)}
        >
          <ArrowUpDown size={17} />
        </Button>
        <Button className="secondary" onClick={() => exportCSV(rows, title)}>
          <Download size={16} /> Export
        </Button>
        {table === "tasks" && (
          <div className="segmented">
            <button
              aria-label="List view"
              className={view === "list" ? "active" : ""}
              onClick={() => setView("list")}
            >
              <List size={17} />
            </button>
            <button
              aria-label="Board view"
              className={view === "board" ? "active" : ""}
              onClick={() => setView("board")}
            >
              <LayoutGrid size={17} />
            </button>
          </div>
        )}
      </div>
      <p className="error">{error}</p>
      {!rows.length ? (
        <Empty />
      ) : view === "board" && table === "tasks" ? (
        <DndContext onDragEnd={drag}>
          <div className="kanban">
            {statuses.map((s) => (
              <Column
                key={s}
                status={s}
                rows={rows.filter((x) => x.status === s)}
                onOpen={setDetail}
              />
            ))}
          </div>
        </DndContext>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>
                  {table === "projects" ? "Progress" : "Owner / department"}
                </th>
                <th>
                  {["clients", "payroll", "expenses", "invoices"].includes(
                    table,
                  )
                    ? "Amount"
                    : "Due date"}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(page * 12, page * 12 + 12).map((r) => (
                <tr key={r.id}>
                  <td>
                    <button
                      className="record-name"
                      onClick={() => setDetail(r)}
                    >
                      {table === "employees" && <Avatar name={r.name} />}
                      <div>
                        <strong>{r.name}</strong>
                        <small>
                          {r.email ||
                            r.department ||
                            r.priority ||
                            r.description?.slice(0, 65)}
                        </small>
                      </div>
                    </button>
                  </td>
                  <td>
                    <Badge value={r.status} />
                  </td>
                  <td>
                    {table === "projects" ? (
                      <div className="project-progress">
                        <span>{progress(r.id)}%</span>
                        <div className="progress">
                          <i style={{ width: progress(r.id) + "%" }} />
                        </div>
                      </div>
                    ) : (
                      (data.employees || []).find((x) => x.id === r.assignee)
                        ?.name ||
                      r.department ||
                      "—"
                    )}
                  </td>
                  <td>
                    {["clients", "payroll", "expenses", "invoices"].includes(
                      table,
                    )
                      ? "₹" + (r.amount || 0).toLocaleString("en-IN")
                      : r.due || "—"}
                  </td>
                  <td>
                    <div className="flex">
                      {canCreate && (
                        <button
                          className="icon-btn"
                          aria-label={"Edit " + r.name}
                          onClick={() => setEdit(r)}
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      {table !== "activity_logs" && ["admin", "super_admin"].includes(user?.role || "") && (
                        <button
                          className="icon-btn"
                          aria-label={"Delete " + r.name}
                          onClick={async () => {
                            if (confirm("Delete " + r.name + "?"))
                              try {
                                await remove(table, r.id);
                              } catch (e) {
                                setError((e as Error).message);
                              }
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <span>{rows.length} records</span>
            <div className="flex">
              <Button
                className="secondary"
                disabled={!page}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span>
                {page + 1} / {Math.max(1, Math.ceil(rows.length / 12))}
              </span>
              <Button
                className="secondary"
                disabled={(page + 1) * 12 >= rows.length}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
      {edit !== undefined && (
        <Editor
          table={table}
          row={edit || undefined}
          onClose={() => setEdit(undefined)}
        />
      )}{" "}
      {detail &&
        (table === "tasks" ? (
          <TaskPanel task={detail} onClose={() => setDetail(null)} />
        ) : (
          <Modal title={detail.name} onClose={() => setDetail(null)}>
            <Badge value={detail.status} />
            <p className="task-description">{detail.description}</p>
            {table === "projects" && (
              <>
                <h3>Deliverables · {progress(detail.id)}% complete</h3>
                {(data.tasks || [])
                  .filter((x) => x.project_id === detail.id)
                  .map((t) => (
                    <div className="detail-row" key={t.id}>
                      <span>{t.name}</span>
                      <Badge value={t.status} />
                    </div>
                  ))}
              </>
            )}
            {table === "employees" && (
              <>
                <h3>Skills & assignment history</h3>
                <p>{detail.description}</p>
                {(data.tasks || [])
                  .filter((x) => x.assignee === detail.id)
                  .map((t) => (
                    <div className="detail-row" key={t.id}>
                      <span>{t.name}</span>
                      <Badge value={t.status} />
                    </div>
                  ))}
              </>
            )}
            {table === "notifications" && (
              <Button
                onClick={async () => {
                  await save(table, { ...detail, status: "Read" });
                  setDetail(null);
                }}
              >
                Mark as read
              </Button>
            )}
            {table === "requests" && (
              <Button
                onClick={async () => {
                  await save("tasks", {
                    name: detail.name,
                    status: "To Do",
                    description: detail.description,
                    assignee: detail.assignee,
                    project_id: detail.project_id,
                    client_id: detail.client_id,
                    due: detail.due,
                  });
                  await save("requests", { ...detail, status: "Completed" });
                  setDetail(null);
                }}
              >
                Convert to task <ArrowRight size={16} />
              </Button>
            )}
          </Modal>
        ))}
    </>
  );
}
