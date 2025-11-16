-- 댓글 신고 테이블 생성
CREATE TABLE comment_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'misinformation', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, reporter_id)
);

-- 인덱스 생성 for 성능
CREATE INDEX idx_comment_reports_comment_id ON comment_reports(comment_id);
CREATE INDEX idx_comment_reports_reporter_id ON comment_reports(reporter_id);
CREATE INDEX idx_comment_reports_status ON comment_reports(status);
CREATE INDEX idx_comment_reports_created_at ON comment_reports(created_at);

-- 댓글 테이블에 신고 수 칼럼 추가
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;

-- RLS 정책 설정
ALTER TABLE comment_reports ENABLE ROW LEVEL SECURITY;

-- 읽기: 로그인한 사용자만 가능 (자신의 신고만)
CREATE POLICY "본인만 자신의 댓글 신고 읽기 가능" ON comment_reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- 생성: 로그인한 사용자만 가능
CREATE POLICY "로그인한 사용자만 댓글 신고 생성 가능" ON comment_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- 업데이트: 관리자만 가능 (상태 변경)
CREATE POLICY "관리자만 댓글 신고 상태 업데이트 가능" ON comment_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 댓글 신고 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_comment_report_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET report_count = report_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET report_count = GREATEST(0, report_count - 1) WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_update_comment_report_count
  AFTER INSERT OR DELETE ON comment_reports
  FOR EACH ROW EXECUTE FUNCTION update_comment_report_count();

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_comment_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 트리거
CREATE TRIGGER trigger_update_comment_reports_updated_at
  BEFORE UPDATE ON comment_reports
  FOR EACH ROW EXECUTE FUNCTION update_comment_reports_updated_at();

-- 자동 숨김 처리를 위한 함수 (신고 수가 5개 이상인 댓글 숨김)
CREATE OR REPLACE FUNCTION auto_hide_reported_comments()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.report_count >= 5 THEN
    UPDATE comments 
    SET is_hidden = true 
    WHERE id = NEW.id AND is_hidden = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 자동 숨김 트리거
CREATE TRIGGER trigger_auto_hide_reported_comments
  AFTER UPDATE OF report_count ON comments
  FOR EACH ROW EXECUTE FUNCTION auto_hide_reported_comments();

-- 기존 댓글의 신고 수 초기화
UPDATE comments 
SET report_count = COALESCE(report_count, 0);