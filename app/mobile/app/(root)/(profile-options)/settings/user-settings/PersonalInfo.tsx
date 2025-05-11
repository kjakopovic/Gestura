import React from "react";
import { ScrollView, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomAppBar from "@/components/CustomAppBar";
import ProfileImage from "@/components/personal_info/ProfileImage";
import * as characters from "@/constants/characters";
import ProfileInfoItem from "@/components/personal_info/ProfileInfoItem";
import CustomButton from "@/components/CustomButton";
import { useUserStore } from "@/store/useUserStore";
import { mapSubscriptionToString } from "@/utils/subscriptionMapper";
import { useSettingsState } from "@/hooks/useSettingsState";

const PersonalInfo = () => {
  const userData = useUserStore((state) => state.user);

  const initialProfile = {
    username: userData?.username || "",
    email: userData?.email || "",
    phone_number: userData?.phone || userData?.phone_numer || null,
    subscription: userData?.subscription,
  };

  const {
    state: userProfile,
    setState: setUserProfile,
    hasChanges,
    saveChanges,
    isLoading,
    error,
  } = useSettingsState(initialProfile);

  const handleSaveChanges = async () => {
    const success = await saveChanges();

    if (success) {
      Alert.alert(
        "Success",
        "Your personal information has been updated successfully"
      );
    } else if (error) {
      Alert.alert("Error", error || "Failed to update personal information");
    }
  };

  return (
    <>
      <CustomAppBar title="PERSONAL INFO" backButton />
      <ScrollView className="bg-grayscale-800 mt-24 px-5">
        <SafeAreaView className="bg-grayscale-800 flex-1 items-center justify-center">
          <ProfileImage
            character={characters.profileCharacterFace}
            backgroundColor="#FF5733"
          />
          <View className="flex w-full flex-col items-center justify-center mt-8">
            <ProfileInfoItem
              name="Username"
              value={userProfile.username}
              onChange={(value) =>
                setUserProfile((prev) => ({ ...prev, username: value }))
              }
            />
            <ProfileInfoItem
              name="Email"
              value={userProfile.email}
              onChange={(value) =>
                setUserProfile((prev) => ({ ...prev, email: value }))
              }
            />
            <ProfileInfoItem
              name="Phone"
              value={userProfile.phone_number || ""}
              onChange={(value) =>
                setUserProfile((prev) => ({ ...prev, phone: value }))
              }
            />
            <ProfileInfoItem
              name="Subscription"
              value={mapSubscriptionToString(userProfile.subscription)}
              onChange={(value) => {}}
              disabled={true}
            />

            {hasChanges && (
              <View className="w-full mt-4">
                <CustomButton
                  text={isLoading ? "SAVING..." : "SAVE CHANGES"}
                  style="success"
                  onPress={handleSaveChanges}
                  noMargin
                  disabled={isLoading}
                />
              </View>
            )}
          </View>
        </SafeAreaView>
      </ScrollView>
    </>
  );
};

export default PersonalInfo;
