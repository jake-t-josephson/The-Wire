import { useContext } from "react";
import { PlayerContext } from "./playerContextValue";

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be inside PlayerProvider");
  return context;
}
