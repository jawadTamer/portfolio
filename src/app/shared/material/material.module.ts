import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Core Material modules that are needed immediately
const coreMaterialModules = [
  import('@angular/material/core').then((m) => m.MatCommonModule),
  import('@angular/material/button').then((m) => m.MatButtonModule),
  import('@angular/material/icon').then((m) => m.MatIconModule),
  import('@angular/material/toolbar').then((m) => m.MatToolbarModule),
];

// Form-related Material modules - lazy loaded
const formMaterialModules = [
  import('@angular/material/form-field').then((m) => m.MatFormFieldModule),
  import('@angular/material/input').then((m) => m.MatInputModule),
  import('@angular/material/select').then((m) => m.MatSelectModule),
  import('@angular/material/checkbox').then((m) => m.MatCheckboxModule),
];

// Card-related Material modules - lazy loaded
const cardMaterialModules = [
  import('@angular/material/card').then((m) => m.MatCardModule),
  import('@angular/material/divider').then((m) => m.MatDividerModule),
];

// Navigation-related Material modules - lazy loaded
const navMaterialModules = [
  import('@angular/material/menu').then((m) => m.MatMenuModule),
  import('@angular/material/sidenav').then((m) => m.MatSidenavModule),
  import('@angular/material/list').then((m) => m.MatListModule),
];

// UI-related Material modules - lazy loaded
const uiMaterialModules = [
  import('@angular/material/progress-spinner').then(
    (m) => m.MatProgressSpinnerModule
  ),
  import('@angular/material/snack-bar').then((m) => m.MatSnackBarModule),
  import('@angular/material/dialog').then((m) => m.MatDialogModule),
];

@NgModule({
  imports: [CommonModule],
  exports: [CommonModule],
})
export class MaterialModule {
  static async forRoot() {
    const modules = await Promise.all(coreMaterialModules);
    return {
      ngModule: MaterialModule,
      imports: modules,
    };
  }

  static async forForms() {
    const modules = await Promise.all(formMaterialModules);
    return {
      ngModule: MaterialModule,
      imports: modules,
    };
  }

  static async forCards() {
    const modules = await Promise.all(cardMaterialModules);
    return {
      ngModule: MaterialModule,
      imports: modules,
    };
  }

  static async forNavigation() {
    const modules = await Promise.all(navMaterialModules);
    return {
      ngModule: MaterialModule,
      imports: modules,
    };
  }

  static async forUI() {
    const modules = await Promise.all(uiMaterialModules);
    return {
      ngModule: MaterialModule,
      imports: modules,
    };
  }
}
