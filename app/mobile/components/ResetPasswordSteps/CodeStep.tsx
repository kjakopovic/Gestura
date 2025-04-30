import { View, Text, TextInput } from "react-native";
import React, { RefObject } from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import CustomButton from "@/components/CustomButton";
import { ForgotCodeFormData } from "@/types/types";

interface CodeStepProps {
  control: Control<ForgotCodeFormData>;
  errors: FieldErrors<ForgotCodeFormData>;
  isLoading: boolean;
  onSubmit: () => void;
  email: string;
  digitRefs: RefObject<TextInput>[];
}

const CodeStep = ({
  control,
  errors,
  isLoading,
  onSubmit,
  email,
  digitRefs,
}: CodeStepProps) => {
  return (
    <View className="w-full">
      <Text className="text-grayscale-100 mb-4">
        Enter the 6-digit code sent to {email}
      </Text>
      <View className="flex-row justify-between">
        {[1, 2, 3, 4, 5, 6].map((num, index) => (
          <Controller
            key={num}
            control={control}
            name={`digit${num}` as keyof ForgotCodeFormData}
            render={({ field: { onChange, value } }) => (
              <TextInput
                ref={digitRefs[index]}
                value={value}
                onChangeText={(text) => {
                  onChange(text);
                  if (text && index < digitRefs.length - 1) {
                    digitRefs[index + 1].current?.focus();
                  }
                }}
                className="w-14 h-14 rounded-xl mx-2 text-grayscale-100 text-center border border-grayscale-300 focus:ring-0 focus:outline-none focus:border-2 focus:border-grayscale-100"
                maxLength={1}
                keyboardType="number-pad"
              />
            )}
          />
        ))}
      </View>
      {/* Display first encountered error (if any) */}
      {Object.values(errors)[0] && (
        <Text className="text-error">
          {(Object.values(errors)[0] as any)?.message}
        </Text>
      )}
      <CustomButton
        text={isLoading ? "VERIFYING..." : "VERIFY"}
        onPress={onSubmit}
        style="base"
        disabled={isLoading}
      />
    </View>
  );
};

export default CodeStep;
