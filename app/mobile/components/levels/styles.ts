export const getButtonStyle = (type: string, state: string, style: string) => {
  switch (type) {
    case "normal":
      return ` ${
        state === "locked" ? "bg-grayscale-400" : "bg-secondary"
      } w-24 h-24 rounded-full`;
    case "special":
      return `${
        state === "locked"
          ? "border-grayscale-400"
          : style === "battlepass"
          ? state === "unlocked"
            ? "border-primary"
            : state === "completed"
            ? "border-success"
            : "border-grayscale-400"
          : "border-secondary"
      }
        rounded-2xl bg-grayscale-700 border`;
  }
};
