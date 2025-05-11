export type ShopData = {
  message: string;
  items: ShopItem[];
  coins: ShopItem[];
  chests: ShopItem[];
};

export type ShopItem = {
  image_url: string;
  category: string;
  id: string;
  price: number;
  name: string;
  effect?: {
    coins?: number;
    seconds_in_use: number;
    multiplier: number;
  };
};

export type PurchaseResponse = {
  message: string;
  success: boolean;
  data?: any;
};
