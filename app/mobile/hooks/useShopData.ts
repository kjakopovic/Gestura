import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { ShopData, ShopItem } from "@/types/shop";

export const useShopData = () => {
  const [loading, setLoading] = useState(true);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [coins, setCoins] = useState<ShopItem[]>([]);
  const [chests, setChests] = useState<ShopItem[]>([]);

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setLoading(true);
        const response = await api.get("/items/available", {
          apiBase: "shop",
        });

        const shopData = response.data as ShopData;
        setShopItems(shopData.items);
        setCoins(shopData.coins);
        setChests(shopData.chests);
      } catch (error) {
        console.error("Error fetching shop data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, []);

  return {
    loading,
    shopItems,
    coins,
    chests,
  };
};
