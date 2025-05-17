import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PerformanceService {
  private worker: Worker | null = null;
  private processingSubject = new Subject<any>();

  constructor() {
    // Create worker only if supported by the browser
    if (typeof Worker !== 'undefined') {
      this.initializeWorker();
    } else {
      console.warn('Web Workers are not supported in this environment');
    }
  }

  private initializeWorker(): void {
    try {
      // Create a new worker
      this.worker = new Worker(
        new URL('../workers/performance.worker', import.meta.url),
        { type: 'module' }
      );

      // Set up message listener
      this.worker.onmessage = ({ data }) => {
        if (data.type === 'process-complete') {
          this.processingSubject.next(data.results);
        }
      };

      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
        this.processingSubject.error(error);
      };
    } catch (error) {
      console.error('Error initializing worker:', error);
    }
  }

  processImages(images: any[]): Observable<any[]> {
    if (!this.worker) {
      // Fallback to synchronous processing if worker not available
      return new Observable((subscriber) => {
        const results = images.map((image) => ({ ...image, processed: true }));
        subscriber.next(results);
        subscriber.complete();
      });
    }

    // Process via worker
    this.worker.postMessage({
      type: 'process-images',
      images,
    });

    return this.processingSubject.asObservable();
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
