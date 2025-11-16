-- 댓글 반응(좋아요/싫어요) 테이블 생성
CREATE TABLE comment_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id, reaction_type)
);

-- 인덱스 생성 for 성능
CREATE INDEX idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX idx_comment_reactions_user_id ON comment_reactions(user_id);
CREATE INDEX idx_comment_reactions_created_at ON comment_reactions(created_at);

-- 댓글 테이블에 반응 수 칼럼 추가
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dislike_count INTEGER DEFAULT 0;

-- RLS 정책 설정
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

-- 읽기: 모든 사용자 가능
CREATE POLICY "누구나 댓글 반응 읽기 가능" ON comment_reactions
  FOR SELECT USING (true);

-- 생성: 로그인한 사용자만 가능
CREATE POLICY "로그인한 사용자만 댓글 반응 생성 가능" ON comment_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 삭제: 본인만 가능
CREATE POLICY "본인만 댓글 반응 삭제 가능" ON comment_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- 댓글 반응 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_comment_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.reaction_type = 'like' THEN
      UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    ELSIF NEW.reaction_type = 'dislike' THEN
      UPDATE comments SET dislike_count = dislike_count + 1 WHERE id = NEW.comment_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.reaction_type = 'like' THEN
      UPDATE comments SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.comment_id;
    ELSIF OLD.reaction_type = 'dislike' THEN
      UPDATE comments SET dislike_count = GREATEST(0, dislike_count - 1) WHERE id = OLD.comment_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_update_comment_reaction_counts
  AFTER INSERT OR DELETE ON comment_reactions
  FOR EACH ROW EXECUTE FUNCTION update_comment_reaction_counts();

-- 기존 댓글의 반응 수 초기화
UPDATE comments 
SET like_count = COALESCE(like_count, 0), 
    dislike_count = COALESCE(dislike_count, 0);