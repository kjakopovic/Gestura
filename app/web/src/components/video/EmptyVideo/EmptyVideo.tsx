import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  colorIndex?: number;
  letter?: string;
}

const COLORS = [
  "bg-red-200",
  "bg-blue-200",
  "bg-green-200",
  "bg-yellow-200",
  "bg-purple-200",
  "bg-pink-200",
];

const EmptyVideo = ({ className, colorIndex, letter }: Props) => {
  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center",
        `${COLORS[colorIndex || 0]}/70`,
        className
      )}
    >
      <div
        className={cn("w-[50%] h-[50%] rounded-full", COLORS[colorIndex || 0])}
      >
        {letter}
      </div>
    </div>
  );
};

export default EmptyVideo;
