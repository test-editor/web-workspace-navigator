import { Component } from '@angular/core';
import { MessagingService } from '@testeditor/messaging-service';
import { WorkspaceDocument } from '@testeditor/workspace-navigator';

import * as events from '@testeditor/workspace-navigator';

@Component({
  selector: 'demo-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  lastSelected: any;
  lastOpened: any;

  constructor(messagingService: MessagingService) {
    messagingService.subscribe(events.NAVIGATION_SELECT, element => {
      this.lastSelected = element;
    });
    messagingService.subscribe(events.NAVIGATION_OPEN, element => {
      this.lastOpened = element;
    });
  }

}
