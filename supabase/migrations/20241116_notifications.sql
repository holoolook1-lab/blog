-- 알림 설정 테이블 생성
CREATE TABLE notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT true,
  new_follower BOOLEAN DEFAULT true,
  new_comment BOOLEAN DEFAULT true,
  comment_reply BOOLEAN DEFAULT true,
  post_reaction BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 알림 테이블 생성
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('follow', 'comment', 'reply', 'reaction', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- 푸시 구독 정보 테이블
CREATE TABLE push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(endpoint)
);

-- 인덱스 생성 for 성능
CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- RLS 정책 설정
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 알림 설정 RLS
CREATE POLICY "본인만 자신의 알림 설정 읽기 가능" ON notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "본인만 자신의 알림 설정 수정 가능" ON notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "본인만 자신의 알림 설정 생성 가능" ON notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 알림 RLS
CREATE POLICY "본인만 자신의 알림 읽기 가능" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "본인만 자신의 알림 업데이트 가능" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 푸시 구독 RLS
CREATE POLICY "본인만 자신의 푸시 구독 읽기 가능" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "본인만 자신의 푸시 구독 생성 가능" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인만 자신의 푸시 구독 삭제 가능" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 트리거
CREATE TRIGGER trigger_update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_notification_settings_updated_at();

CREATE TRIGGER trigger_update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- 알림 읽음 시각 업데이트 함수
CREATE OR REPLACE FUNCTION update_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false AND NEW.read_at IS NULL THEN
    NEW.read_at = NOW();
  ELSIF NEW.is_read = false THEN
    NEW.read_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 읽음 트리거
CREATE TRIGGER trigger_update_notification_read_at
  BEFORE UPDATE OF is_read ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_notification_read_at();