import { Text, ScrollView } from "react-native";
import React from "react";

import ShopOption from "@/components/shop/ShopOption";
import ChestOption from "@/components/shop/ChestOption";
import CoinsOption from "@/components/shop/CoinsOption";

const Shop = () => {
  return (
    <ScrollView className="bg-grayscale-800">
      <ShopOption type="xp" price={200} borderless={false} />
      <ShopOption type="hearts" price={100} borderless={false} />
      <ChestOption />
      <CoinsOption type="handful" price={0.99} amount="1000" />
      <CoinsOption type="bag" price={3.99} amount="10K" />
    </ScrollView>
  );
};

export default Shop;
