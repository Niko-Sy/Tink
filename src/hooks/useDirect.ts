import { useContext } from "react";
import { DirectContext } from "../context/direct";
export function useDirect() {
  const value = useContext(DirectContext);
  if (!value) throw new Error("DirectProvider is required");
  return value;
}
