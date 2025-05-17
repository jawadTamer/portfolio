import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Project } from '../models/project.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  // This can be updated to use a real API endpoint later
  private jsonUrl = 'assets/data/projects.json';

  constructor(private http: HttpClient) {}

  /**
   * Get all projects
   */
  getProjects(): Observable<Project[]> {
    return this.http
      .get<Project[]>(this.jsonUrl)
      .pipe(catchError(this.handleError<Project[]>('getProjects', [])));
  }

  /**
   * Get a specific project by ID
   */
  getProjectById(id: string): Observable<Project | undefined> {
    return this.http.get<Project[]>(this.jsonUrl).pipe(
      map((projects) => projects.find((p) => p.id === id)),
      catchError(
        this.handleError<Project | undefined>('getProjectById', undefined)
      )
    );
  }

  /**
   * Get featured projects
   */
  getFeaturedProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.jsonUrl).pipe(
      map((projects) => projects.filter((p) => p.featured)),
      catchError(this.handleError<Project[]>('getFeaturedProjects', []))
    );
  }

  /**
   * Handle HTTP operation errors
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);

      // Return a safe result
      return of(result as T);
    };
  }
}
