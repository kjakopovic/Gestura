import { TypographyType } from "./types";
import { getTypographyStyles } from "./utils";

const DEFAULT_EMPTY_TEXT = "Empty";

interface Props {
  styles?: string;
  type?: TypographyType;
  text?: string;
}

const Typography = ({ styles, type, text }: Props) => {
  const defaultStyles = getTypographyStyles(type || TypographyType.H1);

  if (type === TypographyType.H1) {
    return (
      <h1 className={`${defaultStyles} ${styles}`}>
        {text || DEFAULT_EMPTY_TEXT}
      </h1>
    );
  }

  return (
    <p className={`${defaultStyles} ${styles}`}>{text || DEFAULT_EMPTY_TEXT}</p>
  );
};

export default Typography;
