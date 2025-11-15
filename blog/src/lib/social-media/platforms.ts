/**
 * SNS 플랫폼 통합 지원 모듈
 * 인스타그램, 페이스북, 트위터, 틱톡, 유튜브, 네이버TV 등 지원
 */

export interface SocialPlatform {
  name: string;
  domains: string[];
  patterns: RegExp[];
  oembedEndpoint?: string;
  apiEndpoint?: string;
  embedTemplate: (id: string, url: string) => string;
  extractId: (url: string) => string | null;
  supports: {
    video: boolean;
    image: boolean;
    post: boolean;
    profile: boolean;
  };
}

export const SOCIAL_PLATFORMS: Record<string, SocialPlatform> = {
  instagram: {
    name: 'Instagram',
    domains: ['instagram.com', 'instagr.am'],
    patterns: [
      /https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i,
      /https?:\/\/(?:www\.)?instagr\.am\/([A-Za-z0-9_-]+)/i,
      /https?:\/\/(?:www\.)?instagram\.com\/stories\/[^\/]+\/([A-Za-z0-9_-]+)/i,
      /https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9_.]+)/i
    ],
    oembedEndpoint: 'https://graph.facebook.com/v18.0/instagram_oembed',
    embedTemplate: (id, url) => `
      <div class="instagram-media-container" style="max-width: 540px; margin: 0 auto;">
        <iframe 
          src="https://www.instagram.com/p/${id}/embed" 
          width="100%" 
          height="600" 
          frameborder="0" 
          scrolling="no" 
          allowtransparency="true"
          loading="lazy">
        </iframe>
      </div>
    `,
    extractId: (url) => {
      const match = url.match(/(?:instagram\.com|instagr\.am)\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i);
      return match ? match[1] : null;
    },
    supports: {
      video: true,
      image: true,
      post: true,
      profile: true
    }
  },

  facebook: {
    name: 'Facebook',
    domains: ['facebook.com', 'fb.com', 'fb.watch'],
    patterns: [
      /https?:\/\/(?:www\.)?facebook\.com\/[^\/]+\/posts\/([A-Za-z0-9_-]+)/i,
      /https?:\/\/(?:www\.)?facebook\.com\/[^\/]+\/videos\/([A-Za-z0-9_-]+)/i,
      /https?:\/\/(?:www\.)?facebook\.com\/watch\/\?v=([A-Za-z0-9_-]+)/i,
      /https?:\/\/(?:www\.)?fb\.watch\/([A-Za-z0-9_-]+)/i,
      /https?:\/\/(?:www\.)?facebook\.com\/([A-Za-z0-9.]+)/i
    ],
    oembedEndpoint: 'https://graph.facebook.com/v18.0/oembed_post',
    embedTemplate: (id, url) => `
      <div class="facebook-media-container" style="max-width: 500px; margin: 0 auto;">
        <iframe 
          src="https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&width=500&show_text=true&appId" 
          width="500" 
          height="600" 
          style="border:none;overflow:hidden" 
          scrolling="no" 
          frameborder="0" 
          allowfullscreen="true" 
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          loading="lazy">
        </iframe>
      </div>
    `,
    extractId: (url) => {
      const patterns = [
        /facebook\.com\/[^\/]+\/posts\/([A-Za-z0-9_-]+)/i,
        /facebook\.com\/[^\/]+\/videos\/([A-Za-z0-9_-]+)/i,
        /facebook\.com\/watch\/\?v=([A-Za-z0-9_-]+)/i,
        /fb\.watch\/([A-Za-z0-9_-]+)/i
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    },
    supports: {
      video: true,
      image: true,
      post: true,
      profile: true
    }
  },

  twitter: {
    name: 'Twitter',
    domains: ['twitter.com', 'x.com', 't.co'],
    patterns: [
      /https?:\/\/(?:www\.)?twitter\.com\/([A-Za-z0-9_]+)\/status\/([A-Za-z0-9_-]+)/i,
      /https?:\/\/(?:www\.)?x\.com\/([A-Za-z0-9_]+)\/status\/([A-Za-z0-9_-]+)/i,
      /https?:\/\/t\.co\/([A-Za-z0-9_-]+)/i
    ],
    oembedEndpoint: 'https://publish.twitter.com/oembed',
    embedTemplate: (id, url) => `
      <div class="twitter-media-container" style="max-width: 550px; margin: 0 auto;">
        <blockquote class="twitter-tweet" data-lang="ko">
          <a href="${url}"></a>
        </blockquote>
        <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
      </div>
    `,
    extractId: (url) => {
      const match = url.match(/(?:twitter\.com|x\.com)\/[A-Za-z0-9_]+\/status\/([A-Za-z0-9_-]+)/i);
      return match ? match[1] : null;
    },
    supports: {
      video: true,
      image: true,
      post: true,
      profile: false
    }
  },

  tiktok: {
    name: 'TikTok',
    domains: ['tiktok.com', 'm.tiktok.com'],
    patterns: [
      /https?:\/\/(?:www\.)?tiktok\.com\/@[A-Za-z0-9_.]+\/video\/([A-Za-z0-9_-]+)/i,
      /https?:\/\/m\.tiktok\.com\/v\/([A-Za-z0-9_-]+)/i,
      /https?:\/\/(?:www\.)?tiktok\.com\/@[A-Za-z0-9_.]+/i
    ],
    embedTemplate: (id, url) => `
      <div class="tiktok-media-container" style="max-width: 325px; margin: 0 auto;">
        <blockquote class="tiktok-embed" cite="https://www.tiktok.com/@username/video/${id}" data-video-id="${id}" style="max-width: 605px;min-width: 325px;">
          <section></section>
        </blockquote>
        <script async src="https://www.tiktok.com/embed.js"></script>
      </div>
    `,
    extractId: (url) => {
      const match = url.match(/tiktok\.com\/@(?:[A-Za-z0-9_.]+)\/video\/([A-Za-z0-9_-]+)/i);
      return match ? match[1] : null;
    },
    supports: {
      video: true,
      image: false,
      post: true,
      profile: true
    }
  },

  youtube: {
    name: 'YouTube',
    domains: ['youtube.com', 'youtu.be', 'm.youtube.com'],
    patterns: [
      /https?:\/\/(?:www\.)?youtube\.com\/watch\?[^"'\s]*v=([A-Za-z0-9_-]{11})/i,
      /https?:\/\/(?:www\.)?youtu\.be\/([A-Za-z0-9_-]{11})/i,
      /https?:\/\/(?:www\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/i,
      /https?:\/\/(?:www\.)?youtube\.com\/embed\/([A-Za-z0-9_-]{11})/i,
      /https?:\/\/(?:www\.)?m\.youtube\.com\/watch\?[^"'\s]*v=([A-Za-z0-9_-]{11})/i
    ],
    oembedEndpoint: 'https://www.youtube.com/oembed',
    embedTemplate: (id, url) => `
      <div class="relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-lg my-6">
        <iframe 
          src="https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1" 
          class="absolute inset-0 w-full h-full border-0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          allowfullscreen 
          loading="lazy">
        </iframe>
      </div>
    `,
    extractId: (url) => {
      const patterns = [
        /youtube\.com\/watch\?[^"'\s]*v=([A-Za-z0-9_-]{11})/i,
        /youtu\.be\/([A-Za-z0-9_-]{11})/i,
        /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/i,
        /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/i,
        /m\.youtube\.com\/watch\?[^"'\s]*v=([A-Za-z0-9_-]{11})/i
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    },
    supports: {
      video: true,
      image: false,
      post: false,
      profile: false
    }
  },

  navertv: {
    name: 'Naver TV',
    domains: ['tv.naver.com', 'm.tv.naver.com'],
    patterns: [
      /https?:\/\/(?:www\.)?tv\.naver\.com\/v\/([A-Za-z0-9_-]+)/i,
      /https?:\/\/m\.tv\.naver\.com\/v\/([A-Za-z0-9_-]+)/i,
      /https?:\/\/(?:www\.)?tv\.naver\.com\/channel\/([A-Za-z0-9_-]+)/i
    ],
    embedTemplate: (id, url) => `
      <div class="naver-tv-container" style="max-width: 560px; margin: 0 auto;">
        <iframe 
          src="https://tv.naver.com/embed/${id}?autoPlay=false" 
          width="560" 
          height="315" 
          frameborder="0" 
          allowfullscreen 
          loading="lazy">
        </iframe>
      </div>
    `,
    extractId: (url) => {
      const match = url.match(/tv\.naver\.com\/v\/([A-Za-z0-9_-]+)/i);
      return match ? match[1] : null;
    },
    supports: {
      video: true,
      image: false,
      post: false,
      profile: true
    }
  }
};

/**
 * 단축 URL 서비스 패턴
 */
export const SHORT_URL_PATTERNS = [
  /https?:\/\/bit\.ly\/([A-Za-z0-9_-]+)/i,
  /https?:\/\/tinyurl\.com\/([A-Za-z0-9_-]+)/i,
  /https?:\/\/goo\.gl\/([A-Za-z0-9_-]+)/i,
  /https?:\/\/t\.co\/([A-Za-z0-9_-]+)/i,
  /https?:\/\/buff\.ly\/([A-Za-z0-9_-]+)/i,
  /https?:\/\/ow\.ly\/([A-Za-z0-9_-]+)/i,
  /https?:\/\/short\.link\/([A-Za-z0-9_-]+)/i
];

/**
 * URL에서 소셜 플랫폼 정보 추출
 */
export function detectSocialPlatform(url: string): SocialPlatform | null {
  if (!url || typeof url !== 'string') return null;
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '');
    
    for (const [key, platform] of Object.entries(SOCIAL_PLATFORMS)) {
      if (platform.domains.includes(hostname)) {
        // 패턴 매칭 확인
        for (const pattern of platform.patterns) {
          if (pattern.test(url)) {
            return platform;
          }
        }
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * 단축 URL 감지
 */
export function isShortUrl(url: string): boolean {
  return SHORT_URL_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * 모든 지원 플랫폼 이름 반환
 */
export function getSupportedPlatforms(): string[] {
  return Object.values(SOCIAL_PLATFORMS).map(p => p.name);
}