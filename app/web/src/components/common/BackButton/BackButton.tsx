import { ArrowLeft } from "lucide-react";
import { ButtonType } from "../Button";
import { getButtonStyles } from "../Button/utils";
import { Typography } from "../Typography";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  onClick?: () => void;
  type?: ButtonType;
  text?: string;
}

const BackButton = ({ className, onClick, text, type }: Props) => {
  const defaultStyles = getButtonStyles(type || ButtonType.SECONDARY_OUTLINE);

  return (
    <button
      className={cn(
        "flex items-center justify-center gap-2",
        defaultStyles.button,
        className
      )}
      onClick={onClick}
    >
      <ArrowLeft className="text-white" />
      <Typography
        text={text ?? "Back"}
        styles={defaultStyles.text}
        type={defaultStyles.textType}
      />
    </button>
  );
};

export default BackButton;
