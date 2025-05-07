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
  isLoading?: boolean;
  loadingText?: string;
}

const Button = ({
  styles,
  onClick,
  text,
  type,
  icon,
  isLoading = false,
  loadingText = "Loading...",
}: Props) => {
  const defaultStyles = getButtonStyles(type || ButtonType.PRIMARY_OUTLINE);

  return (
    <button
      className={cn(defaultStyles.button, styles)}
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="flex items-center justify-center md:gap-4">
          <svg
            className={cn("animate-spin", defaultStyles.icon)}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="white"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="white"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <Typography
            text={loadingText}
            styles={defaultStyles.text}
            type={defaultStyles.textType}
          />
        </div>
      ) : icon ? (
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
