import fetch from 'node-fetch';

const limits25 = [15, 30, 55, 110];
const limits10 = [25, 50, 90, 180];

const getAirQuality = ({pm25, pm10}): number => {
  if (pm25 === 0 && pm10 === 0) {
    return 0; // AirQuality.UNKNOWN;
  }
  if (pm25 <= limits25[0] && pm10 <= limits10[0]) {
    return 1; // AirQuality.EXCELLENT;
  }
  if (pm25 <= limits25[1] && pm10 <= limits10[1]) {
    return 2; // AirQuality.GOOD;
  }
  if (pm25 <= limits25[2] && pm10 <= limits10[2]) {
    return 3; // AirQuality.FAIR;
  }
  if (pm25 <= limits25[3] && pm10 <= limits10[3]) {
    return 4; // AirQuality.INFERIOR;
  }
  return 5; // AirQuality.POOR;
};

export const fetchAirQuality = async (): Promise<{
  aiq: number; pm25: number; pm10: number;
}> => {
  const response: {
    pm25: number;
    pm10: number;
  } = await fetch('http://localhost:3000').then(r => r.json()) as any;

  const {pm25, pm10} = response;
  const aiq = getAirQuality(response);

  return {
    aiq, pm25, pm10,
  };
};
