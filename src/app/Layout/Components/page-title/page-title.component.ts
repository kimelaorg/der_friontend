import {Component, Input} from '@angular/core';
import { faStar, faPlus, IconDefinition } from '@fortawesome/free-solid-svg-icons';

export interface ActionButton {
  text: string;
  icon: IconDefinition;
  class: string;
  onClick: () => void;
}

@Component({
  selector: 'app-page-title',
  templateUrl: './page-title.component.html',
  standalone: false
})
export class PageTitleComponent {

  faStar = faStar;
  faPlus = faPlus;

  @Input() heading: string = '';
  @Input() subheading: string = '';
  @Input() icon: string = '';

  @Input() plusButtonText: string = 'Create New';
  @Input() plusButtonClass: string = 'btn-success';

  @Input() actionButtons: ActionButton[] = [];

  handleButtonClick(buttonAction: () => void) {
    if (buttonAction) {
      buttonAction();
    }
  }

}
