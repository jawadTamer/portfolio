import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';

interface ExtendedHTMLImageElement extends HTMLImageElement {
  src: string;
}

@Component({
  selector: 'app-optimized-image',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  template: `
    <img
      [ngSrc]="optimizedSrc"
      [alt]="alt"
      [width]="width"
      [height]="height"
      [priority]="priority"
      [loading]="!priority ? 'lazy' : undefined"
      [sizes]="sizes"
      [srcset]="srcset"
      [decoding]="priority ? 'sync' : 'async'"
      class="optimized-img {{ class }}"
      (error)="handleImageError($event)"
    />
  `,
  styles: [
    `
      .optimized-img {
        display: block;
        max-width: 100%;
        height: auto;
        object-fit: cover;
        content-visibility: auto;
        contain: layout paint style;
        will-change: transform;
        transform: translateZ(0);
      }
    `,
  ],
})
export class OptimizedImageComponent implements OnInit, OnDestroy {
  @Input() src!: string;
  @Input() alt = '';
  @Input() width!: number;
  @Input() height!: number;
  @Input() priority = false;
  @Input() class = '';
  @Input() sizes = '(max-width: 768px) 100vw, 50vw';

  optimizedSrc: string = '';
  srcset: string = '';
  private fallbackAttempted = false;
  private observer: IntersectionObserver | null = null;

  ngOnInit(): void {
    if (!this.width || !this.height) {
      console.warn(
        'OptimizedImageComponent: width and height are required for proper image loading performance'
      );
      this.width = this.width || 300;
      this.height = this.height || 300;
    }

    this.setupImage();

    // Setup intersection observer for non-priority images
    if (!this.priority) {
      this.setupIntersectionObserver();
    }
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupImage(): void {
    // Clean the source path first
    const cleanSrc = this.src.replace(/^assets\//, '');

    // Use WebP format with fallback
    const webpPath = this.getWebPPath(cleanSrc);
    const avifPath = this.getAvifPath(cleanSrc);

    // Generate srcset for responsive images
    this.srcset = this.generateSrcset(webpPath);

    // Set initial source
    this.optimizedSrc = webpPath;

    // Try AVIF if supported
    if (!this.fallbackAttempted) {
      const img = new Image();
      img.onload = () => {
        if (img.width > 0) {
          this.optimizedSrc = avifPath;
        }
      };
      img.onerror = () => {
        this.fallbackAttempted = true;
      };
      img['src'] = avifPath;
    }
  }

  private setupIntersectionObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img['dataset']['src']) {
              img['src'] = img['dataset']['src'];
              img.removeAttribute('data-src');
            }
            this.observer?.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1,
      }
    );
  }

  private getWebPPath(src: string): string {
    // Get the directory and filename parts
    const lastSlashIndex = src.lastIndexOf('/');
    const directory =
      lastSlashIndex !== -1 ? src.substring(0, lastSlashIndex) : '';
    const filename =
      lastSlashIndex !== -1 ? src.substring(lastSlashIndex + 1) : src;

    // Replace extension and construct path with webp subdirectory
    const webpFilename = filename.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    const path = directory
      ? `${directory}/webp/${webpFilename}`
      : `webp/${webpFilename}`;

    return path.startsWith('http') ? path : `assets/${path}`;
  }

  private getAvifPath(src: string): string {
    // For now, use the same path as WebP since we don't have AVIF files
    return this.getWebPPath(src);
  }

  private generateSrcset(src: string): string {
    const sizes = [320, 640, 960, 1280];
    return sizes.map((size) => `${src}?w=${size} ${size}w`).join(', ');
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!this.fallbackAttempted) {
      this.fallbackAttempted = true;
      // Fallback to original format
      const cleanSrc = this.src.replace(/^assets\//, '');
      const originalSrc = cleanSrc.replace(/\.(webp|avif)$/i, '');
      img['src'] = originalSrc.startsWith('http')
        ? originalSrc
        : `assets/${originalSrc}`;
    }
  }
}
