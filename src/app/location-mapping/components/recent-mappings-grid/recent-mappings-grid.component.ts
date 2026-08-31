import { Component, Input } from '@angular/core';
import { MappedLocationEntry } from '../../location-mapping.types';

@Component({
    selector: 'app-recent-mappings-grid',
    templateUrl: './recent-mappings-grid.component.html',
    styleUrls: ['./recent-mappings-grid.component.scss'],
})
export class RecentMappingsGridComponent {
    @Input() mappings: MappedLocationEntry[] = [];
}
