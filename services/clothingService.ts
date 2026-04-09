import { WardrobeItem } from '../types';

const API_URL = '/api/clothing';

const getHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'x-auth-token': token,
});

export const fetchClothes = async (token: string): Promise<WardrobeItem[]> => {
  const res = await fetch(API_URL, {
    headers: getHeaders(token),
  });

  if (!res.ok) throw new Error('Failed to fetch clothes');
  const data = await res.json();
  
  // Map backend structure to frontend WardrobeItem
  return data.map((item: any) => ({
    id: item._id,
    name: item.name,
    color: item.color,
    fabric: item.fabric,
    texture: item.texture,
    occasion: item.occasion,
    imageUrl: item.image, // item.image in backend is item.imageUrl in frontend
  }));
};

export const addClothing = async (token: string, item: Omit<WardrobeItem, 'id'>): Promise<WardrobeItem> => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({
      name: item.name,
      color: item.color,
      fabric: item.fabric,
      texture: item.texture,
      occasion: item.occasion,
      image: item.imageUrl,
      category: 'Top', // Default or derived
      season: 'All',   // Default or derived
    }),
  });

  if (!res.ok) throw new Error('Failed to add clothing');
  const data = await res.json();
  
  return {
    id: data._id,
    name: data.name,
    color: data.color,
    fabric: data.fabric,
    texture: data.texture,
    occasion: data.occasion,
    imageUrl: data.image,
  };
};

export const deleteClothing = async (token: string, id: string): Promise<void> => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });

  if (!res.ok) throw new Error('Failed to delete clothing');
};
