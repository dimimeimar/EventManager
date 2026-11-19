import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import * as L from 'leaflet';

// Χάρτης OpenStreetMap (Leaflet) που δείχνει την τοποθεσία μιας εκδήλωσης.
// Χρησιμοποιούμε κυκλικό marker ώστε να μη χρειάζονται τα αρχεία εικόνας του Leaflet.
@Component({
  selector: 'app-event-map',
  standalone: false,
  template: '<div #map class="map"></div>',
  styles: ['.map { height: 280px; border-radius: 6px; border: 1px solid #ccd; }'],
})
export class EventMapComponent implements AfterViewInit, OnDestroy {
  @Input() latitude!: number;
  @Input() longitude!: number;
  @Input() title = '';
  @ViewChild('map') mapElement!: ElementRef<HTMLDivElement>;

  private map?: L.Map;

  ngAfterViewInit(): void {
    this.map = L.map(this.mapElement.nativeElement).setView([this.latitude, this.longitude], 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
    L.circleMarker([this.latitude, this.longitude], { radius: 10, color: '#1d4f91', fillOpacity: 0.8 })
      .addTo(this.map)
      .bindPopup(this.title);
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
