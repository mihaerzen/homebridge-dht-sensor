import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  HAP,
  Logging,
  Service,
} from 'homebridge';
import {readSensor} from './readSensor';
import {fetchAirQuality} from './fetchAirQuality';

let hap: HAP;

/*
 * Initializer function called when the plugin is loaded.
 */
export default (api: API) => {
  hap = api.hap;
  api.registerAccessory('DhtSensorPlugin', DhtSensorPlugin);
};

class DhtSensorPlugin implements AccessoryPlugin {
  private readonly log: Logging;
  private readonly name: string;
  private readonly temperatureService: Service;
  private readonly humidityService: Service;
  private readonly airQualitySensor: Service;
  private readonly sensorType: number;
  private readonly sensorPin: number;

  constructor(log: Logging, config: AccessoryConfig) {
    this.log = log;
    this.name = config.name;
    this.sensorType = parseInt(config.sensorType as string, 10) || 22;
    this.sensorPin = parseInt(config.sensorPin as string, 10) || 4;

    const {TemperatureSensor, HumiditySensor, AirQualitySensor} = hap.Service;
    this.temperatureService = new TemperatureSensor(this.name);
    this.humidityService = new HumiditySensor(this.name);
    this.airQualitySensor = new AirQualitySensor(this.name);

    // create handlers for required characteristics
    const {CurrentTemperature, CurrentRelativeHumidity, AirQuality} = hap.Characteristic;
    this.temperatureService.getCharacteristic(CurrentTemperature)
      .on('get', this.handleCurrentTemperatureGet.bind(this));

    this.humidityService.getCharacteristic(CurrentRelativeHumidity)
      .on('get', this.handleCurrentRelativeHumidityGet.bind(this));

    this.airQualitySensor.getCharacteristic(AirQuality).on('get', this.handleCurrentAirQualityGet.bind(this));

    setInterval(async () => {
      this.handleCurrentTemperatureGet(() => {
        //
      });
      this.handleCurrentRelativeHumidityGet(() => {
        //
      });
      this.handleCurrentAirQualityGet(() => {
        //
      });
    }, 60 * 1000);
  }

  async readSensor() {
    return readSensor(this.sensorType, this.sensorPin);
  }

  /**
   * Handle requests to get the current value of the "Current Temperature" characteristic
   */
  async handleCurrentTemperatureGet(callback) {
    const {temperature} = await this.readSensor();
    const {CurrentTemperature} = hap.Characteristic;
    this.temperatureService.setCharacteristic(CurrentTemperature, temperature);

    callback(null, temperature);
  }

  async handleCurrentRelativeHumidityGet(callback) {
    const {humidity} = await this.readSensor();
    const {CurrentRelativeHumidity} = hap.Characteristic;
    this.humidityService.setCharacteristic(CurrentRelativeHumidity, humidity);

    callback(null, humidity);
  }

  async handleCurrentAirQualityGet(callback) {
    const {pm25, pm10, aiq} = await fetchAirQuality();

    const {PM2_5Density, PM10Density, AirQuality} = hap.Characteristic;
    this.airQualitySensor.setCharacteristic(PM2_5Density, pm25);
    this.airQualitySensor.setCharacteristic(PM10Density, pm10);
    this.airQualitySensor.setCharacteristic(AirQuality, aiq);

    console.log('response', {pm25, pm10, aiq});

    callback(null, {pm25, pm10, aiq});
  }

  /*
   * This method is called directly after creation of this instance.
   * It should return all services which should be added to the accessory.
   */
  getServices(): Service[] {
    return [
      this.temperatureService,
      this.humidityService,
      this.airQualitySensor,
    ];
  }
}
