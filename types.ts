export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SPEAKING = 'SPEAKING',
  ERROR = 'ERROR'
}

export interface AnalysisResponse {
  description: string;
  detectedObjects: string[];
}

export interface TTSConfig {
  rate: number;
  pitch: number;
  volume: number;
}