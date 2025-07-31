export interface MarketplaceCategory {
  value: string;
  label: string;
  description: string;
}

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  {
    value: "Electronics",
    label: "Electronics",
    description: "Phones, laptops, tablets, accessories, gaming",
  },
  {
    value: "Books & Academic",
    label: "Books & Academic",
    description: "Textbooks, novels, academic materials, stationery",
  },
  {
    value: "Furniture & Home",
    label: "Furniture & Home",
    description: "Desks, chairs, storage, home decor, kitchen items",
  },
  {
    value: "Clothing & Fashion",
    label: "Clothing & Fashion",
    description: "Casual wear, formal wear, accessories, shoes",
  },
  {
    value: "Sports & Recreation",
    label: "Sports & Recreation",
    description: "Sports equipment, fitness gear, outdoor items",
  },
  {
    value: "Beauty & Personal Care",
    label: "Beauty & Personal Care",
    description: "Cosmetics, skincare, personal hygiene",
  },
  {
    value: "Transportation",
    label: "Transportation",
    description: "Bicycles, scooters, car accessories",
  },
  {
    value: "Musical Instruments",
    label: "Musical Instruments",
    description: "Guitars, keyboards, drums, accessories",
  },
  {
    value: "Art & Crafts",
    label: "Art & Crafts",
    description: "Art supplies, craft materials, handmade items",
  },
  {
    value: "Food & Beverages",
    label: "Food & Beverages",
    description: "Snacks, beverages, cooking ingredients",
  },
  {
    value: "Health & Wellness",
    label: "Health & Wellness",
    description: "Supplements, medical items, wellness products",
  },
  {
    value: "Baby & Kids",
    label: "Baby & Kids",
    description: "Toys, baby items, children's clothing",
  },
  {
    value: "Pets & Animals",
    label: "Pets & Animals",
    description: "Pet supplies, pet accessories",
  },
  {
    value: "Garden & Outdoor",
    label: "Garden & Outdoor",
    description: "Plants, gardening tools, outdoor equipment",
  },
  {
    value: "Office & Business",
    label: "Office & Business",
    description: "Office supplies, business equipment",
  },
  {
    value: "Free Items",
    label: "Free Items",
    description: "Items given away for free",
  },
  {
    value: "Other",
    label: "Other",
    description: "Miscellaneous items not fitting other categories",
  },
];

// Helper function to get category by value
export const getCategoryByValue = (
  value: string
): MarketplaceCategory | undefined => {
  return MARKETPLACE_CATEGORIES.find((category) => category.value === value);
};

// Helper function to get all category values
export const getCategoryValues = (): string[] => {
  return MARKETPLACE_CATEGORIES.map((category) => category.value);
};

// Helper function to get all category labels
export const getCategoryLabels = (): string[] => {
  return MARKETPLACE_CATEGORIES.map((category) => category.label);
};
