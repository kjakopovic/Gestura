import { TypographyType } from "../Typography";
import { ButtonStyles, ButtonType } from "./types";

export const getButtonStyles = (type: ButtonType): ButtonStyles => {
  const styles: ButtonStyles = {
    button:
      "hover:cursor-pointer rounded-xl transition-colors duration-200 ease-in-out ",
    text: "",
    icon: "h-4 w-4",
  };

  switch (type) {
    case ButtonType.PRIMARY_OUTLINE:
      styles.button +=
        "bg-background-600 hover:bg-background-500 border border-primary px-8 py-4";
      styles.text = "text-primary";
      styles.textType = TypographyType.BUTTON_NORMAL;
      break;
    case ButtonType.SECONDARY_OUTLINE:
      styles.button +=
        "bg-background-600 hover:bg-background-500 border border-background-400 px-8 py-4";
      styles.text = "text-white";
      styles.textType = TypographyType.BUTTON_NORMAL;
      break;
    case ButtonType.PRIMARY_FULL:
      styles.button += "bg-primary hover:bg-primary/80 px-15 py-4";
      styles.text = "text-background-600";
      styles.textType = TypographyType.BUTTON_BOLD;
      break;
    case ButtonType.SECONDARY_FULL:
      styles.button +=
        "bg-background-400 hover:bg-background-400/80 px-15 py-4";
      styles.text = "text-background-600";
      styles.textType = TypographyType.BUTTON_BOLD;
      break;
    case ButtonType.BASE_FULL:
      styles.button +=
        "bg-background-600 hover:bg-background-600/80 px-15 py-4 text-[10px]";
      styles.text = "text-white";
      styles.textType = TypographyType.BUTTON_BOLD;
      break;
  }

  return styles;
};
