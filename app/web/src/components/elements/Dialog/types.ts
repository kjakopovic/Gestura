import { ButtonType } from "@/components/common";

export interface DialogShowOptions {
  close?: boolean;
  firstButton?: boolean;
  secondButton?: boolean;
}

export interface DialogButtonOptions {
  text: string;
  onClick: () => void;
  type?: ButtonType;
}
