export type Database = {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string;
          title: string;
          content: string;
          excerpt: string;
          slug: string;
          author_id: string;
          created_at: string;
          updated_at: string;
          published: boolean;
          tags: string[];
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          excerpt: string;
          slug: string;
          author_id: string;
          created_at?: string;
          updated_at?: string;
          published?: boolean;
          tags?: string[];
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          excerpt?: string;
          slug?: string;
          author_id?: string;
          created_at?: string;
          updated_at?: string;
          published?: boolean;
          tags?: string[];
        };
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          achieved_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          achieved_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          achieved_at?: string;
        };
      };
      user_attendance: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          streak: number;
          total_days: number;
          last_check_in: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          streak?: number;
          total_days?: number;
          last_check_in?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          streak?: number;
          total_days?: number;
          last_check_in?: string;
        };
      };
      user_points: {
        Row: {
          id: string;
          user_id: string;
          points: number;
          total_earned: number;
          total_spent: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          points?: number;
          total_earned?: number;
          total_spent?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          points?: number;
          total_earned?: number;
          total_spent?: number;
          updated_at?: string;
        };
      };
    };
  };
};