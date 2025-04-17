/**
 * Generate the complete zigzag path data for a level map
 */
export const generatePathData = (
  rows: number,
  zigzagWidth: number,
  levelSpacing: number
): string => {
  let pathData = `M 16,0`;
  for (let i = 0; i < rows; i++) {
    if (i % 2 === 0) {
      pathData += ` H ${zigzagWidth + 16}`;
      if (i < rows - 1) {
        pathData += ` V ${(i + 1) * levelSpacing}`;
      }
    } else {
      pathData += ` H 16`;
      if (i < rows - 1) {
        pathData += ` V ${(i + 1) * levelSpacing}`;
      }
    }
  }
  return pathData;
};

/**
 * Generate path data up to a specific level (for showing progress)
 */
export const generatePathDataUpToLevel = (
  levelIndex: number,
  zigzagWidth: number,
  levelSpacing: number
): string => {
  const row = Math.floor(levelIndex / 2);
  const isRightSide =
    row % 2 === 0 ? levelIndex % 2 === 1 : levelIndex % 2 === 0;

  let pathData = `M 16,0`;
  for (let i = 0; i <= row; i++) {
    if (i < row) {
      // Complete row
      if (i % 2 === 0) {
        pathData += ` H ${zigzagWidth + 16}`;
        pathData += ` V ${(i + 1) * levelSpacing}`;
      } else {
        pathData += ` H 16`;
        pathData += ` V ${(i + 1) * levelSpacing}`;
      }
    } else {
      // Last row (may be partial)
      if (i % 2 === 0) {
        pathData += isRightSide
          ? ` H ${zigzagWidth + 16}`
          : ` H ${(levelIndex % 2) * zigzagWidth + 16}`;
      } else {
        pathData += !isRightSide
          ? ` H 16`
          : ` H ${zigzagWidth + 16 - (levelIndex % 2) * zigzagWidth}`;
      }
    }
  }
  return pathData;
};
