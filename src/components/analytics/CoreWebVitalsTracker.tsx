'use client';

import { useEffect } from 'react';

interface MetricData {
  name: string;
  value: number;
  delta?: number;
  id: string;
  navigationType?: string;
  rating?: 'good' | 'needs-improvement' | 'poor';
}

// Core Web Vitals 임계값
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint (ms)
  FID: { good: 100, poor: 300 }, // First Input Delay (ms)
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint (ms)
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte (ms)
  INP: { good: 200, poor: 500 }, // Interaction to Next Paint (ms)
};

function getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = THRESHOLDS[metric as keyof typeof THRESHOLDS];
  if (!thresholds) return 'needs-improvement';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

function sendMetric(data: MetricData) {
  // 백그라운드에서 전송 (중요하지 않은 요청)
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/core-web-vitals', JSON.stringify(data));
  } else {
    // Fallback: fetch with keepalive
    fetch('/api/analytics/core-web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true,
    }).catch(console.error);
  }
}

function handleWebVitalMetric(metric: MetricData) {
  // rating 추가
  const enhancedMetric = {
    ...metric,
    rating: getRating(metric.name, metric.value),
  };
  
  // 콘솔에 로깅 (개발 모드에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, enhancedMetric);
  }
  
  // 서버로 전송
  sendMetric(enhancedMetric);
}

export function CoreWebVitalsTracker() {
  useEffect(() => {
    // Web Vitals 라이브러리가 있는 경우 사용
    const trackWebVitals = async () => {
      try {
        // web-vitals 라이브러리가 설치되어 있다면 사용
        const { onLCP, onINP, onCLS, onFCP, onTTFB } = await import('web-vitals');
        
        onLCP(handleWebVitalMetric);
        onINP(handleWebVitalMetric);
        onCLS(handleWebVitalMetric);
        onFCP(handleWebVitalMetric);
        onTTFB(handleWebVitalMetric);
      } catch (error) {
        // web-vitals 라이브러리가 없는 경우 Performance API 직접 사용
        trackWithPerformanceAPI();
      }
    };

    // Performance API를 사용한 간단한 측정
    function trackWithPerformanceAPI() {
      if ('PerformanceObserver' in window) {
        // LCP (Largest Contentful Paint)
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            handleWebVitalMetric({
              name: 'LCP',
              value: lastEntry.startTime,
              id: lastEntry.id,
              navigationType: lastEntry.navigationType,
            });
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          console.warn('LCP 측정 실패:', e);
        }

        // FCP (First Contentful Paint)
        try {
          const fcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint');
            if (fcpEntry) {
              handleWebVitalMetric({
                name: 'FCP',
                value: fcpEntry.startTime,
                id: fcpEntry.name || 'fcp',
                navigationType: (fcpEntry as any).navigationType,
              });
            }
          });
          fcpObserver.observe({ entryTypes: ['paint'] });
        } catch (e) {
          console.warn('FCP 측정 실패:', e);
        }

        // TTFB (Time to First Byte)
        try {
          const navigationObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (entry.responseStart) {
                handleWebVitalMetric({
                  name: 'TTFB',
                  value: entry.responseStart - entry.requestStart,
                  id: (entry as any).id || 'ttfb',
                  navigationType: (entry as any).navigationType,
                });
              }
            });
          });
          navigationObserver.observe({ entryTypes: ['navigation'] });
        } catch (e) {
          console.warn('TTFB 측정 실패:', e);
        }
      }

      // CLS (Cumulative Layout Shift) - 간단한 버전
      try {
        let clsValue = 0;
        let clsEntries: any[] = [];

        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsEntries.push(entry);
              clsValue += entry.value;
            }
          }
          handleWebVitalMetric({
            name: 'CLS',
            value: clsValue,
            id: clsEntries.length > 0 ? (clsEntries[clsEntries.length - 1].id || 'cls') : 'cls',
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS 측정 실패:', e);
      }
    }

    trackWebVitals();
  }, []);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않습니다
}