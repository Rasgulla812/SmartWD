
export interface WardrobeItem {
  id: string;
  name: string;
  imageUrl: string;
  color?: string;
  fabric?: string;
}

export type View = 'wardrobe' | 'recommender' | 'rater';
