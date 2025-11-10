export type Post = {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image: string | null;
  published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
};