import { Button, ButtonType } from "@/components/common";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Dialog as ShadcnDialog,
} from "@/components/ui/Dialog";
import { DialogButtonOptions, DialogShowOptions } from "./types";

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  title?: string;
  description?: string;
  show?: DialogShowOptions;
  firstButton?: DialogButtonOptions;
  secondButton?: DialogButtonOptions;
}

const Dialog = ({
  open,
  setOpen,
  title,
  description,
  show,
  firstButton,
  secondButton,
}: Props) => {
  return (
    <ShadcnDialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          {title && (
            <DialogTitle className="gestura-text-landing-title">
              {title}
            </DialogTitle>
          )}
          {description && (
            <DialogDescription className="gestura-text-footer">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4"></div>
          <div className="grid grid-cols-4 items-center gap-4"></div>
        </div>
        <DialogFooter className="w-full flex flex-row items-center justify-between">
          {show?.firstButton && (
            <Button
              type={firstButton?.type}
              text={firstButton?.text}
              onClick={firstButton?.onClick}
              styles="py-3 px-10"
            />
          )}
          {show?.secondButton && (
            <Button
              type={secondButton?.type}
              text={secondButton?.text}
              onClick={secondButton?.onClick}
              styles="py-3 px-10"
            />
          )}
          {show?.close && (
            <Button
              type={ButtonType.SECONDARY_OUTLINE}
              text="Close"
              styles="py-2.5 px-10"
              onClick={() => setOpen(false)}
            />
          )}
        </DialogFooter>
      </DialogContent>
    </ShadcnDialog>
  );
};

export default Dialog;
