import { ImageSourcePropType, View } from "react-native";
import React from "react";
import SettingItem from "./SettingItem";
import SettingSubtitle from "./SettingSubtitle";

type SettingItemConfig = {
  title: string;
  type: "toggle" | "select" | "button";
  value?: boolean;
  selected?: boolean;
  image?: ImageSourcePropType;
  onPress?: () => void;
  onChange?: (value: boolean) => void;
};

type SettingSectionProps = {
  title: string;
  items: SettingItemConfig[];
};

const SettingSection = ({ title, items }: SettingSectionProps) => {
  return (
    <View>
      <SettingSubtitle title={title} />
      {items.map((item, index) => (
        <SettingItem
          key={`setting-item-${index}`}
          title={item.title}
          type={item.type}
          value={item.value}
          selected={item.selected}
          image={item.image}
          onPress={item.onPress}
          onChange={item.onChange}
        />
      ))}
    </View>
  );
};

export default SettingSection;
