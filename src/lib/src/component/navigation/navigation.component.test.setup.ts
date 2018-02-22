import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationComponent } from './navigation.component';
import { Workspace } from '../../common/workspace';
import { WorkspaceElement } from '../../common/workspace-element';
import { ElementType } from '../../common/element-type';

import { mock, when, anyOfClass, instance, verify, resetCalls } from 'ts-mockito';

import { PersistenceService } from '../../service/persistence/persistence.service';
import { TestExecutionService } from '../../service/execution/test.execution.service';
import { Response, ResponseOptions } from '@angular/http';
import { ElementState } from '../../common/element-state';
import { IndicatorFieldSetup } from '../../common/markers/field';
import { MessagingService } from '@testeditor/messaging-service';
import * as events from '../event-types';

export const HTTP_STATUS_OK = 200;
export const HTTP_STATUS_CREATED = 201;
export const HTTP_STATUS_ERROR = 500;

export const testEditorIndicatorFieldSetup: IndicatorFieldSetup = {
  fields: [
    {
      condition: (element) => element && element.name.endsWith('.tcl'),
      states: [{
        condition: (marker) => marker.testStatus === ElementState.Running,
        cssClasses: 'fa fa-spinner fa-spin',
        label: (marker) => `Test "${marker.name}" is running`,
      }, {
        condition: (marker) => marker.testStatus === ElementState.LastRunSuccessful,
        cssClasses: 'fa fa-circle test-success',
        label: (marker) => `Last run of test "${marker.name}" was successful`,
      }, {
        condition: (marker) => marker.testStatus === ElementState.LastRunFailed,
        cssClasses: 'fa fa-circle test-failure',
        label: (marker) => `Last run of test "${marker.name}" has failed`,
      }]
    }
  ]
};


export const tclFile: WorkspaceElement = {
  name: 'file.tcl',
  path: 'subfolder/file.tcl',
  type: ElementType.File,
  children: []
};

export const nonExecutableFile: WorkspaceElement = {
  name: 'nonExecutable.txt',
  path: 'subfolder/nonExecutable.txt',
  type: ElementType.File,
  children: []
};

export const succeedingSiblingOfTclFile: WorkspaceElement = {
  name: 'siblingOf.file.tcl',
  path: 'subfolder/siblingOf.file.tcl',
  type: ElementType.File,
  children: []
};

export const lastElement: WorkspaceElement = {
  name: 'last.element',
  path: 'subfolder/last.element',
  type: ElementType.File,
  children: []
};

export const subfolder: WorkspaceElement = {
  name: 'subfolder',
  path: 'subfolder',
  type: ElementType.Folder,
  children: [
    {
      name: 'newFolder',
      path: 'subfolder/newFolder',
      type: ElementType.Folder,
      children: []
    },
    nonExecutableFile,
    tclFile,
    succeedingSiblingOfTclFile,
    lastElement
  ]
};

export const root: WorkspaceElement = {
  name: 'root',
  path: '',
  type: ElementType.Folder,
  children: [subfolder]
};

export const responseBeforeTermination = new Response(new ResponseOptions({
  status: HTTP_STATUS_OK,
  body: 'RUNNING'
}));
const responseAfterTermination = new Response(new ResponseOptions({
  status: HTTP_STATUS_OK,
  body: 'SUCCESS'
}));

export function mockedPersistenceService() {
  const persistenceService = mock(PersistenceService);
  when(persistenceService.listFiles()).thenReturn(Promise.resolve(tclFile));
  return persistenceService;
}

export function mockWorkspaceReloadRequestOnce(messagingService: MessagingService, response: WorkspaceElement): void {
  const subscription = messagingService.subscribe(events.WORKSPACE_RELOAD_REQUEST, () => {
    subscription.unsubscribe();
    messagingService.publish(events.WORKSPACE_RELOAD_RESPONSE, response);
});
}

export function mockedTestExecutionService() {
  const executionService = mock(TestExecutionService);
  setTestExecutionServiceResponse(executionService, HTTP_STATUS_CREATED​​);
  mockTestStatusServiceWithRunningRunningSuccessSequence(executionService);
  when(executionService.statusAll()).thenReturn(Promise.resolve(new Map<string, ElementState>([])));
  return executionService;
}

export function setTestExecutionServiceResponse(service: TestExecutionService, statusCode: number) {
  const response = new Response(new ResponseOptions({status: statusCode}));
  when(service.execute(tclFile.path)).thenReturn(Promise.resolve(response));
}

export function mockTestStatusServiceWithRunningRunningSuccessSequence(service: TestExecutionService) {
  when(service.status(tclFile.path))
      .thenReturn(Promise.resolve(responseBeforeTermination))
      .thenReturn(Promise.resolve(responseBeforeTermination))
      .thenReturn(Promise.resolve(responseAfterTermination));
}

export function mockTestStatusServiceWithPromiseRunning(service: TestExecutionService, delayMillis: number) {
  when(service.status(tclFile.path))
      .thenCall(() => new Promise(resolve => setTimeout(() => resolve(responseBeforeTermination), delayMillis)));
}

export function setupWorkspace(component: NavigationComponent, messagingService: MessagingService,
  fixture: ComponentFixture<NavigationComponent>): void {

  component.retrieveWorkspaceRoot()
  messagingService.publish(events.WORKSPACE_RELOAD_RESPONSE, root);
  fixture.detectChanges();
}
