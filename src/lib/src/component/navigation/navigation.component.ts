import { Component, OnInit } from '@angular/core';

import { WorkspaceElement } from '../../service/persistence/workspace-element';
import { PersistenceService } from '../../service/persistence/persistence.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})

export class NavigationComponent implements OnInit {

  workspaceRoot: WorkspaceElement;

  constructor(private persistenceService: PersistenceService) { }

  ngOnInit() {
    this.persistenceService.listFiles().then(element => {
      this.workspaceRoot = element;
    });
  }

}
