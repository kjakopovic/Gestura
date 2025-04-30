import { View, Text } from "react-native";
import { Control, Controller, FieldErrors } from "react-hook-form";
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import * as icons from "@/constants/icons";
import { ForgotEmailFormData } from "@/types/types";

interface EmailStepProps {
  control: Control<ForgotEmailFormData>;
  errors: FieldErrors<ForgotEmailFormData>;
  isLoading: boolean;
  onSubmit: () => void;
}

const EmailStep = ({
  control,
  errors,
  isLoading,
  onSubmit,
}: EmailStepProps) => {
  return (
    <View className="w-full">
      <Text className="text-grayscale-100 mb-4">Enter your email</Text>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <CustomInput
            placeholder="Enter your email address"
            value={value}
            onChangeText={onChange}
            icon={icons.envelope}
            className="w-[90%]"
          />
        )}
      />
      {errors.email && (
        <Text className="text-error">{errors.email.message}</Text>
      )}
      <CustomButton
        text={isLoading ? "SENDING..." : "NEXT"}
        onPress={onSubmit}
        style="base"
        disabled={isLoading}
      />
    </View>
  );
};

export default EmailStep;
