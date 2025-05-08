import React from "react";
import { View, Dimensions, ActivityIndicator } from "react-native";
import Svg, { Path } from "react-native-svg";
import LevelButton from "../levels/LevelButton";
import {
  generatePathData,
  generatePathDataUpToLevel,
} from "@/utils/levelPathUtils";
import * as icons from "@/constants/icons";

const { width: screenWidth } = Dimensions.get("window");

// Interface for battlepass level data
interface BattlepassLevel {
  required_xp: number;
  level: number;
  coins: number;
}

interface BattlepassMapProps {
  levels: BattlepassLevel[];
  userBattlepassXp: number;
  onLevelPress: (level: BattlepassLevel) => void;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  claimedLevels?: number[];
}

const BattlepassMap = ({
  levels,
  userBattlepassXp,
  onLevelPress,
  onLoadMore,
  isLoadingMore = false,
  claimedLevels = [],
}: BattlepassMapProps) => {
  const pathWidth = screenWidth * 0.7;
  const levelSpacing = 230;
  const zigzagWidth = pathWidth - 32;

  // Determine the highest level the user has access to based on XP
  const determineLastUnlockedIndex = () => {
    let totalRequiredXp = 0;
    for (let i = 0; i < levels.length; i++) {
      totalRequiredXp += levels[i].required_xp;
      if (totalRequiredXp > userBattlepassXp) {
        return i - 1;
      }
    }
    return levels.length - 1; // All levels unlocked
  };

  const lastUnlockedIndex = determineLastUnlockedIndex();

  // Find the highest claimed level index
  const findLastClaimedIndex = () => {
    // Find highest claimed level
    const maxClaimed = Math.max(...claimedLevels, 0);
    // Find its index in the levels array
    return levels.findIndex((l) => l.level === maxClaimed);
  };

  const lastClaimedIndex = findLastClaimedIndex();

  // Generate green path for claimed levels
  const claimedPathData =
    lastClaimedIndex >= 0
      ? generatePathDataUpToLevel(lastClaimedIndex, zigzagWidth, levelSpacing)
      : "";

  // Determine level state based on user's progress
  const getLevelState = (index: number, level: number) => {
    if (claimedLevels.includes(level)) return "completed";
    if (index <= lastUnlockedIndex) return "unlocked";
    return "locked";
  };

  // Get appropriate icon based on level
  const getLevelIcon = (level: number) => {
    // Every 5th level gets a trophy icon
    if (level % 5 === 0) return icons.chest;
    // Alternate between star1 and star2 for other levels
    return level % 2 === 0 ? icons.coin : icons.star1;
  };

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
            stroke="#FFC800" // Gold color for battlepass path
            strokeWidth={4}
            fill="none"
          />
        )}
        {lastClaimedIndex >= 0 && (
          <Path
            d={claimedPathData}
            stroke="#89E219" // Success green color
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

            const levelState = getLevelState(index, level.level);
            const levelIcon = getLevelIcon(level.level);

            return (
              <View
                key={`bp-level-${level.level}`}
                style={{ position: "absolute", left: x, top: y }}
              >
                <LevelButton
                  style="battlepass"
                  icon={levelIcon}
                  level={level.level}
                  type={"special"}
                  state={levelState}
                  onPress={() => onLevelPress(level)}
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
            <ActivityIndicator size="large" color="#FFC800" />
          </View>
        )}
      </View>
    </View>
  );
};

export default BattlepassMap;
