import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [search, setSearch] = useState('')
  const [countries, setCountries] = useState([])
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    if (search.length > 0) {
      axios
        .get(`https://studies.cs.helsinki.fi/restcountries/api/all`)
        .then(response => {
          const filtered = response.data.filter(country =>
            country.name.common.toLowerCase().includes(search.toLowerCase())
          )
          setCountries(filtered)
          setSelectedCountry(null)
          setWeather(null)
        })
        .catch(error => console.error(error))
    } else {
      setCountries([])
      setSelectedCountry(null)
      setWeather(null)
    }
  }, [search])

  useEffect(() => {
    const countryToShow = selectedCountry || (countries.length === 1 ? countries[0] : null)

    if (countryToShow && countryToShow.capital && countryToShow.capital[0]) {
      const capital = countryToShow.capital[0]
      
      console.log('Fetching weather for:', capital)
      
      // First, get coordinates for the capital using Open-Meteo geocoding
      axios
        .get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(capital)}&count=1&language=en&format=json`)
        .then(response => {
          if (response.data.results && response.data.results.length > 0) {
            const { latitude, longitude } = response.data.results[0]
            console.log(`Got coordinates for ${capital}: ${latitude}, ${longitude}`)
            
            // Now fetch weather data using Open-Meteo
            return axios.get(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`
            )
          } else {
            throw new Error('Capital not found')
          }
        })
        .then(response => {
          if (response.data.current) {
            console.log('Weather data received:', response.data.current)
            setWeather(response.data.current)
          }
        })
        .catch(error => {
          console.error('Weather fetch error:', error.message)
          setWeather(null)
        })
    } else {
      setWeather(null)
    }
  }, [selectedCountry, countries])

  const handleSearch = (e) => {
    setSearch(e.target.value)
  }

  const handleShowCountry = (country) => {
    setSelectedCountry(country)
  }

  const getWeatherDescription = (code) => {
    // WMO Weather interpretation codes
    const codes = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail',
    }
    return codes[code] || 'Unknown'
  }

  const renderCountryDetails = (country) => {
    return (
      <div>
        <h1>{country.name.common}</h1>
        <p><strong>Capital</strong> {country.capital?.[0]}</p>
        <p><strong>Area</strong> {country.area}</p>
        <h3>Languages</h3>
        <ul>
          {country.languages && Object.values(country.languages).map((lang, i) => (
            <li key={i}>{lang}</li>
          ))}
        </ul>
        <img src={country.flags.png} alt={country.name.common} style={{ width: '150px' }} />
        
        {weather && (
          <div>
            <h3>Weather in {country.capital?.[0]}</h3>
            <p>Temperature {weather.temperature_2m} Celsius</p>
            <p>{getWeatherDescription(weather.weather_code)}</p>
            <p>Wind {weather.wind_speed_10m} m/s</p>
          </div>
        )}
      </div>
    )
  }

  const renderContent = () => {
    if (selectedCountry) {
      return (
        <div>
          <button onClick={() => setSelectedCountry(null)}>Back</button>
          {renderCountryDetails(selectedCountry)}
        </div>
      )
    }

    if (countries.length > 10) {
      return <p>Too many matches, specify another filter</p>
    }

    if (countries.length > 1) {
      return (
        <ul>
          {countries.map(country => (
            <li key={country.cca2}>
              {country.name.common}
              <button onClick={() => handleShowCountry(country)}>Show</button>
            </li>
          ))}
        </ul>
      )
    }

    if (countries.length === 1) {
      return renderCountryDetails(countries[0])
    }

    return null
  }

  return (
    <div>
      <div>
        <label>find countries </label>
        <input
          value={search}
          onChange={handleSearch}
          placeholder=""
        />
      </div>
      {renderContent()}
    </div>
  )
}

export default App
