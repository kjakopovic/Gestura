import { Typography, TypographyType } from "@/components/common";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  label?: string;
  type?: string;
  icon?: string;
  iconAlt?: string;
  rightIcon?: string;
  rightIconAlt?: string;
  onRightIconClick?: () => void;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Input = ({
  className,
  label,
  type,
  icon,
  iconAlt,
  rightIcon,
  rightIconAlt,
  onRightIconClick,
  placeholder,
  value,
  onChange,
}: Props) => {
  return (
    <div className={cn("mt-4", className)}>
      {label && (
        <Typography type={TypographyType.FOOTER_COPYRIGHT} text={label} />
      )}
      <div className="relative w-full">
        {icon && (
          <img
            src={icon}
            alt={iconAlt}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
          />
        )}
        <input
          type={type || "text"}
          onChange={onChange}
          value={value}
          placeholder={placeholder}
          className={cn(
            "w-full h-10 p-4 text-background-100 border-b border-background-300 focus:ring-0 focus:outline-none focus:border-b-2 focus:border-background-100",
            { "pl-10": icon }
          )}
        />
        {rightIcon && (
          <img
            src={rightIcon}
            alt={rightIconAlt}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 cursor-pointer"
            onClick={onRightIconClick}
          />
        )}
      </div>
    </div>
  );
};

export default Input;
