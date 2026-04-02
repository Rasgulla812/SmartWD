
export interface WardrobeItem {
  id: string;
  name: string;
  imageUrl: string;
  color?: string;
  fabric?: string;
  texture?: string;
}

export type View = 'auth' | 'wardrobe' | 'recommender' | 'rater';
