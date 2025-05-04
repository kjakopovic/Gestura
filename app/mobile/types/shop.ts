export type ShopData = {
  message: string;
  items: ShopItem[];
  coins: ShopItem[];
  chests: ShopItem[];
};

export type ShopItem = {
  category: string;
  id: string;
  price: number;
  name: string;
  effect?: {
    seconds_in_use: number;
    multiplier: number;
  };
};

export type PurchaseResponse = {
  message: string;
  success: boolean;
  data?: any;
};
