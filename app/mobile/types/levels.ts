// Game-related types used across components
import * as icons from "@/constants/icons";
import { ImageSourcePropType } from "react-native";

export type LevelType = "normal" | "special";
export type LevelStyle = "battlepass" | "mapLevel";
export type LevelState = "locked" | "unlocked" | "completed";

export interface LevelData {
  id: number;
  level: number;
  type: LevelType;
  state: LevelState;
  icon: ImageSourcePropType;
  style?: LevelStyle;
}
