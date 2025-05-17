import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, FontAwesomeModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  // Font Awesome icons
  faGithub = faGithub;
  faLinkedin = faLinkedin;
  faEnvelope = faEnvelope;
  faPhone = faPhone;

  socialLinks = [
    {
      name: 'GitHub',
      url: 'https://github.com/jawadTamer',
      icon: faGithub,
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/in/jawad-tamer-a2a720292',
      icon: faLinkedin,
    },
    {
      name: 'Email',
      url: 'mailto:jawadtamer97@gmail.com',
      icon: faEnvelope,
    },
    {
      name: 'Phone',
      url: 'tel:+201018529597',
      icon: faPhone,
    },
  ];
}
