import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scroll-to-top',
  standalone: true,
  imports: [CommonModule],
  template: '', // No template needed, purely functional component
  styles: [],
})
export class ScrollToTopComponent implements OnInit, OnDestroy {
  private subscription: Subscription | undefined;

  constructor(private router: Router) {}

  ngOnInit() {
    // Subscribe to router events
    this.subscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        // Apply multiple scrolling techniques
        try {
          window.scroll(0, 0);
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0; // For Safari

          // Force browser to respect scroll
          setTimeout(() => {
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
          }, 100);
        } catch (e) {
          console.error('Error scrolling to top:', e);
        }
      });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
