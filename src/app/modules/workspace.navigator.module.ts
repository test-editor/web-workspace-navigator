import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { NavigationComponent } from './component/navigation/navigation.component';
import { TreeViewerComponent } from './component/tree-viewer/tree-viewer.component';

import { PathValidator } from './component/tree-viewer/path-validator';
import { PersistenceService } from './service/persistence/persistence.service';
import { PersistenceServiceConfig } from './service/persistence/persistence.service.config';
import { NewElementComponent } from './component/tree-viewer/new-element.component';
import { WindowService, DefaultWindowService } from '@testeditor/testeditor-commons';
import { IndicatorBoxComponent } from './component/tree-viewer/indicator.box.component';
import { IndicatorFieldSetup } from './common/markers/field';
import { RenameElementComponent } from './component/tree-viewer/rename-element.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule
  ],
  declarations: [
    NavigationComponent,
    TreeViewerComponent,
    NewElementComponent,
    RenameElementComponent,
    IndicatorBoxComponent
  ],
  exports: [
    NavigationComponent,
    TreeViewerComponent
  ]
})
export class WorkspaceNavigatorModule {

  static forRoot(persistanceConfig: PersistenceServiceConfig,
                 indicatorFieldSetup: IndicatorFieldSetup): ModuleWithProviders {
    return {
      ngModule: WorkspaceNavigatorModule,
      providers: [
        { provide: PersistenceServiceConfig, useValue: persistanceConfig },
        { provide: WindowService, useClass: DefaultWindowService },
        { provide: IndicatorFieldSetup, useValue: indicatorFieldSetup },
        PathValidator,
        PersistenceService
      ]
    };
  }

}
