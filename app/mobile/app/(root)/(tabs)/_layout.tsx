import React from "react";
import { Tabs } from "expo-router";
import { Image, ImageSourcePropType, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as icons from "@/constants/icons";

const TabIcon = ({
  focused,
  icon,
  styles,
}: {
  focused: boolean;
  icon: ImageSourcePropType;
  styles?: string;
}) => (
  <View
    className={`justify-center items-center pb-2 ${
      focused ? "border-b-2 border-grayscale-300" : ""
    } ${styles}`}
  >
    <Image source={icon} resizeMode="contain" className="w-10 h-10" />
  </View>
);

const TabsLayout = () => {
  return (
    <GestureHandlerRootView>
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: "#999999",
            paddingTop: 20,
            backgroundColor: "#1B1C1D",
            position: "absolute",
            shadowOpacity: 0.3,
            shadowRadius: 15,
            shadowColor: "#000000",
            shadowOffset: {
              width: 10,
              height: 10,
            },
            height: 90,
          },
        }}
      >
        <Tabs.Screen
          name="Home"
          options={{
            title: "Home",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={icons.home} />
            ),
          }}
        />
        <Tabs.Screen
          name="Profile"
          options={{
            title: "Profile",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={icons.profile} />
            ),
          }}
        />
        <Tabs.Screen
          name="Premium"
          options={{
            title: "Premium",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={icons.nonPremium} />
            ),
          }}
        />
        <Tabs.Screen
          name="Inventory"
          options={{
            title: "Inventory",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={icons.chest} />
            ),
          }}
        />
        <Tabs.Screen
          name="Shop"
          options={{
            title: "Shop",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={icons.shop} />
            ),
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
};

export default TabsLayout;
