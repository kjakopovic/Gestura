import { View, Dimensions } from "react-native";
import Svg, { Path } from "react-native-svg";
import { LevelData } from "@/types/levels";
import LevelButton from "./LevelButton";

// Getting the width of the device screen
const { width: screenWidth } = Dimensions.get("window");

interface LevelMapProps {
  levels: LevelData[];
  onLevelPress: (levelId: number) => void;
}

const LevelMap = ({ levels, onLevelPress }: LevelMapProps) => {
  // Setting up the dimensions for our level path
  const pathWidth = screenWidth * 0.7; // Using 70% of screen width to ensure the path fits on all devices
  const levelSpacing = 230;
  const zigzagWidth = pathWidth - 32;

  // Centering handles the margins for us

  const renderLevelPath = () => {
    // Building the zigzag line for our level path
    let pathData = `M 16,0`;

    // Determining how many rows we need based on level count
    const rows = Math.ceil(levels.length / 2);

    // Creating the zigzag pattern for the level path
    for (let i = 0; i < rows; i++) {
      // For rows starting with 0, 2, 4, etc.
      if (i % 2 === 0) {
        // Draw line to the right side
        pathData += ` H ${zigzagWidth + 16}`;
        // Add vertical line if there are more rows below
        if (i < rows - 1) {
          pathData += ` V ${(i + 1) * levelSpacing}`;
        }
      } else {
        // Draw line to the left side
        pathData += ` H 16`;
        // Add vertical line if there are more rows below
        if (i < rows - 1) {
          pathData += ` V ${(i + 1) * levelSpacing}`;
        }
      }
    }

    return (
      <Svg width={pathWidth} height={rows * levelSpacing}>
        <Path d={pathData} stroke="#4A4A4A" strokeWidth={4} fill="none" />
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
            // Calculating position of each level button
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
