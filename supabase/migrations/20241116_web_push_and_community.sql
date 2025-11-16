-- Web Push 알림 구독 테이블 생성
CREATE TABLE push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 인덱스 생성
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- RLS (Row Level Security) 활성화
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 구독 정보만 볼 수 있음
CREATE POLICY "사용자는 자신의 푸시 구독 정보만 볼 수 있음" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 구독 정보만 생성/수정/삭제할 수 있음
CREATE POLICY "사용자는 자신의 푸시 구독 정보만 관리할 수 있음" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- 알림 전송 기록 테이블
CREATE TABLE notification_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered BOOLEAN DEFAULT FALSE,
  error_message TEXT
);

-- 인덱스 생성
CREATE INDEX idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX idx_notification_history_sent_at ON notification_history(sent_at);

-- RLS 활성화
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 알림 기록만 볼 수 있음
CREATE POLICY "사용자는 자신의 알림 기록만 볼 수 있음" ON notification_history
  FOR SELECT USING (auth.uid() = user_id);

-- 시스템은 알림 기록을 생성할 수 있음 (서버 사이드)
CREATE POLICY "시스템은 알림 기록을 생성할 수 있음" ON notification_history
  FOR INSERT WITH CHECK (true);

-- 사용자 팔로우 테이블 (커뮤니티 기능)
CREATE TABLE user_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id) -- 자기 자신은 팔로우 불가
);

-- 인덱스 생성
CREATE INDEX idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON user_follows(following_id);

-- RLS 활성화
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 팔로우 정보만 볼 수 있음
CREATE POLICY "사용자는 자신의 팔로우 정보만 볼 수 있음" ON user_follows
  FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- 사용자는 자신의 팔로우만 관리할 수 있음
CREATE POLICY "사용자는 자신의 팔로우만 관리할 수 있음" ON user_follows
  FOR ALL USING (auth.uid() = follower_id);

-- 팔로워/팔로잉 카운트를 위한 뷰
CREATE OR REPLACE VIEW user_follow_stats AS
SELECT 
  u.id as user_id,
  COUNT(DISTINCT f1.id) as followers_count,
  COUNT(DISTINCT f2.id) as following_count
FROM auth.users u
LEFT JOIN user_follows f1 ON u.id = f1.following_id
LEFT JOIN user_follows f2 ON u.id = f2.follower_id
GROUP BY u.id;

-- 사용자 활동 알림 설정 테이블
CREATE TABLE user_notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  new_followers BOOLEAN DEFAULT TRUE,
  post_likes BOOLEAN DEFAULT TRUE,
  post_comments BOOLEAN DEFAULT TRUE,
  comment_replies BOOLEAN DEFAULT TRUE,
  mentions BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS 활성화
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 알림 설정만 관리할 수 있음
CREATE POLICY "사용자는 자신의 알림 설정만 관리할 수 있음" ON user_notification_settings
  FOR ALL USING (auth.uid() = user_id);

-- 기본 알림 설정 생성을 위한 함수
CREATE OR REPLACE FUNCTION create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_notification_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 새 사용자 생성 시 기본 알림 설정 자동 생성
CREATE TRIGGER trigger_create_default_notification_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_notification_settings();