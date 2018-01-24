import { WorkspaceElement } from './workspace-element';
import { Injectable } from '@angular/core';
import { PersistenceService } from '../service/persistence/persistence.service';
import { TestExecutionService } from '../service/execution/test.execution.service';

@Injectable()
export class Workspace {

  private root: WorkspaceElement = null;
  private pathToElement = new Map<string, WorkspaceElement>();

  constructor(private persistenceService: PersistenceService, private executionService: TestExecutionService) {
    this.load();
  }

  public load(): void {
    this.persistenceService.listFiles().then(this.doLoad);
  }

  private invalidate(): void {

  }

  private doLoad(newRoot: WorkspaceElement): void {
    if (this.root !== null) {
      this.invalidate();
    }
    this.root = newRoot;
    this.addToMap(this.root);
  }

  private addToMap(element: WorkspaceElement): void {
    let path = this.normalizePath(element.path);
    this.pathToElement.set(path, element);
    element.children.forEach(child => this.addToMap(child));
  }

  private normalizePath(path: string): string {
    const leadingSlashes = /^\/+/;
    const trailingSlashes = /\/+$/;
    let normalized = path.replace(leadingSlashes, '').replace(trailingSlashes, '');
    return normalized;
  }

  /**
   * Calculates all the subpaths of a given path.
   * The full path is not included in the output.
   */
  getSubpaths(path: string): string[] {
    let normalized = this.normalizePath(path);
    let [first, ...rest] = normalized.split('/');
    let hasSubpaths = rest.length > 0;
    if (hasSubpaths) {
      let result = [first];
      let lastPath = first;
      for (let i = 0; i < rest.length - 1; i++) {
        let segment = rest[i];
        lastPath = lastPath + '/' + segment;
        result.push(lastPath);
      }
      return result;
    } else {
      return [];
    }
  }

  getElement(path: string): WorkspaceElement | undefined {
    let normalized = this.normalizePath(path);
    return this.pathToElement.get(normalized);
  }

  getParent(path: string): WorkspaceElement {
    let normalized = this.normalizePath(path);
    if (normalized !== '') {
      let lastSeparatorIndex = normalized.lastIndexOf('/');
      if (lastSeparatorIndex >= 0) {
        let parentPath = normalized.substring(0, lastSeparatorIndex);
        return this.getElement(parentPath);
      } else if (this.normalizePath(this.root.path) === '') {
        return this.root;
      }
    }
    return null;
  }

  getRootPath(): string {
    return this.root.path;
  }
}
