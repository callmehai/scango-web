export interface Message {
  /** Server-assigned uuid. Optional for in-flight messages built client-side. */
  id?: string;
  role: "system" | "user" | "assistant";
  content: string;
  createdAt: string;
}

/** Backend user DTO returned by /api/me and auth endpoints. */
export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user" | "tester";
  plan: string;
  status: "active" | "suspended" | "deleted";
  emailVerified: boolean;
  createdAt: string;
}
