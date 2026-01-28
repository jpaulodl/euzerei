
export type Platform = 'PC' | 'PS5' | 'Xbox' | 'Switch' | 'Outro';
export type MainPlatform = 'PC' | 'PlayStation' | 'Xbox' | 'Nintendo';

export interface Game {
  id: string;
  user_id: string;
  title: string;
  platform: Platform;
  completion_date: string;
  rating: number;
  review: string;
  is_platinum: boolean;
  hours_played: number;
  background_image?: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    gamertag?: string;
    main_platform?: MainPlatform;
  };
}

export interface AuthState {
  user: User | null;
  loading: boolean;
}
