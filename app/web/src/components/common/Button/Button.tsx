import { ButtonType } from "./types";
import { getButtonStyles } from "./utils";
import { Typography } from "../Typography";
import { cn } from "@/lib/utils";

interface Props {
  styles?: string;
  onClick?: () => void;
  type?: ButtonType;
  text?: string;
  icon?: string;
}

const Button = ({ styles, onClick, text, type, icon }: Props) => {
  const defaultStyles = getButtonStyles(type || ButtonType.PRIMARY_OUTLINE);

  return (
    <button className={cn(defaultStyles.button, styles)} onClick={onClick}>
      {icon ? (
        <img
          src={icon}
          className={defaultStyles.icon}
          alt="Icon for a button from Gestura app"
        />
      ) : (
        <Typography
          text={text}
          styles={defaultStyles.text}
          type={defaultStyles.textType}
        />
      )}
    </button>
  );
};

export default Button;
