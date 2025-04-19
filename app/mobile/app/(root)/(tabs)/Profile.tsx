import { View, Text, ScrollView } from "react-native";
import React from "react";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfileOption from "@/components/ProfileOption";
import * as icons from "@/constants/icons";

const Profile = () => {
  return (
    <ScrollView className="bg-grayscale-800">
      <SafeAreaView className="flex-1">
        <Text>Profile</Text>
        <Link href={"/settings"}>Settings</Link>
        <ProfileOption
          title="Achievements"
          icon={icons.trophy}
          notificationCount={12}
        />
      </SafeAreaView>
    </ScrollView>
  );
};

export default Profile;
