import React from "react";
import { SafeAreaView, ScrollView, View } from "react-native";
import CustomAppBar from "@/components/CustomAppBar";
//import { useUserStore } from "@/lib/store/useUserStore";
import * as icons from "@/constants/icons";
import Table from "@/components/profile/Table";
import Achievement from "@/components/profile/Achievement";
import SettingSubtitle from "@/components/settings/SettingSubtitle";

const Achievements = () => {
  //const userData = useUserStore((state) => state.user);

  // Define achievements
  const achievements = [
    {
      id: 1,
      title: "First Steps",
      description: "Complete your first lesson",
      icon: icons.trophy,
      completed: true,
    },
    {
      id: 2,
      title: "Quick Learner",
      description: "Complete 10 lessons",
      icon: icons.starTrophy,
      completed: true,
    },
    {
      id: 3,
      title: "Master Gesturer",
      description: "Learn all advanced gestures",
      icon: icons.confetti,
      completed: false,
    },
  ];

  // Filter achievements by completion status
  const completedAchievements = achievements.filter((a) => a.completed);
  const lockedAchievements = achievements.filter((a) => !a.completed);

  return (
    <>
      <CustomAppBar title="ACHIEVEMENTS" backButton />
      <ScrollView className="bg-grayscale-800 mt-24 px-10">
        <SafeAreaView className="bg-grayscale-800 flex-1">
          <View className="mb-6 mt-12">
            <SettingSubtitle title="UNLOCKED" />
            <Table>
              {completedAchievements.map((achievement) => (
                <Achievement
                  key={achievement.id}
                  title={achievement.title}
                  description={achievement.description}
                  icon={achievement.icon}
                  completed={achievement.completed}
                />
              ))}
            </Table>
          </View>

          <View className="mb-6">
            <SettingSubtitle title="LOCKED" />
            <Table>
              {lockedAchievements.map((achievement) => (
                <Achievement
                  key={achievement.id}
                  title={achievement.title}
                  description={achievement.description}
                  icon={achievement.icon}
                  completed={achievement.completed}
                />
              ))}
            </Table>
          </View>
        </SafeAreaView>
      </ScrollView>
    </>
  );
};

export default Achievements;
