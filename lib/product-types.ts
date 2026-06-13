export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  emoji: string;
  image: string;
  active: boolean;
};

export type CategoryDef = {
  value: string;
  label: string;
};

export type SizeOption = {
  label: string;
  maxDimensionMm: number;
};

export type StoreSettings = {
  printerMaxBuildMm: number;
};

export type StoreData = {
  products: Product[];
  categories: CategoryDef[];
  colors: string[];
  sizeOptions: SizeOption[];
  settings: StoreSettings;
  adminPasswordHash: string | null;
};
