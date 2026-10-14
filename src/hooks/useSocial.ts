import { useContext } from "react";
import { SocialContext } from "../context/social";
export function useSocial() {
  const value = useContext(SocialContext);
  if (!value) throw new Error("SocialProvider is required");
  return value;
}
export function socialError(error: unknown): string {
  if (
    typeof error === "object" &&
    error &&
    "message" in error &&
    typeof error.message === "string"
  )
    return error.message;
  return "操作失败，请重试";
}
