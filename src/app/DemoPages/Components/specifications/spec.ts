
export interface Brand {
  id?: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}


export interface SupportedInternetService {
  id?: number;
  name: 'Netflix' | 'Browser' | 'YouTube' | 'HBO Max' | 'Google TV' | 'Disney Plus' | string;
}


export interface SupportedResolution {
  id?: number;
  name: '4K' | '8K' | 'HD' | 'FHD' | string;
}


export interface ScreenSize {
  id?: number;
  name: string;
}

export interface PanelType {
  id?: number;
  name: 'LED' | 'OLED' | 'QLED' | string;
}

export interface Connectivity {
  id?: number;
  name: 'HDMI' | 'Wi-Fi' | 'Bluetooth' | 'Ethernet' | 'USB' | 'RF' | 'Coaxial' | 'Screen Mirroring' | string;
}

export interface SetupResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}
