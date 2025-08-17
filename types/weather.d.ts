export interface WeatherLocation {
  name: string;
  region: string;
  country: string;
}

export interface WeatherCurrent {
  temperature: string;
  feelslike: string;
  humidity: string;
  winddisplay: string;
  skytext: string;
  imageUrl: string;
  observationtime: string;
}

export interface WeatherResult {
  location: WeatherLocation;
  current: WeatherCurrent;
}

export interface WeatherOptions {
  degreeType?: string;
}

declare module 'weather.js' {
  function get(
    location: string,
    options: WeatherOptions,
    callback: (err: Error | null, result?: WeatherResult[]) => void
  ): void;

  const weather: { get: typeof get };
  export default weather;
}
