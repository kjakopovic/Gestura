import { View, Text, ScrollView } from "react-native";
import React from "react";

import ShopOption from "@/components/shop/ShopOption";

const Shop = () => {
  return (
    <ScrollView className="bg-grayscale-800">
      <ShopOption />
    </ScrollView>
  );
};

export default Shop;
