import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { AlertService } from '../../core/services/alert.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { send } from '@emailjs/browser';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    FontAwesomeModule,
  ],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
})
export class ContactComponent implements OnInit {
  contactForm!: FormGroup;
  isSubmitting = false;
  faGithub = faGithub;
  faLinkedin = faLinkedin;

  constructor(private fb: FormBuilder, private alertService: AlertService) {}

  ngOnInit(): void {
    this.initForm();
  }
 
  
  initForm(): void {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.contactForm.invalid) {
      this.markFormGroupTouched(this.contactForm);
      return;
    }

    this.isSubmitting = true;

    const SERVICE_ID = 'service_epap3ed';
    const NOTIFY_TEMPLATE_ID = 'template_d7lb1ee';
    const AUTOREPLY_TEMPLATE_ID = 'template_l5np928';
    const PUBLIC_KEY = 'Qn10vz3D7TY8kEzCp';

    const templateParams = {
      name: this.contactForm.value.name,
      email: this.contactForm.value.email,
      subject: this.contactForm.value.subject,
      message: this.contactForm.value.message,
    };

    try {
      await send(SERVICE_ID, NOTIFY_TEMPLATE_ID, templateParams, PUBLIC_KEY);
      await send(SERVICE_ID, AUTOREPLY_TEMPLATE_ID, templateParams, PUBLIC_KEY);
      this.isSubmitting = false;
      this.alertService.success(
        'Message Sent!',
        'Your message has been sent successfully. I will get back to you soon.'
      );
      this.contactForm.reset();
    } catch (error) {
      this.isSubmitting = false;
      this.alertService.error(
        'Error',
        'Failed to send message. Please try again later.'
      );
      console.error('Error sending email:', error);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
}
