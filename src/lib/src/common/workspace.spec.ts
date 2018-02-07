import { ElementType } from './element-type';
import { Workspace } from './workspace';
import { WorkspaceElement } from './workspace-element';
import { grandChild, createWorkspaceWithSubElements, middleChild, firstChild, lastChild, greatGrandChild, root } from './workspace.spec.data';

function createWorkspaceWithRootFolder(path: string): Workspace {
  let element: WorkspaceElement = {
    name: 'folder',
    path: path,
    type: ElementType.Folder,
    children: []
  };
  const workspace = new Workspace();
  workspace.reload(element);
  return workspace;
}

describe('Workspace', () => {

  it('can retrieve root element', () => {
    // given
    let workspace = createWorkspaceWithRootFolder('root');

    // when
    let retrievedElement = workspace.getElement('root');

    // then
    expect(retrievedElement.path).toBe(workspace.getRootPath());
  });

  it('normalizes paths when retrieving elements', () => {
    // given
    let workspace = createWorkspaceWithRootFolder('/some/folder//');

    // when
    let retrievedElement = workspace.getElement('some/folder');

    // then
    expect(retrievedElement.path).toBe(workspace.getRootPath());
  });

});

describe('Workspace.getSubpaths()', () => {

  // given
  let workspace = createWorkspaceWithRootFolder('root');

  it('returns no subpaths for empty path', () => {
    // when + then
    expect(workspace.getSubpaths('')).toEqual([]);
  });

  it('returns no subpaths for simple file', () => {
    // when + then
    expect(workspace.getSubpaths('example.tsl')).toEqual([]);
  });

  it('provides all subpaths of a path', () => {
    // given
    let path = 'some/example/path';

    // when
    let subpaths = workspace.getSubpaths(path);

    // then
    expect(subpaths).toEqual(['some', 'some/example']);
  });

  it('normalizes the paths', () => {
    // given
    let path = '//some/example/path//';

    // when
    let subpaths = workspace.getSubpaths(path);

    // then
    expect(subpaths).toEqual(['some', 'some/example']);
  });

});

// describe('Workspace.getParent()', () => {

//   it('returns the parent element', () => {
//     // given
//     let path = grandChild.path;
//     // when
//     let actualParent = createWorkspaceWithSubElements().getParent(path);
//     // then
//     expect(actualParent).toEqual(middleChild.path);
//   });

//   it('returns null for the root element', () => {
//     // given
//     let workspace = createWorkspaceWithSubElements();
//     let path = root.path;
//     // when
//     let actualParent = workspace.getParent(path);
//     // then
//     expect(actualParent).toBeNull();
//   });


//   it('returns null for parent of empty path', () => {
//     // given
//     let workspace = createWorkspaceWithRootFolder('/');
//     // when
//     let actualParent = workspace.getParent('');
//     // then
//     expect(actualParent).toBeNull();
//   });

//   it('returns root, if root´s normalized path is the empty string, for a path not containing any slashes', () => {
//     // given
//     let workspace = createWorkspaceWithRootFolder('/');
//     workspace.getElement(root.path).children.push({
//       name: 'firstChild',
//       path: 'firstChild',
//       type: ElementType.File,
//       children: []
//     });
//     // when
//     let actualParent = workspace.getParent('firstChild');
//     // then
//     expect(actualParent).toEqual(workspace.getRootPath());
//   });

// });

describe('Workspace Navigation', () => {

  // given
  let workspace: Workspace;

  beforeEach(() => {
    workspace = createWorkspaceWithSubElements();
    workspace.setExpanded(root.path, true);
    workspace.setExpanded(middleChild.path, true);
    workspace.setExpanded(grandChild.path, true);
  });

  describe('selectSuccessor()', () => {

    it('returns the first child element', () => {
      // given
      workspace.setSelected(root.path);

      // when
      workspace.selectSuccessor();

      // then
      expect(workspace.getSelected()).toEqual(firstChild.path);
    });

    it('returns the next sibling element', () => {
      // given
      workspace.setSelected(firstChild.path);

      // when
      workspace.selectSuccessor();

      // then
      expect(workspace.getSelected()).toEqual(middleChild.path);
    });

    it('returns the parent`s next sibling element when collapsed', () => {
      // given
      workspace.setSelected(grandChild.path);
      workspace.setExpanded(grandChild.path, false);

      // when
      workspace.selectSuccessor();

      // then
      expect(workspace.getSelected()).toEqual(lastChild.path);
    });

    it('does not change selection for last element', () => {
      // given
      workspace.setSelected(lastChild.path);

      // when
      workspace.selectSuccessor();

      // then
      expect(workspace.getSelected()).toEqual(lastChild.path);
    });

    it('skips collapsed elements and returns next sibling element', () => {
      // given
      workspace.setSelected(lastChild.path);
      workspace.setExpanded(middleChild.path, false);

      // when
      workspace.selectSuccessor();

      // then
      expect(workspace.getSelected()).toEqual(lastChild.path);
    });
  });

  // describe('nextSiblingOrAncestorSibling()', () => {

  //   it('returns null for root', () => {
  //     // given
  //     workspace.setSelected(root.path);
  //     // when
  //     let actualSuccessor = workspace.nextSiblingOrAncestorSibling(null, getRoot(workspace));

  //     // then
  //     expect(actualSuccessor).toEqual(null);
  //   });

  //   it('returns null last element', () => {
  //     // when
  //     let actualSuccessor = workspace.nextSiblingOrAncestorSibling(getRoot(workspace), lastChild);

  //     // then
  //     expect(actualSuccessor).toEqual(null);
  //   });

  //   it('returns next sibling', () => {
  //     // when
  //     let actualSuccessor = workspace.nextSiblingOrAncestorSibling(getRoot(workspace), firstChild);

  //     // then
  //     expect(actualSuccessor).toEqual(middleChild);
  //   });

  //   it('returns parent`s next sibling', () => {
  //     // when
  //     let actualSuccessor = workspace.nextSiblingOrAncestorSibling(middleChild, grandChild);

  //     // then
  //     expect(actualSuccessor).toEqual(lastChild);
  //   });
  // });

  describe('previousVisible()', () => {
    it('does not change selection for root', () => {
      // given
      workspace.setSelected(root.path);
      // when
      workspace.selectPredecessor();

      // then
      expect(workspace.getSelected()).toEqual(root.path);
    });

    it('returns parent', () => {
      // given
      workspace.setSelected(firstChild.path);

      // when
      workspace.selectPredecessor();

      // then
      expect(workspace.getSelected()).toEqual(root.path);
    });

    it('returns preceeding sibling', () => {
      // given
      workspace.setSelected(middleChild.path);

      // when
      workspace.selectPredecessor();

      // then
      expect(workspace.getSelected()).toEqual(firstChild.path);
    });

    it('returns preceeding sibling`s last descendant', () => {
      // given
      workspace.setSelected(lastChild.path);

      // when
      workspace.selectPredecessor();

      // then
      expect(workspace.getSelected()).toEqual(greatGrandChild.path);
    });

    it('skips collapsed elements and returns preceeding sibling', () => {
      // given
      workspace.setSelected(lastChild.path);
      workspace.setExpanded(middleChild.path, false);

      // when
      workspace.selectPredecessor();

      // then
      expect(workspace.getSelected()).toEqual(middleChild.path);
    });
  });

  // describe('lastVisibleDescendant()', () => {
  //   it('returns last child for root', () => {
  //     // when
  //     let actualSuccessor = workspace.lastVisibleDescendant(getRoot(workspace));

  //     // then
  //     expect(actualSuccessor).toEqual(lastChild);
  //   });

  //   it('returns itself when collapsed', () => {
  //     // given
  //     workspace.setExpanded(root.path, false);
  //     // when
  //     let actualSuccessor = workspace.lastVisibleDescendant(getRoot(workspace));

  //     // then
  //     expect(actualSuccessor).toEqual(getRoot(workspace));
  //   });

  //   it('returns last descendant', () => {
  //     // when
  //     let actualSuccessor = workspace.lastVisibleDescendant(middleChild);

  //     // then
  //     expect(actualSuccessor).toEqual(greatGrandChild);
  //   });

  //   it('returns last visible descendant', () => {
  //     // given
  //     workspace.setExpanded(grandChild.path, false);
  //     // when
  //     let actualSuccessor = workspace.lastVisibleDescendant(middleChild);

  //     // then
  //     expect(actualSuccessor).toEqual(grandChild);
  //   });
  // });
});
