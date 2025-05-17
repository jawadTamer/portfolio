import {
  Component,
  OnInit,
  ElementRef,
  ViewChildren,
  QueryList,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../models/project.model';
import { ProjectsService } from '../services/projects.service';
import { GsapService } from '../../../animations/services/gsap.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule],
})
export class ProjectsComponent implements OnInit, AfterViewInit {
  projects: Project[] = [];
  isLoading = true;

  @ViewChildren('projectCard') projectCards!: QueryList<ElementRef>;

  constructor(
    private projectsService: ProjectsService,
    private gsapService: GsapService
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.projectCards?.length) {
        this.animateProjects();
      }
    }, 100);
  }

  loadProjects(): void {
    this.projectsService.getProjects().subscribe({
      next: (data) => {
        this.projects = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.isLoading = false;
      },
    });
  }

  animateProjects(): void {
    this.gsapService.animateProjects(this.projectCards.toArray());
  }
}
