import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from './material/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IconsModule } from './icons/icons.module';
import { ScrollToTopDirective } from './directives/scroll-to-top.directive';

// Import only the Bootstrap components we need
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgbCollapseModule,
    NgbDropdownModule,
    NgbNavModule,
    IconsModule,
    ScrollToTopDirective,
  ],
  exports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgbCollapseModule,
    NgbDropdownModule,
    NgbNavModule,
    IconsModule,
    ScrollToTopDirective,
  ],
})
export class SharedModule {}
