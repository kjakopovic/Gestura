import { ScrollView, Text, Image, TouchableOpacity, View } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import * as images from "@/constants/images";
import * as icons from "@/constants/icons";
import * as characters from "@/constants/characters";
import CircularProgressIndicator from "@/components/progress_indicators/CircularProgressIndicator";
import ProfileOption from "@/components/ProfileOption";
import { useRouter } from "expo-router";

const Profile = () => {
  const human = {
    name: "John Doe",
    username: "johndoe123",
    level: 1,
    xp: 1000,
    coins: 10,
    achievements: [
      {
        id: 1,
        name: "First Steps",
        description: "Complete your first lesson",
        date: "2023-01-01",
      },
      {
        id: 2,
        name: "Daily Learner",
        description: "Complete lessons for 7 consecutive days",
        date: "2023-01-07",
      },
    ],
    wordsLearned: [
      { id: 1, word: "Hello", date: "2023-01-01" },
      { id: 2, word: "World", date: "2023-01-02" },
    ],
  };

  const router = useRouter();

  return (
    <>
      <View className="w-full h-72 absolute z-10 top-0">
        <Image
          source={images.profilegradient}
          className="w-full h-72 rounded-b-2xl z-1 absolute"
        />
        <SafeAreaView>
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            className="z-10 mx-5"
          >
            <Image source={icons.cog} className="w-12 h-12" />
          </TouchableOpacity>
          <Image
            source={characters.profileCharacter}
            className="size-40 self-end z-10 mx-5 mt-2"
          />
        </SafeAreaView>
      </View>
      <ScrollView className="bg-grayscale-800 mt-64">
        <SafeAreaView>
          <View className="flex-row justify-between items-center mx-5 z-10">
            <View className="flex flex-col items-start justify-center">
              <Text className="text-white text-3xl font-interExtraBold">
                {human.name}
              </Text>
              <Text className="text-white text-lg font-interLight">
                @{human.username}
              </Text>
            </View>
            <Image source={icons.badge} className="w-16 h-16 mr-2" />
          </View>
          <View className="flex-row justify-between items-center mx-16 mt-7 z-10">
            <CircularProgressIndicator
              progress={human.xp / 100}
              level={human.level}
              type="Your"
              style="secondary"
            />
            <CircularProgressIndicator
              progress={human.coins}
              level={human.coins}
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
        </SafeAreaView>
      </ScrollView>
    </>
  );
};

export default Profile;
