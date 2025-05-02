import React from "react";
import { View, Dimensions } from "react-native";
import Svg, { Path } from "react-native-svg";
import { LevelData } from "@/types/levels";
import LevelButton from "./LevelButton";
import {
  generatePathData,
  generatePathDataUpToLevel,
} from "@/utils/levelPathUtils";

// Getting the width of the device screen
const { width: screenWidth } = Dimensions.get("window");

interface LevelMapProps {
  levels: LevelData[];
  onLevelPress: (levelId: number) => void;
  pathStyle?: "default" | "battlepass";
}

const LevelMap = ({ levels, onLevelPress, pathStyle }: LevelMapProps) => {
  // Setting up the dimensions for our level path
  const pathWidth = screenWidth * 0.7; // Using 70% of screen width to ensure the path fits on all devices
  const levelSpacing = 230;
  const zigzagWidth = pathWidth - 32;

  // Find the index of the last unlocked level
  const lastUnlockedIndex = levels.map((l) => l.state).lastIndexOf("unlocked");

  // Determine path color based on style

  const pathColor = pathStyle === "battlepass" ? "#FFC800" : "#A162FF"; // Use primary color for battlepass

  const renderLevelPath = () => {
    // Determining how many rows we need based on level count
    const rows = Math.ceil(levels.length / 2);

    // Path data for unlocked and locked portions
    const unlockedPathData =
      lastUnlockedIndex >= 0
        ? generatePathDataUpToLevel(
            lastUnlockedIndex,
            zigzagWidth,
            levelSpacing
          )
        : "";
    const fullPathData = generatePathData(rows, zigzagWidth, levelSpacing);

    return (
      <Svg width={pathWidth} height={rows * levelSpacing}>
        {/* Render the full path in gray (locked) */}
        <Path d={fullPathData} stroke="#4A4A4A" strokeWidth={4} fill="none" />

        {/* Render the unlocked portion of the path in a different color */}
        {lastUnlockedIndex >= 0 && (
          <Path
            d={unlockedPathData}
            stroke={pathColor}
            strokeWidth={4}
            fill="none"
          />
        )}
      </Svg>
    );
  };

  return (
    <View
      style={{
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={{ width: pathWidth }}>
        {renderLevelPath()}

        {/* Placing level buttons on top of the path */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
          {levels.map((level, index) => {
            const zigzagWidth = pathWidth - 30;

            // Determining which row the level belongs to (2 levels per row)
            const row = Math.floor(index / 2);
            const isRightSide =
              row % 2 === 0 ? index % 2 === 1 : index % 2 === 0;

            // Setting horizontal position based on left/right placement
            const x = isRightSide ? zigzagWidth - 28 : -26;

            // Setting vertical position based on row number
            const y = row * levelSpacing - 40; // Adjusting to center the button

            return (
              <View
                key={level.id}
                style={{ position: "absolute", left: x, top: y }}
              >
                <LevelButton
                  style={level.style || "mapLevel"}
                  icon={level.icon}
                  level={level.level}
                  type={level.type}
                  state={level.state}
                  onPress={() => onLevelPress(level.id)}
                />
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default LevelMap;
