import { Session, User } from "@supabase/supabase-js";
import { ResetPasswordInput } from "@menu-digital/contracts";

export type AuthContextData = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isPasswordRecovery: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordRecovery: (email: string) => Promise<boolean>;
  updatePassword: (input: ResetPasswordInput) => Promise<boolean>;
  finishPasswordRecovery: () => void;
  signOut: () => Promise<void>;
};
