import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  constructor() {}

  /**
   * Show success alert
   */
  success(title: string, message?: string): void {
    Swal.fire({
      icon: 'success',
      title: title,
      text: message,
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  }

  /**
   * Show error alert
   */
  error(title: string, message?: string): void {
    Swal.fire({
      icon: 'error',
      title: title,
      text: message,
      confirmButtonText: 'OK',
    });
  }

  /**
   * Show warning alert
   */
  warning(title: string, message?: string): void {
    Swal.fire({
      icon: 'warning',
      title: title,
      text: message,
      confirmButtonText: 'OK',
    });
  }

  /**
   * Show info alert
   */
  info(title: string, message?: string): void {
    Swal.fire({
      icon: 'info',
      title: title,
      text: message,
      confirmButtonText: 'OK',
    });
  }

  /**
   * Show confirmation dialog
   */
  confirm(title: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      Swal.fire({
        title: title,
        text: message,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
      }).then((result) => {
        resolve(result.isConfirmed);
      });
    });
  }
}
