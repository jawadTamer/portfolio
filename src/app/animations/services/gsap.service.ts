import { Injectable, ElementRef } from '@angular/core';
import { gsap } from 'gsap';

@Injectable({
  providedIn: 'root',
})
export class GsapService {
  private scrollTrigger: any = null;

  constructor() {
    // Lazy load ScrollTrigger only when needed
    this.loadScrollTrigger();
  }

  private async loadScrollTrigger() {
    if (!this.scrollTrigger) {
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);
      this.scrollTrigger = ScrollTrigger;
    }
  }

  /**
   * Animate hero section text with staggered reveal
   */
  animateHeroText(
    heroTitle: ElementRef,
    heroSubtitle: ElementRef,
    heroCta: ElementRef
  ): void {
    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      const tl = gsap.timeline({
        defaults: {
          ease: 'power3.out',
          duration: 0.8,
          clearProps: 'all', // Clean up after animation
        },
      });

      tl.from(heroTitle.nativeElement, {
        y: 50,
        opacity: 0,
      })
        .from(
          heroSubtitle.nativeElement,
          {
            y: 30,
            opacity: 0,
          },
          '-=0.4'
        )
        .from(
          heroCta.nativeElement,
          {
            y: 20,
            opacity: 0,
          },
          '-=0.4'
        );
    });
  }

  /**
   * Animate projects section with scroll trigger
   */
  async animateProjects(projectCards: ElementRef[]): Promise<void> {
    await this.loadScrollTrigger();

    // Use IntersectionObserver for better performance
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            gsap.from(entry.target, {
              opacity: 0,
              y: 50,
              duration: 0.8,
              delay: index * 0.1,
              clearProps: 'all',
            });
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px',
      }
    );

    projectCards.forEach((card) => {
      observer.observe(card.nativeElement);
    });
  }

  /**
   * Animate skills section with staggered entry
   */
  async animateSkills(skillItems: ElementRef[]): Promise<void> {
    await this.loadScrollTrigger();

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          gsap.from(
            skillItems.map((item) => item.nativeElement),
            {
              opacity: 0,
              y: 30,
              stagger: 0.1,
              duration: 0.6,
              clearProps: 'all',
            }
          );
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -150px 0px',
      }
    );

    if (skillItems.length > 0) {
      observer.observe(skillItems[0].nativeElement.parentElement);
    }
  }

  /**
   * Create a timeline animation for an element appearing
   */
  fadeInUpElement(element: ElementRef, delay: number = 0): void {
    requestAnimationFrame(() => {
      gsap.from(element.nativeElement, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        delay,
        clearProps: 'all',
      });
    });
  }
}
