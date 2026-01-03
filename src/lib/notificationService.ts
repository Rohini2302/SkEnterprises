// lib/notificationService.ts

class NotificationService {
  private static instance: NotificationService;
  private audioContext: AudioContext | null = null;
  private notificationSound: HTMLAudioElement | null = null;
  private notificationInterval: NodeJS.Timeout | null = null;
  private lastNotificationTime: number = 0;
  private notificationCooldown = 30000; // 30 seconds cooldown between notifications

  private constructor() {
    this.initializeNotificationSound();
    this.requestNotificationPermission();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private initializeNotificationSound() {
    try {
      // Create a simple notification sound using Web Audio API
      this.notificationSound = new Audio();
      // Create a short beep sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.audioContext = audioContext;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  async showSystemNotification(title: string, options?: NotificationOptions) {
    const now = Date.now();
    
    // Apply cooldown to prevent spam
    if (now - this.lastNotificationTime < this.notificationCooldown) {
      return;
    }

    this.lastNotificationTime = now;

    // Play sound
    this.playNotificationSound();

    // Show desktop notification
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: true,
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    }

    // Also show browser tab notification
    this.showTabNotification(title, options?.body || '');
  }

  private showTabNotification(title: string, body: string) {
    if (document.hidden) {
      // Change title to show notification
      const originalTitle = document.title;
      let hasNotification = document.title.includes('🔔');
      
      if (!hasNotification) {
        document.title = `🔔 ${originalTitle}`;
        
        // Blink the title for attention
        let blinkCount = 0;
        const blinkInterval = setInterval(() => {
          document.title = document.title.includes('🔔') 
            ? originalTitle 
            : `🔔 ${originalTitle}`;
          
          blinkCount++;
          if (blinkCount >= 6) { // Blink 3 times
            clearInterval(blinkInterval);
            document.title = originalTitle;
          }
        }, 500);
      }
    }
  }

  private playNotificationSound() {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
      // Fallback to HTML5 audio
      this.playFallbackSound();
    }
  }

  private playFallbackSound() {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
      audio.volume = 0.3;
      audio.play();
    } catch (error) {
      console.error('Failed to play fallback sound:', error);
    }
  }

  startPeriodicCheck(checkFunction: () => Promise<void>, interval = 30000) {
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
    }
    
    this.notificationInterval = setInterval(async () => {
      await checkFunction();
    }, interval);
  }

  stopPeriodicCheck() {
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
      this.notificationInterval = null;
    }
  }

  destroy() {
    this.stopPeriodicCheck();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

export default NotificationService.getInstance();