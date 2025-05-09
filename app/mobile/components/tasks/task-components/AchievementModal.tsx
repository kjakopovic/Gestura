import React from "react";
import { View, Text, Image, Modal, StatusBar } from "react-native";
import CustomButton from "@/components/CustomButton";

// Define the Achievement interface
interface Achievement {
  id: string;
  title: string;
  description: string;
  image_url: string;
  type: string;
  requires: number;
}

// Define the props interface
interface AchievementModalProps {
  achievement: Achievement;
  onClose: () => void;
  isLastAchievement: boolean;
  visible: boolean;
}

export const AchievementModal = ({
  achievement,
  onClose,
  isLastAchievement,
  visible,
}: AchievementModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar translucent backgroundColor="rgba(0,0,0,0.7)" />
      <View className="flex-1 bg-black/70 justify-center items-center">
        <View className="bg-grayscale-700 rounded-2xl p-6 w-4/5 items-center">
          <Text className="text-primary text-2xl font-interBold mb-2">
            Achievement Unlocked!
          </Text>

          <Image
            source={{ uri: achievement.image_url }}
            className="w-32 h-32 my-4"
            resizeMode="contain"
          />

          <Text className="text-white text-xl font-interBold mb-1">
            {achievement.title}
          </Text>
          <Text className="text-grayscale-300 text-center mb-4">
            {achievement.description}
          </Text>

          <CustomButton
            text={isLastAchievement ? "CONTINUE" : "NEXT"}
            style="primary"
            onPress={onClose}
          />
        </View>
      </View>
    </Modal>
  );
};
