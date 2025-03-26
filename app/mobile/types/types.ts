import * as z from "zod";
import { loginSchema } from "@/schemas/authSchemas";
import { registerSchema } from "@/schemas/authSchemas";

export type LoginFormData = z.infer<typeof loginSchema>;

export type RegisterFormData = z.infer<typeof registerSchema>;
