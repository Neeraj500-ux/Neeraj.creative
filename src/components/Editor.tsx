import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useWorkspace } from "../services/workspace";
import { Modal, Button } from "./ui";
import { statuses, departments, type Entity } from "../types";
import { supabase } from "../lib/supabase";
const schema = z.object({
  name: z.string().min(2, "Enter at least 2 characters"),
  description: z.string(),
  status: z.string(),
  email: z.union([z.literal(""), z.string().email()]),
  department: z.string(),
  role: z.string(),
  assignee: z.string(),
  project_id: z.string(),
  client_id: z.string(),
  due: z.string(),
  priority: z.string(),
  hours: z.coerce.number().min(0),
  amount: z.coerce.number().min(0),
});
export function Editor({
  table,
  row,
  onClose,
}: {
  table: string;
  row?: Entity;
  onClose: () => void;
}) {
  const { data, save, user, refresh } = useWorkspace();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: row?.name || "",
      description: row?.description || "",
      status: row?.status || (table === "tasks" ? "To Do" : "Active"),
      email: row?.email || "",
      department: row?.department || departments[0],
      role: row?.role || "employee",
      assignee: row?.assignee || user?.id,
      project_id: row?.project_id || "",
      client_id: row?.client_id || "",
      due: row?.due || "",
      priority: row?.priority || "Medium",
      hours: row?.hours || 0,
      amount: row?.amount || 0,
    },
  });
  async function submit(values: z.infer<typeof schema>) {
    try {
      if (table === "employees" && supabase && !row) {
        const { data: result, error } = await supabase.functions.invoke(
          "create-employee",
          { body: values },
        );
        if (error) throw error;
        if (result?.error) throw Error(result.error);
        await refresh();
      } else
        await save(table, {
          ...values,
          id: row?.id,
          role: values.role as Entity["role"],
          team_id: values.department,
        });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const options =
    table === "tasks"
      ? statuses
      : table === "projects"
        ? ["Planning", "Active", "At Risk", "On Hold", "Completed"]
        : table === "employees"
          ? ["Active", "On Leave", "Inactive"]
          : table === "payroll" || table === "invoices" || table === "expenses"
            ? ["Pending", "Processed", "Paid"]
            : [
                "Active",
                "Pending",
                "Scheduled",
                "Published",
                "Approved",
                "Rejected",
                "Completed",
              ];
  return (
    <Modal
      title={(row ? "Edit " : "Create ") + table.replaceAll("_", " ")}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(submit)}>
        <label>
          Name *<input {...register("name")} />
          <small className="error">{errors.name?.message}</small>
        </label>
        <label>
          Description / brief
          <textarea rows={3} {...register("description")} />
        </label>
        <div className="form-grid">
          <label>
            Status
            <select {...register("status")}>
              {options.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Department
            <select {...register("department")}>
              {departments.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          {["employees", "clients"].includes(table) && (
            <label>
              Email
              <input type="email" {...register("email")} />
              <small className="error">{errors.email?.message}</small>
            </label>
          )}
          {table === "employees" && (
            <label>
              Role
              <select {...register("role")}>
                <option value="employee">Employee</option>
                <option value="leader">Team Leader</option>
                {user?.role === "super_admin" && (
                  <>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </>
                )}
              </select>
            </label>
          )}
          <label>
            Owner
            <select {...register("assignee")}>
              {(data.employees || []).map((x) => (
                <option value={x.id} key={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Due date
            <input type="date" {...register("due")} />
          </label>
          {table !== "employees" && (
            <>
              <label>
                Project
                <select {...register("project_id")}>
                  <option value="">No project</option>
                  {(data.projects || []).map((x) => (
                    <option value={x.id} key={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Client
                <select {...register("client_id")}>
                  <option value="">No client</option>
                  {(data.clients || []).map((x) => (
                    <option value={x.id} key={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label>
            Priority
            <select {...register("priority")}>
              {["Low", "Medium", "High", "Urgent"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Estimated hours
            <input type="number" min="0" {...register("hours")} />
          </label>
          {["payroll", "expenses", "invoices", "clients"].includes(table) && (
            <label>
              Amount (₹)
              <input type="number" min="0" {...register("amount")} />
            </label>
          )}
        </div>
        <p className="error" role="alert">
          {error}
        </p>
        <div className="flex end">
          <Button type="button" className="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
