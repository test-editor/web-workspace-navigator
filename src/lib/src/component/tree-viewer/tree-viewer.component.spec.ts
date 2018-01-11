import { async, ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Response, ResponseOptions } from '@angular/http';
import { By } from '@angular/platform-browser';
import { mock, instance, verify, when, anyString, anything, deepEqual, strictEqual, capture } from 'ts-mockito';

import { MessagingModule, MessagingService } from '@testeditor/messaging-service';

import { TreeViewerComponent } from './tree-viewer.component';
import { NewElementComponent } from './new-element.component';
import { PersistenceService } from '../../service/persistence/persistence.service';
import { WorkspaceElement } from '../../common/workspace-element';

import { UiState } from '../ui-state';
import * as events from '../event-types';
import { WindowService } from '../../service/browserObjectModel/window.service';
import { DefaultWindowService } from '../../service/browserObjectModel/default.window.service';
import { ElementState } from '../../common/element-state';

export function testBedSetup(providers?: any[]): void {
  TestBed.configureTestingModule({
    imports: [
      MessagingModule.forRoot(),
      FormsModule
    ],
    declarations: [
      TreeViewerComponent,
      NewElementComponent
    ],
    providers: providers
  }).compileComponents();
}

export function createResponse(status: number = 200, body: string = ""): Response {
  return new Response(new ResponseOptions({
    body: body,
    status: status,
    headers: null,
    url: null
  }));
}

describe('TreeViewerComponent', () => {

  let component: TreeViewerComponent;
  let fixture: ComponentFixture<TreeViewerComponent>;
  let messagingService: MessagingService;
  let persistenceService: PersistenceService;
  let windowService: WindowService;

  let singleEmptyFolder: WorkspaceElement = {
    name: 'folder', path: '', type: 'folder',
    children: []
  };

  let foldedFolderWithSubfolders: WorkspaceElement = {
    name: 'top-folder', path: '', type: 'folder',
    children: [
      { name: 'sub-folder-1', path: 'top-folder', type: 'folder', children: [] },
      { name: 'sub-folder-2', path: 'top-folder', type: 'folder', children: [] },
      { name: 'sub-file-1', path: 'top-folder', type: 'file', children: [] }
    ]
  };

  let singleFile: WorkspaceElement = { name: 'file', path: '', type: 'file', children: [] };
  let imageFile: WorkspaceElement = { name: 'image.jpg', path: 'image.jpg', type: 'file', children: [] };

  beforeEach(async(() => {
    persistenceService = mock(PersistenceService);
    windowService = mock(DefaultWindowService);
    testBedSetup([
      { provide: PersistenceService, useValue: instance(persistenceService) },
      { provide: WindowService, useValue: instance(windowService)}
    ]);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeViewerComponent);
    component = fixture.componentInstance;
    component.uiState = new UiState();
    messagingService = TestBed.get(MessagingService);
    fixture.detectChanges();
  });

  function getItemKey(): DebugElement {
    return fixture.debugElement.query(By.css('.tree-view .tree-view-item-key'));
  }

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('non empty folder is reported as non empty', () => {
    component.model = foldedFolderWithSubfolders;
    expect(component.isEmptyFolder()).toBeFalsy();
  });

  it('empty folder is reported as empty', () => {
    component.model = singleEmptyFolder;
    expect(component.isEmptyFolder()).toBeTruthy();
  });

  it('folded folder does not display sub elements', async(() => {
    // given
    component.model = foldedFolderWithSubfolders;

    // when
    fixture.detectChanges();

    // then
    fixture.whenStable().then(() => { // wait for async actions
      let treeview = fixture.debugElement.query(By.css('.tree-view'));
      let treeitems = treeview.queryAll(By.css('.tree-view-item-key'));
      expect(treeitems.length).toEqual(1);
      expect(treeitems[0].nativeElement.innerText).toContain('top-folder');

      expect(component.isFolderExpanded()).toBeFalsy(); // make sure it is folded beforehand
      expect(component.isFolderFolded()).toBeTruthy(); // make sure it is folded beforehand
    });
  }));

  it('expands folder when UI state is set', async(() => {
    // given
    component.model = foldedFolderWithSubfolders;

    // when
    component.uiState.setExpanded(component.model.path, true);
    fixture.detectChanges();

    // then
    fixture.detectChanges();
    fixture.whenStable().then(() => { // wait for async actions
      let treeview = fixture.debugElement.query(By.css('.tree-view'));
      let treeitems = treeview.queryAll(By.css('.tree-view-item-key'));
      expect(treeitems.length).toEqual(4);
      expect(treeitems[0].nativeElement.innerText).toContain('top-folder');
      expect(treeitems[1].nativeElement.innerText).toContain('sub-folder-1');
      expect(treeitems[2].nativeElement.innerText).toContain('sub-folder-2');
      expect(treeitems[3].nativeElement.innerText).toContain('sub-file');

      expect(component.isFolderExpanded()).toBeTruthy();
      expect(component.isFolderFolded()).toBeFalsy();
    });
  }));

  it('sets expanded state when double-clicked', () => {
    // given
    component.model = foldedFolderWithSubfolders;
    fixture.detectChanges();

    // when
    getItemKey().triggerEventHandler('dblclick', null);

    // then
    let expandedState = component.uiState.isExpanded(component.model.path);
    expect(expandedState).toBeTruthy();
  });

  it('has chevron-right icon for unexpanded folders', () => {
    // when
    component.model = foldedFolderWithSubfolders;
    fixture.detectChanges();
    let icon = getItemKey().query(By.css('.icon-type'));

    // then
    expect(icon.classes["glyphicon-chevron-right"]).toBeTruthy();
  });

  it('has chevron-down icon for expanded folders', () => {
    // when
    component.uiState.setExpanded(foldedFolderWithSubfolders.path, true);
    component.model = foldedFolderWithSubfolders;
    fixture.detectChanges();
    let icon = getItemKey().query(By.css('.icon-type'));

    // then
    expect(icon.classes["glyphicon-chevron-down"]).toBeTruthy();
  });

  it('sets expanded state when clicked on chevron icon', () => {
    // given
    component.model = foldedFolderWithSubfolders;
    fixture.detectChanges();
    let icon = getItemKey().query(By.css('.icon-type'));

    // when
    icon.triggerEventHandler('click', null);

    // then
    let expandedState = component.uiState.isExpanded(component.model.path);
    expect(expandedState).toBeTruthy();
  })

  it('folders are not identified as file', () => {
    // given
    component.model = foldedFolderWithSubfolders;

    // when + then
    expect(component.isFile()).toBeFalsy();
    expect(component.isFolder()).toBeTruthy();
  });

  it('files are not identified as folders', () => {
    // given
    component.model = singleFile;

    // when + then
    expect(component.isFile()).toBeTruthy();
    expect(component.isFolder()).toBeFalsy();
  });

  it('onClick() emits "navigation.select" message', () => {
    // given
    component.model = singleFile;
    let callback = jasmine.createSpy('callback');
    messagingService.subscribe(events.NAVIGATION_SELECT, callback);

    // when
    component.onClick();

    // then
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ path: singleFile.path }));
  });

  it('onDoubleClick() emits "navigation.open" message', () => {
    // given
    component.model = singleFile;
    let callback = jasmine.createSpy('callback');
    messagingService.subscribe(events.NAVIGATION_OPEN, callback);

    // when
    component.onDoubleClick();

    // then
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({
      name: singleFile.name,
      path: singleFile.path
    }));
  });

  it('onDoubleClick() on image file opens it in a new tab/window', () => {
    // given
    component.model = imageFile;
    let expectedURL = `http://example.org/documents/${component.model.path}`;
    when(persistenceService.getURL(component.model.path)).thenReturn(expectedURL);

    // when
    component.onDoubleClick();

    // then
    verify(windowService.open(anything())).once();
    expect(capture(windowService.open).first()[0]).toEqual(new URL(expectedURL));
    // verify(windowService.open(expectedURL)).once(); // <-- does not work for whatever reason :\
  });

  it('has css class "active" if given by the UI state', () => {
    // given
    component.model = singleFile;
    fixture.detectChanges();
    expect(getItemKey().classes.active).toBeFalsy();

    // when
    component.uiState.activeEditorPath = singleFile.path;
    fixture.detectChanges();

    // then
    expect(getItemKey().classes.active).toBeTruthy();
  });

  it('has css class "dirty" if given by the UI state', () => {
    // given
    component.model = singleFile;
    fixture.detectChanges();
    expect(getItemKey().classes.dirty).toBeFalsy();

    // when
    component.uiState.setDirty(singleFile.path, true);
    fixture.detectChanges();

    // then
    expect(getItemKey().classes.dirty).toBeTruthy();
  });

  it('has css class "selected" if given by the UI state', () => {
    // given
    component.model = singleFile;
    fixture.detectChanges();
    expect(getItemKey().classes.selected).toBeFalsy();

    // when
    component.uiState.selectedElement = singleFile;
    fixture.detectChanges();

    // then
    expect(getItemKey().classes.selected).toBeTruthy();
  });

  it('requires confirmation before deletion', () => {
    // given
    component.model = singleFile;
    component.level = 1;
    fixture.detectChanges();
    let deleteIcon = getItemKey().query(By.css('.icon-delete'));

    // when
    deleteIcon.nativeElement.click();

    // then
    expect(component.confirmDelete).toBeTruthy();
    fixture.detectChanges();
    let confirm = fixture.debugElement.query(By.css('.tree-view .confirm-delete'));
    expect(confirm).toBeTruthy();
    verify(persistenceService.deleteResource(anyString())).never();
  });

  it('deletes element if confirmed', () => {
    // given
    when(persistenceService.deleteResource(anyString())).thenReturn(Promise.reject("unsupported"));
    component.model = singleFile;
    component.confirmDelete = true;
    fixture.detectChanges();
    let confirmButton = fixture.debugElement.query(By.css('.tree-view .confirm-delete .delete-confirm'));

    // when
    confirmButton.nativeElement.click();

    // then
    expect(component.confirmDelete).toBeFalsy();
    verify(persistenceService.deleteResource(singleFile.path)).once();
  });

  it('does not delete element when cancelled', () => {
    // given
    component.model = singleFile;
    component.confirmDelete = true;
    fixture.detectChanges();
    let cancelButton = fixture.debugElement.query(By.css('.tree-view .confirm-delete .delete-cancel'));

    // when
    cancelButton.nativeElement.click();

    // then
    expect(component.confirmDelete).toBeFalsy();
    verify(persistenceService.deleteResource(anyString())).never();
  });

  it('displays error when deletion failed', (done: () => void) => {
    // given
    component.model = singleFile;
    when(persistenceService.deleteResource(anyString())).thenReturn(Promise.reject("unsupported"));

    // when
    component.onDeleteConfirm();

    // then
    fixture.whenStable().then(() => {
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        expect(component.errorMessage).toBeTruthy();
        let errorMessage = fixture.debugElement.query(By.css('.tree-view-item .alert'));
        expect(errorMessage).toBeTruthy();
        done();
      });
    });
  });

  it('removes confirmation and emits navigation.deleted event when deletion succeeds', async(() => {
    // given
    component.model = singleFile;
    let response = createResponse();
    when(persistenceService.deleteResource(anyString())).thenReturn(Promise.resolve(response));
    let callback = jasmine.createSpy('callback');
    messagingService.subscribe(events.NAVIGATION_DELETED, callback);

    // when
    component.onDeleteConfirm();

    // then
    fixture.whenStable().then(() => {
      expect(component.confirmDelete).toBeFalsy();
      expect(component.errorMessage).toBeFalsy();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({
        name: singleFile.name,
        path: singleFile.path,
        type: singleFile.type
      }));
    });
  }));

  ['bmp', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'BMP', 'Png', 'jPeG'].forEach((extension) => {
    it(`recognizes '${extension}' as image file name extension`, () => {
      // given
      let imageFilename = `image.${extension}`;
      component.model = {
        name: imageFilename, path: imageFilename, type: 'file', children: []
      };

      // when
      let actual = component.isImage();

      // then
      expect(actual).toBeTruthy();
    });
  });

  ['fileWithoutExtension', 'test.tcl', 'image.png.bak', 'i-am-no-jpeg'].forEach((filename) => {
    it(`does not recognize '${filename}' as image`, () => {
      // given
      component.model = {
        name: filename, path: filename, type: 'file', children: []
      };

      // when
      let actual = component.isImage();

      // then
      expect(actual).toBeFalsy();
    });
  });

  it('has picture icon for image files', () => {
    // given
    let imageFilename = 'image.jpg';
    component.model = {
      name: imageFilename, path: imageFilename, type: 'file', children: []
    };
    expect(component.isImage()).toBeTruthy();

    // when
    fixture.detectChanges();
    let icon = getItemKey().query(By.css('.icon-type'));

    // then
    expect(icon.classes['glyphicon-picture']).toBeTruthy();
  });

  it('shows spinning icon for running tests', () => {
    // given
    component.model = { name: 'test.tcl', path: 'test.tcl', type: 'file', children: [], state: ElementState.Running };

    // when
    fixture.detectChanges();

    // then
    let icon = getItemKey().query(By.css('#test-state-running'));
    expect(icon.attributes['class']).toEqual('fa fa-spinner fa-spin');
  });

  it('does not show spinning icon for idle tests', () => {
    // given
    component.model = { name: 'test.tcl', path: 'test.tcl', type: 'file', children: [], state: ElementState.Idle };

    // when
    fixture.detectChanges();

    // then
    let icon = getItemKey().query(By.css('#test-state-running'));
    expect(icon).toBeFalsy();
  });

});
