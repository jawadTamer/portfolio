import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { GsapService } from '../../../animations/services/gsap.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { OptimizedImageComponent } from '../../../shared/components/optimized-image/optimized-image.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    OptimizedImageComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements AfterViewInit {
  @ViewChild('heroTitle', { static: true }) heroTitle!: ElementRef;
  @ViewChild('heroSubtitle', { static: true }) heroSubtitle!: ElementRef;
  @ViewChild('heroCta', { static: true }) heroCta!: ElementRef;

  constructor(private gsapService: GsapService) {}

  ngAfterViewInit(): void {
    // Use requestIdleCallback for better performance
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => this.animateHero(), {
        timeout: 100,
      });
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(() => this.animateHero(), 100);
    }
  }

  private animateHero(): void {
    // Check if elements are in viewport before animating
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          this.gsapService.animateHeroText(
            this.heroTitle,
            this.heroSubtitle,
            this.heroCta
          );
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px',
      }
    );

    observer.observe(this.heroTitle.nativeElement);
  }
}
