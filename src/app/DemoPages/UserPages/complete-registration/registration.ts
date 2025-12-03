import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface LocationDetail {
  id: number;
  name: string;
  post_code?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Registration {

  private readonly baseUrl = 'http://localhost:8000/api/v1/locations';

  // --- MOCK Data Structure for demonstration ---
  private mockData = {
    1: { // Dar es Salaam
      districts: [
        { id: 101, name: 'Kinondoni' },
        { id: 102, name: 'Ilala' },
      ] as LocationDetail[], // Explicitly typed
      wards: {
        101: [{ id: 1011, name: 'Mbezi' }, { id: 1012, name: 'Manzese' }] as LocationDetail[],
        102: [{ id: 1021, name: 'Kariakoo' }] as LocationDetail[],
      },
      streets: {
        1011: [{ id: 10111, name: 'Mbezi Street', post_code: '16100' }, { id: 10112, name: 'Tankibovu', post_code: '16101' }] as LocationDetail[],
        1021: [{ id: 10211, name: 'Msimbazi Road', post_code: '11100' }] as LocationDetail[],
      },
    },
    2: { // Mwanza
      districts: [{ id: 201, name: 'Nyamagana' }] as LocationDetail[],
      wards: {
        201: [{ id: 2011, name: 'Ilemela' }] as LocationDetail[],
      },
      streets: {
        2011: [{ id: 20111, name: 'Makongoro Road', post_code: '33100' }] as LocationDetail[],
      },
    },
  };

  private mockRegions: LocationDetail[] = [
    { id: 1, name: 'Dar es Salaam' },
    { id: 2, name: 'Mwanza' },
  ];

  constructor(private http: HttpClient) { }

  getRegions(): Observable<LocationDetail[]> {
    return of(this.mockRegions);
  }

  getDistricts(regionId: number): Observable<LocationDetail[]> {
    const regionData = this.mockData[regionId as keyof typeof this.mockData];
    return of(regionData?.districts || []);
  }

  getWards(regionId: number, districtName: string): Observable<LocationDetail[]> {
    const regionData = this.mockData[regionId as keyof typeof this.mockData];
    const district = regionData?.districts.find(d => d.name === districtName);
    const wards = regionData?.wards[district?.id as keyof typeof regionData.wards];
    return of(wards || []);
  }

  // FIX: Explicitly cast arrays to LocationDetail[] to avoid TS2339 error
  getStreets(regionId: number, wardName: string): Observable<LocationDetail[]> {
    const regionData = this.mockData[regionId as keyof typeof this.mockData];

    if (!regionData) {
        return of([]);
    }

    const districtKeys = Object.keys(regionData.wards || {});
    for (const districtIdStr of districtKeys) {
        const districtId = parseInt(districtIdStr);

        // Explicitly cast to LocationDetail[] to allow .find()
        const wards = (regionData.wards[districtId as keyof typeof regionData.wards] as LocationDetail[]) || [];

        const targetWard = wards.find(w => w.name === wardName);

        if (targetWard) {
            // Explicitly cast the resulting streets array
            const streets = (regionData.streets[targetWard.id as keyof typeof regionData.streets] as LocationDetail[]) || [];
            return of(streets);
        }
    }
    return of([]);
  }
}
