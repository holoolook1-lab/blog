/// <reference lib="webworker" />

declare let self: ServiceWorkerGlobalScope;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface Window {
  addEventListener(type: 'beforeinstallprompt', listener: (event: BeforeInstallPromptEvent) => void): void;
  addEventListener(type: 'appinstalled', listener: (event: Event) => void): void;
}