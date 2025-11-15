# Vercel 배포를 위한 GitHub Actions 설정

## 필요한 GitHub Secrets 설정:

1. **VERCEL_TOKEN**: 
   - Vercel 대시보드 → Settings → Tokens → Create Token
   - 범위: 전체 계정

2. **ORG_ID**:
   - Vercel CLI에서 `vercel whoami` 실행
   - 또는 Vercel 대시보드 URL에서 확인

3. **PROJECT_ID**:
   - Vercel 대시보드에서 프로젝트 선택 → Settings → General
   - Project ID 확인

## 수동 배포 방법:

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 루트에서 실행
cd blog
vercel --prod
```

## Vercel 대시보드에서 직접 설정:

1. vercel.com 에 로그인
2. 프로젝트 선택 (holoolook1-lab/blog)
3. Settings → General 탭
4. Root Directory를 "blog"로 변경
5. Save 버튼 클릭
6. Redeploy 버튼 클릭