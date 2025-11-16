-- 팔로우 관계 테이블 생성
CREATE TABLE follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- 인덱스 생성 for 성능
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_follows_created_at ON follows(created_at);

-- RLS 정책 설정
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- 읽기: 모든 사용자 가능
CREATE POLICY "누구나 팔로우 관계 읽기 가능" ON follows
  FOR SELECT USING (true);

-- 생성: 로그인한 사용자만 가능 (자기 자신은 팔로우 불가)
CREATE POLICY "로그인한 사용자만 팔로우 생성 가능" ON follows
  FOR INSERT WITH CHECK (
    auth.uid() = follower_id AND 
    auth.uid() != following_id AND
    NOT EXISTS (
      SELECT 1 FROM follows 
      WHERE follower_id = auth.uid() AND following_id = NEW.following_id
    )
  );

-- 삭제: 본인만 가능
CREATE POLICY "본인만 팔로우 삭제 가능" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- 팔로우/팔로워 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_user_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 팔로잉 수 증가 (팔로우하는 사람)
    UPDATE auth.users 
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{following_count}',
      to_jsonb(COALESCE((raw_user_meta_data->>'following_count')::int, 0) + 1)
    WHERE id = NEW.follower_id;
    
    -- 팔로워 수 증가 (팔로우 당하는 사람)
    UPDATE auth.users 
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{followers_count}',
      to_jsonb(COALESCE((raw_user_meta_data->>'followers_count')::int, 0) + 1)
    WHERE id = NEW.following_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- 팔로잉 수 감소
    UPDATE auth.users 
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{following_count}',
      to_jsonb(GREATEST(0, COALESCE((raw_user_meta_data->>'following_count')::int, 1) - 1))
    WHERE id = OLD.follower_id;
    
    -- 팔로워 수 감소
    UPDATE auth.users 
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{followers_count}',
      to_jsonb(GREATEST(0, COALESCE((raw_user_meta_data->>'followers_count')::int, 1) - 1))
    WHERE id = OLD.following_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_update_user_follow_counts
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_user_follow_counts();

-- 프로필 테이블에 팔로우 수 칼럼 추가 (캐싱용)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- 기존 사용자의 팔로우 수 초기화
UPDATE profiles 
SET followers_count = COALESCE(sub.followers, 0),
    following_count = COALESCE(sub.following, 0)
FROM (
  SELECT 
    following_id as user_id,
    COUNT(*) as followers
  FROM follows 
  GROUP BY following_id
) sub
WHERE profiles.id = sub.user_id;

UPDATE profiles 
SET following_count = COALESCE(sub.following, 0)
FROM (
  SELECT 
    follower_id as user_id,
    COUNT(*) as following
  FROM follows 
  GROUP BY follower_id
) sub
WHERE profiles.id = sub.user_id;