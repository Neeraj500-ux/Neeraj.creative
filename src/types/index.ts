export type Role = "super_admin" | "admin" | "leader" | "employee";
export type Entity = {
  id: string;
  name: string;
  status: string;
  department?: string;
  email?: string;
  role?: Role;
  assignee?: string;
  project_id?: string;
  client_id?: string;
  due?: string;
  priority?: string;
  hours?: number;
  amount?: number;
  description?: string;
  owner_id?: string;
  team_id?: string;
  created_at?: string;
  [key: string]: unknown;
};
export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  team_id: string;
  active: boolean;
};
export const statuses = [
  "To Do",
  "In Progress",
  "Internal Review",
  "Revision",
  "Completed",
];
export const departments = [
  "Creative",
  "Performance Marketing",
  "Development",
  "Content",
  "Client Servicing",
];
