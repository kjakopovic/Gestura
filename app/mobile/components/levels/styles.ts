export const getButtonStyle = (type: string, state: string, style: string) => {
  switch (type) {
    case "normal":
      return ` ${
        state === "locked" ? "bg-grayscale-400" : "bg-secondary" // Unlocked level style
      } w-24 h-24 rounded-full`;
    case "special":
      return `${
        state === "locked"
          ? "border-grayscale-400"
          : state === "completed"
          ? "border-secondary" // Use same style as unlocked for completed
          : style === "battlepass"
          ? "border-primary"
          : "border-secondary"
      }
        rounded-2xl bg-grayscale-700 border`;
  }
};
