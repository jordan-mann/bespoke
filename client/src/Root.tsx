import React, { useState, useContext, useEffect, createContext } from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import App from './components/App';
import Home from './components/Home';
import BulletinBoard from './components/BulletinBoard/BulletinBoard';
import Weather from './components/Weather/Weather';
import Profile from './components/Profile/Profile';
import CreateReport from './components/Reports/CreateReport';
import RouteM from './components/BikeRoutes/RouteM';
import Stopwatch from './components/Stopwatch';
import Reports from './components/Reports/Reports';

export interface CurrentWeather {
  temperature: number;
  windspeed: number;
  winddirection: number;
  weatherdescription: string;
  is_day: number | undefined;
  time: Date;
}

export interface MeasurementUnits {
  temperature: string;
  speed: string;
  precipitation: string;
  visibility: string;
  depth: string;
}

export interface Hourly {
  time?: Date;
  temperature?: number;
  humidity?: number;
  apparentTemperature?: number;
  cloudcover?: number;
  windspeed?: number;
  precipitation?: number;
  snowfall?: number;
  precipitationProbability?: number;
  rain?: number;
  showers?: number;
  weatherDescription?: string;
  snowDepth?: number;
  visibility?: number;
  isDay?: Boolean;
}

export interface RootProps {
  windSpeedMeasurementUnit: string;
  temperatureMeasurementUnit: string;
  precipitationMeasurementUnit: string;
  hourlyForecasts: Hourly[];
  setHourlyForecasts?: (unit: Hourly[]) => void;
  setWindSpeedMeasurementUnit?: (unit: string) => void;
  setTemperatureMeasurementUnit?: (unit: string) => void;
  setPrecipitationMeasurementUnit?: (unit: string) => void;
  getForecasts?: () => void;
}
export interface StopwatchTime {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface User {
  email?: string;
  id?: number;
  name?: string;
  thumbnail?: any;
  weight?: any;
}

export const UserContext = createContext<User | undefined>(undefined);

const Root = () => {
  // Created User Info and Geolocation for context //
  const [user, setUser] = useState<User>({});
  // const [geoLocation, setGeoLocation] = useState<any>();
  const [geoLocation, setGeoLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

  const [windSpeedMeasurementUnit, setWindSpeedMeasurementUnit] =
    useState<string>('mph'); //should be either 'mph' or 'kmh',
  const [temperatureMeasurementUnit, setTemperatureMeasurementUnit] =
    useState<string>('fahrenheit'); //should be either 'fahrenheit' or 'celsius'
  const [precipitationMeasurementUnit, setPrecipitationMeasurementUnit] =
    useState<string>('inch'); //should be either 'mm' or 'inch'
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather>({
    temperature: 0,
    windspeed: 0,
    winddirection: 0,
    weatherdescription: '',
    is_day: undefined,
    time: new Date(),
  }); //note: currentWeather is only going to be used on the home screen - everything else will just use the hourly breakdown

  const [hourlyForecasts, setHourlyForecasts] = useState<Hourly[]>([]);

  const latitude = 30.0; //will need to be able to update lat/long according to inputted location
  const longitude = -90.17;
  const numDaysToForecast = 1; //this is for if we implement a weekly weather report
  const getForecasts = () => {
    //axios request has been tested and is working; states are properly being set with objects containing the required values
    axios
      .get('/weather/forecast', {
        params: {
          precipitationUnit: precipitationMeasurementUnit,
          windSpeedUnit: windSpeedMeasurementUnit,
          temperatureUnit: temperatureMeasurementUnit,
          latitude: latitude,
          longitude: longitude,
          numDaysToForecast: numDaysToForecast,
        },
      })
      .then(({ data }) => {
        setCurrentWeather(data.currentWeather);
        setHourlyForecasts(data.hourly);
      })
      .catch((err) =>
        console.error(
          'an error occured with clientside GET request for forecasts: ',
          err
        )
      );
  };

  const findContext = () => {
    axios
      .get('auth/user')
      .then((result) => {
        setUser(result.data);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const getLocation = () => {
    let interval: any | undefined;
    if (navigator.geolocation) {
      console.log('Getting location');
      interval = setInterval(() => {
        if (!navigator.geolocation) {
          setError('Geolocation is not supported by this browser.');
          clearInterval(interval!);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setGeoLocation({ lat: latitude, lng: longitude });
            clearInterval(interval!);
            interval = null;
          },
          (error) => setError(error.message)
        );
      }, 1000);
    } else {
      setError('Geolocation is not supported by this browser.');
    }
    return () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
  };

  useEffect(() => {
    getForecasts();
    findContext();
    getLocation();
  }, []);

  return (
    <div>
      <div>
        {error && <p>{error}</p>}
        <div>
          <h1>
            Current Location:{' '}
            {geoLocation ? `${geoLocation.lat}, ${geoLocation.lng}` : 'N/A'}
          </h1>
        </div>
      </div>
      <UserContext.Provider value={user}>
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<App />}>
              <Route path='/home' element={<Home />} />
              <Route path='bulletinBoard' element={<BulletinBoard />} />
              <Route path='bikeRoutes' element={<RouteM />} />
              <Route
                path='weather'
                element={
                  <Weather
                    windSpeedMeasurementUnit={windSpeedMeasurementUnit}
                    temperatureMeasurementUnit={temperatureMeasurementUnit}
                    precipitationMeasurementUnit={precipitationMeasurementUnit}
                    hourlyForecasts={hourlyForecasts}
                    setWindSpeedMeasurementUnit={setWindSpeedMeasurementUnit}
                    setTemperatureMeasurementUnit={
                      setTemperatureMeasurementUnit
                    }
                    setPrecipitationMeasurementUnit={
                      setPrecipitationMeasurementUnit
                    }
                    getForecasts={getForecasts}
                  />
                }
              />
              <Route path='profile' element={<Profile />} />
              <Route path='createReport' element={<CreateReport />} />
              <Route path='stopwatch' element={<Stopwatch />} />
            </Route>
          </Routes>
          <Stopwatch />
        </BrowserRouter>
      </UserContext.Provider>
    </div>
  );
};

export default Root;
