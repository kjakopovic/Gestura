import { cn } from "@/utils/lib";
import { Typography, TypographyType } from "../Typography";

interface Props {
  styles?: string;
  onClick?: () => void;
  text?: string;
  type?: TypographyType;
}

const ClickableTypography = ({ styles, onClick, text, type }: Props) => (
  <button className={cn("hover:cursor-pointer", styles)} onClick={onClick}>
    <Typography text={text} type={type} />
  </button>
);

export default ClickableTypography;
