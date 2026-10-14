export type ActiveView =
  | { kind: "home" }
  | { kind: "contacts"; userId?: string }
  | { kind: "direct"; roomId?: string }
  | { kind: "group"; roomId: string };
