import React from "react";
import { View, Dimensions, ActivityIndicator } from "react-native";
import Svg, { Path } from "react-native-svg";
import { LevelData } from "@/types/levels";
import LevelButton from "./LevelButton";
import {
  generatePathData,
  generatePathDataUpToLevel,
} from "@/utils/levelPathUtils";

const { width: screenWidth } = Dimensions.get("window");

interface LevelMapProps {
  levels: LevelData[];
  onLevelPress: (levelId: number) => void;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  pathStyle?: "battlepass" | "mapLevel";
  currentLevel?: number;
}

const LevelMap = ({
  levels,
  onLevelPress,
  onLoadMore,
  pathStyle,
  isLoadingMore = false,
  currentLevel = 1,
}: LevelMapProps) => {
  const pathWidth = screenWidth * 0.7;
  const levelSpacing = 230;
  const zigzagWidth = pathWidth - 32;

  const lastUnlockedIndex = currentLevel - 1; // Adjusted to zero-based index

  // Determine path color based on style

  const pathColor = pathStyle === "battlepass" ? "#FFC800" : "#A162FF"; // Use primary color for battlepass

  const renderLevelPath = () => {
    const rows = Math.ceil(levels.length / 2);

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
        <Path d={fullPathData} stroke="#4A4A4A" strokeWidth={4} fill="none" />

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

        <View style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
          {levels.map((level, index) => {
            const zigzagWidth = pathWidth - 30;

            const row = Math.floor(index / 2);
            const isRightSide =
              row % 2 === 0 ? index % 2 === 1 : index % 2 === 0;

            const x = isRightSide ? zigzagWidth - 28 : -26;

            const y = row * levelSpacing - 40;

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

        {isLoadingMore && (
          <View
            style={{
              position: "absolute",
              bottom: 0,
              width: "100%",
              alignItems: "center",
              paddingVertical: 10,
            }}
          >
            <ActivityIndicator size="large" color="#A162FF" />
          </View>
        )}
      </View>
    </View>
  );
};

export default LevelMap;
