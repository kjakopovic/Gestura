import { cn } from "@/utils/lib";

interface Props {
  styles?: string;
  alt: string;
  src: string;
  onClick?: () => void;
}

const StoreBadge = ({ alt, src, styles, onClick }: Props) => (
  <img
    src={src}
    alt={alt}
    className={cn("w-full h-full hover:cursor-pointer", styles)}
    onClick={onClick}
  />
);

export default StoreBadge;
