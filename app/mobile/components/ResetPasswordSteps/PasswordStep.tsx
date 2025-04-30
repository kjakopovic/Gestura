import { View, Text } from "react-native";
import { Control, Controller, FieldErrors } from "react-hook-form";
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import * as icons from "@/constants/icons";
import { ForgotPasswordFormData } from "@/types/types";

interface PasswordStepProps {
  control: Control<ForgotPasswordFormData>;
  errors: FieldErrors<ForgotPasswordFormData>;
  isLoading: boolean;
  onSubmit: () => void;
}

const PasswordStep = ({
  control,
  errors,
  isLoading,
  onSubmit,
}: PasswordStepProps) => {
  return (
    <View className="w-full">
      <Text className="text-grayscale-100 mb-4">Enter your new password</Text>
      <Controller
        control={control}
        name="newPassword"
        render={({ field: { onChange, value } }) => (
          <CustomInput
            placeholder="Enter new password"
            value={value}
            onChangeText={onChange}
            icon={icons.lock}
            secureTextEntry
            className="w-[90%]"
          />
        )}
      />
      {errors.newPassword && (
        <Text className="text-error">{errors.newPassword.message}</Text>
      )}
      <Controller
        control={control}
        name="confirmNewPassword"
        render={({ field: { onChange, value } }) => (
          <CustomInput
            placeholder="Confirm new password"
            value={value}
            onChangeText={onChange}
            icon={icons.lock}
            secureTextEntry
            className="w-[90%]"
          />
        )}
      />
      {errors.confirmNewPassword && (
        <Text className="text-error">{errors.confirmNewPassword.message}</Text>
      )}
      <CustomButton
        text={isLoading ? "RESETTING..." : "RESET PASSWORD"}
        onPress={onSubmit}
        style="base"
        disabled={isLoading}
      />
    </View>
  );
};

export default PasswordStep;
