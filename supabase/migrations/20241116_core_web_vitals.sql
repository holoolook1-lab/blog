-- Core Web Vitals 성능 측정 테이블
CREATE TABLE core_web_vitals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metric_name VARCHAR(50) NOT NULL, -- LCP, FID, CLS, FCP, TTFB, INP 등
  value NUMERIC NOT NULL, -- 밀리초 또는 점수
  delta NUMERIC, -- 이전 측정값과의 차이
  rating VARCHAR(20), -- good, needs-improvement, poor
  navigation_type VARCHAR(20), -- navigate, reload, back-forward, prerender
  session_id VARCHAR(100), -- 브라우저 세션 ID
  user_agent TEXT, -- 사용자 에이전트 정보
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_core_web_vitals_user_id ON core_web_vitals(user_id);
CREATE INDEX idx_core_web_vitals_metric_name ON core_web_vitals(metric_name);
CREATE INDEX idx_core_web_vitals_timestamp ON core_web_vitals(timestamp);
CREATE INDEX idx_core_web_vitals_rating ON core_web_vitals(rating);

-- RLS (Row Level Security) 활성화
ALTER TABLE core_web_vitals ENABLE ROW LEVEL SECURITY;

-- 시스템은 모든 데이터를 볼 수 있음 (읽기 전용)
CREATE POLICY "시스템은 Core Web Vitals 데이터를 볼 수 있음" ON core_web_vitals
  FOR SELECT USING (true);

-- 사용자는 자신의 데이터만 볼 수 있음
CREATE POLICY "사용자는 자신의 Core Web Vitals 데이터만 볼 수 있음" ON core_web_vitals
  FOR SELECT USING (auth.uid() = user_id);

-- 시스템은 데이터를 생성할 수 있음
CREATE POLICY "시스템은 Core Web Vitals 데이터를 생성할 수 있음" ON core_web_vitals
  FOR INSERT WITH CHECK (true);

-- 페이지 성능 요약 뷰
CREATE OR REPLACE VIEW page_performance_summary AS
SELECT 
  DATE_TRUNC('day', timestamp) as date,
  metric_name,
  COUNT(*) as measurement_count,
  AVG(value) as avg_value,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY value) as p75_value,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) as p95_value,
  COUNT(CASE WHEN rating = 'good' THEN 1 END) * 100.0 / COUNT(*) as good_percentage,
  COUNT(CASE WHEN rating = 'needs-improvement' THEN 1 END) * 100.0 / COUNT(*) as needs_improvement_percentage,
  COUNT(CASE WHEN rating = 'poor' THEN 1 END) * 100.0 / COUNT(*) as poor_percentage
FROM core_web_vitals 
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp), metric_name
ORDER BY date DESC, metric_name;

-- 사용자 경험 품질 뷰
CREATE OR REPLACE VIEW user_experience_quality AS
SELECT 
  user_id,
  COUNT(DISTINCT DATE_TRUNC('day', timestamp)) as active_days,
  COUNT(*) as total_measurements,
  AVG(CASE WHEN metric_name = 'LCP' THEN value END) as avg_lcp,
  AVG(CASE WHEN metric_name = 'FID' THEN value END) as avg_fid,
  AVG(CASE WHEN metric_name = 'CLS' THEN value END) as avg_cls,
  AVG(CASE WHEN metric_name = 'FCP' THEN value END) as avg_fcp,
  AVG(CASE WHEN metric_name = 'TTFB' THEN value END) as avg_ttfb,
  COUNT(CASE WHEN rating = 'good' THEN 1 END) * 100.0 / COUNT(*) as overall_good_percentage
FROM core_web_vitals 
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY user_id
HAVING COUNT(*) >= 10; -- 최소 10개 이상의 측정값이 있어야 함