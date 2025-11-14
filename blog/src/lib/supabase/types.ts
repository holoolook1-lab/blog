export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          cover_image: string | null;
          content: string | null;
          created_at: string;
          like_count: number | null;
          dislike_count: number | null;
          heading: string | null;
          published: boolean | null;
        };
        Insert: Partial<Omit<Database['public']['Tables']['posts']['Row'], 'id' | 'created_at'>> & { id?: string };
        Update: Partial<Database['public']['Tables']['posts']['Row']>;
      };
      comments: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          parent_id: string | null;
          content: string;
          created_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['comments']['Row'], 'id' | 'created_at'>> & { id?: string };
        Update: Partial<Database['public']['Tables']['comments']['Row']>;
      };
      profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id?: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
