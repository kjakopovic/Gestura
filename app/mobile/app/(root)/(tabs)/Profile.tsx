import { ScrollView } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import Table from "@/components/profile/Table";

const Profile = () => {
  return (
    <ScrollView className="bg-grayscale-800">
      <SafeAreaView className="flex-1 items-center justify-start">
        <Table />
      </SafeAreaView>
    </ScrollView>
  );
};

export default Profile;
