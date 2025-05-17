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

  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.markFormGroupTouched(this.contactForm);
      return;
    }

    this.isSubmitting = true;

    // Here you would typically make an API call to send the email
    // For now, we'll simulate a successful submission
    setTimeout(() => {
      this.isSubmitting = false;
      this.alertService.success(
        'Message Sent!',
        'Your message has been sent successfully. I will get back to you soon.'
      );
      this.contactForm.reset();
    }, 1500);

    // For actual implementation, you would use EmailJS or a backend service:
    /*
    emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
      from_name: this.contactForm.value.name,
      reply_to: this.contactForm.value.email,
      subject: this.contactForm.value.subject,
      message: this.contactForm.value.message
    }, 'YOUR_USER_ID')
    .then(() => {
      this.isSubmitting = false;
      this.alertService.success('Message Sent!', 'Your message has been sent successfully. I will get back to you soon.');
      this.contactForm.reset();
    }, (error) => {
      this.isSubmitting = false;
      this.alertService.error('Error', 'Failed to send message. Please try again later.');
      console.error('Error sending email:', error);
    });
    */
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
