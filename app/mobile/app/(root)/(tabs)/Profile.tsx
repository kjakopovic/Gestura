import { ScrollView, Text, Image, TouchableOpacity, View } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import * as images from "@/constants/images";
import * as icons from "@/constants/icons";
import * as characters from "@/constants/characters";
import CircularProgressIndicator from "@/components/progress_indicators/CircularProgressIndicator";
import ProfileOption from "@/components/ProfileOption";
import { useUserStore } from "@/store/useUserStore";

const Profile = () => {
  const userData = useUserStore((state) => state.user);

  const profileInfo = {
    email: userData?.email || "John Doe",
    username: userData?.username || "johndoe123",
    level: userData?.level || 1,
    xp: userData?.xp || 0,
    xpProgress: userData?.progress || 0,
    battlePassXp: userData?.battlepass?.[0]?.xp || 0,
    achievements: userData?.achievements || [],
    wordsLearned: userData?.wordsLearned || [],
  };

  const router = useRouter();

  return (
    <>
      <View className="w-full bg-grayscale-800 h-72 z-10 top-0">
        <Image
          source={images.profilegradient}
          className="w-full h-72 rounded-b-2xl z-1 absolute"
        />
        <SafeAreaView>
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            className="z-10 mx-5 mt-4"
          >
            <Image source={icons.cog} className="w-12 h-12" />
          </TouchableOpacity>
          <Image
            source={characters.profileCharacter}
            className="size-40 mt-9 self-end z-10 mx-5"
          />
        </SafeAreaView>
      </View>
      <ScrollView className="bg-grayscale-800">
        <View className="flex-row justify-between items-center mx-5 z-10 mt-5">
          <View className="flex flex-col items-start justify-center">
            <Text className="text-white text-3xl font-interExtraBold">
              {profileInfo.username}
            </Text>
            <Text className="text-white text-lg font-interLight">
              {profileInfo.email}
            </Text>
          </View>
          <Image source={icons.badge} className="w-16 h-16 mr-2" />
        </View>
        <View className="flex-row justify-between items-center mx-16 mt-7 z-10">
          <CircularProgressIndicator
            progress={profileInfo.xpProgress}
            level={profileInfo.level}
            type="Your"
            style="secondary"
          />
          <CircularProgressIndicator
            progress={profileInfo.battlePassXp % 100}
            level={Math.floor(profileInfo.battlePassXp / 100) || 1}
            type="Battlepass"
            style="primary"
          />
        </View>
        <View className="flex-col items-center mt-7 z-10">
          <ProfileOption
            title="Words"
            icon={icons.book}
            onPress={() => {
              router.push("/Words");
            }}
          />
          <ProfileOption
            title="Achievements"
            icon={icons.trophy}
            onPress={() => {
              router.push("/Achievements");
            }}
          />
        </View>
      </ScrollView>
    </>
  );
};

export default Profile;
