import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { ShopItem, PurchaseResponse } from "@/types/shop";
import { useUserStore } from "@/store/useUserStore";

export const usePurchase = () => {
  const userData = useUserStore((state) => state.user);
  const updateUserPreference = useUserStore(
    (state) => state.updateUserPreference
  );
  const userCoins = userData?.coins || 0;

  const [purchasing, setPurchasing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShopItem | undefined>();
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState("");

  useEffect(() => {
    if (!modalVisible && purchaseComplete) {
      setTimeout(() => {
        setPurchaseComplete(false);
        setPurchasing(false);
        setSelectedItem(undefined);
      }, 500);
    }
  }, [modalVisible, purchaseComplete]);

  const handlePurchase = (item: ShopItem) => {
    setPurchasing(false);
    setPurchaseComplete(false);
    setSelectedItem(item);
    setModalVisible(true);
  };

  const completePurchase = async () => {
    try {
      setPurchasing(true);
      if (!selectedItem) {
        console.error("No item selected for purchase");
        setPurchasing(false);
        return { success: false };
      }

      const response = await api.post<PurchaseResponse>(
        "/items/buy",
        {
          item_id: selectedItem.id,
        },
        { apiBase: "shop" }
      );

      const purchaseData = response.data as PurchaseResponse;
      setPurchaseMessage(purchaseData.message || "Purchase successful!");

      // Update user coins in state
      if (userData && selectedItem.price) {
        const newCoins = Math.max(0, userCoins - selectedItem.price);
        updateUserPreference("coins", newCoins);
      }

      setPurchaseComplete(true);
      return { success: true };
    } catch (error) {
      console.error("Error purchasing item:", error);
      setPurchaseMessage("Purchase failed. Please try again.");
      return { success: false };
    } finally {
      setPurchasing(false);
    }
  };

  return {
    purchasing,
    modalVisible,
    setModalVisible,
    selectedItem,
    purchaseMessage,
    userCoins,
    handlePurchase,
    completePurchase,
  };
};
