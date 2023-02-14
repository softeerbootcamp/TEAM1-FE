import Component from '@/core/Component';
import styles from './ExperienceMap.module.scss';
import { mapStyle } from '@/utils/mapStyle';
import { seoulLocations } from './dummyData';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { loadscript } from '@/utils/googleAPI';
import { qs } from '@/utils/querySelector';
import { mapInfo } from './interface';

export class ExperienceMap extends Component {
  setup() {
    this.state.markers = [];
    this.state.userLocation = {};
    this.state.map = null;
    if (this.props.hasOwnProperty('ends')) {
      this.state.userLocation = {
        lat: (this.props.ends.latHi + this.props.ends.latLo) / 2,
        lng: (this.props.ends.lngHi + this.props.ends.lngLo) / 2,
      };
    } else {
      this.state.userLocation = {
        lat: 37.56,
        lng: 127.0,
      };
    }
  }

  template(): string {
    return `
    <div class="${styles['desc']}">시승해보고 싶은 싶은 위치를 골라주세요!</div>
    <div id="googleMap" class="${styles['googleMap']}"></div>`;
  }

  mounted(): void {
    this.init();
  }

  init() {
    loadscript(
      `https://maps.googleapis.com/maps/api/js?key=${process.env.VITE_API_KEY}&callback=initMap`,
      this.initMap.bind(this)
    );
  }

  initMap() {
    const map = new google.maps.Map(qs('#googleMap')!, {
      zoom: 15,
      center: this.state.userLocation as google.maps.LatLng,
      styles: mapStyle() as object[],
    });
    this.state.map = map;
    this.moveMap();

    google.maps.event.addListener(
      map,
      'bounds_changed',
      this.handleDebounce(() => {
        let bounds = map.getBounds()! as google.maps.LatLngBounds;
        const temp = bounds.toJSON();
        this.props.userLocation = {
          latHi: temp.north,
          latLo: temp.south,
          lngHi: temp.east,
          lngLo: temp.west,
        };
        this.props.changePositionHandler(this.getMapInfo());
      }, 500)
    );

    this.refreshMap();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        const { latitude, longitude } = coords;
        moveMapToLocation(latitude, longitude);
      });
    } else {
      console.log('Geolocation is not supported by this browser.');
    }
    function moveMapToLocation(lat: number, lng: number) {
      let newLocation = new google.maps.LatLng(lat, lng);
      map.setCenter(newLocation);
    }
  }

  moveMap() {
    this.state.map.panTo(this.state.userLocation);
  }

  createMarkers() {
    for (let i = 0; i < seoulLocations.length; i++) {
      let mker = new google.maps.Marker({
        position: seoulLocations[i] as google.maps.LatLng,
        map: this.state.map,
        animation: google.maps.Animation.DROP,
      });
      this.state.markers.push(mker);
    }
    const markers = this.state.markers;
    const map = this.state.map;
    new MarkerClusterer({ map, markers });
  }

  refreshMap() {
    this.state.markers = [];
    this.createMarkers();
  }

  getMapBounds() {
    if (!this.state.map) return;
    const mapBounds = this.state.map.getBounds();
    const lngHi = mapBounds.Ma.hi;
    const lngLo = mapBounds.Ma.lo;
    const latHi = mapBounds.Ya.hi;
    const latLo = mapBounds.Ya.lo;
    return { lngHi, lngLo, latHi, latLo };
  }

  async getLocation() {
    const location = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
      });
    });
    return location;
  }

  handleDebounce(callback: Function, limit: number) {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: any) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        callback.apply(this, args);
      }, limit);
    };
  }

  getMapInfo(): mapInfo {
    const { map } = this.state;
    const mapBounds = map.getBounds();
    const lngHi = mapBounds.Ma.hi;
    const lngLo = mapBounds.Ma.lo;
    const latHi = mapBounds.Ya.hi;
    const latLo = mapBounds.Ya.lo;
    return {
      centerLat: map.getCenter().lat(),
      centerLng: map.getCenter().lng(),
      zoom: map.getZoom(),
      latHi,
      latLo,
      lngHi,
      lngLo,
    };
  }

  setMapPosition(lat: number, lng: number, zoom: number) {
    const { map } = this.state;
    const newCenter = { lat, lng };
    map.setCenter(newCenter);
    map.setZoom(zoom);
  }
}
