
const API_KEY = "a7c9afce3c7977a4d9b8584a9b4a1600";
let currentUnitType = "imperial";
let currentWeather = [];

const fetchWithZip = (zipcode) => {
    try {
        let responseImperial = fetch(`https://api.openweathermap.org/data/2.5/weather?zip=${zipcode}&units=imperial&APPID=${API_KEY}`, {mode: 'cors'});    
        let responseMetric = fetch(`https://api.openweathermap.org/data/2.5/weather?zip=${zipcode}&units=metric&APPID=${API_KEY}`, {mode: 'cors'});    
        return [responseImperial, responseMetric];
    } catch (err) {
        console.log("fetchWithZip Error: " + err);
    }
}

const fetchWithCityID = (cityID) => {
    try {
        let responseImperial = fetch(`https://api.openweathermap.org/data/2.5/weather?id=${cityID}&units=imperial&APPID=${API_KEY}`, {mode: 'cors'});    
        let responseMetric = fetch(`https://api.openweathermap.org/data/2.5/weather?id=${cityID}&units=metric&APPID=${API_KEY}`, {mode: 'cors'});    
        return [responseImperial, responseMetric];
    } catch (err) {
        console.log("fetchWithCityID Error: " + err);
    }
}

const getCities = async (city) => {
    try {
        let response = await fetch(`https://api.openweathermap.org/data/2.5/find?q=${city}&APPID=${API_KEY}`, {mode: 'cors'});    
        return response;
    } catch (err) {
        console.log("getCities Error: " + err);
    }
}

const processJSON = (responsePromise) => {
    return responsePromise.then(async (response) => {
        try {
            data = await response.json();
            return {name: data.name, description: data.weather[0].description, icon: data.weather[0].icon, temp: data.main.temp, minTemp: data.main.temp_min, maxTemp: data.main.temp_max, wind: data.wind.speed};
        } catch (err) {
            if (err.toString().includes("undefined")) {
                searchResults.innerHTML = "Could not find a matching zip code..."; 
            }
            console.log("processJSON Error: " + err);
        }
    });
}
    const temp = document.getElementById('temp');
    const name = document.getElementById('name');
    const description = document.getElementById('description');
    const minTemp = document.getElementById('minTemp');
    const maxTemp = document.getElementById('maxTemp');
    const wind = document.getElementById('wind');
    const icon = document.getElementById('icon');
    const weatherDiv = document.getElementById('weather');

const populateWeatherHTML = () => {
    let weather = (currentUnitType == 'imperial') ? currentWeather[0] : currentWeather[1];
    temp.innerHTML = (currentUnitType == 'imperial') ? weather.temp + "&#xb0; F"  : weather.temp + "&#xb0; C";
    name.innerHTML = weather.name;
    description.innerHTML = weather.description;
    minTemp.innerHTML = "Low: " + weather.minTemp;
    maxTemp.innerHTML = "High: " + weather.maxTemp;
    icon.src = "http://openweathermap.org/img/w/" + weather.icon + ".png";
    wind.innerHTML = (currentUnitType == 'imperial') ? `Wind: ${weather.wind} mph` : `Wind: ${weather.wind} m/s` ;
    toggleUnitsButton.innerHTML = (currentUnitType == 'imperial') ? "Show Metric Units" : "Show Imperial Units";
}

const setBackgroundColor = (temp) => {
    switch (true) {
        case temp <= 32:
            document.body.style.backgroundColor = "rgba(66, 114, 245, .6)"; 
            break;
        case temp > 32 && temp <= 50:
            document.body.style.backgroundColor = "rgba(66, 114, 245, .2)"; 
            break;
        case temp > 50 && temp <= 80:
            document.body.style.backgroundColor = "rgba(250, 219, 107, .4)"; 
            break;
        case temp > 80:
            document.body.style.backgroundColor = "rgba(201, 42, 6, .4)"; 
            break;
    }

}

const setWeather = async (rawWeatherData=fetchWithZip(83642)) => {
    try {
        let imperialPromise = rawWeatherData[0];
        let metricPromise = rawWeatherData[1];
        let weatherImperial = await processJSON(imperialPromise);
        let weatherMetric = await processJSON(metricPromise);
        currentWeather = [weatherImperial, weatherMetric];
        populateWeatherHTML();
        setBackgroundColor(currentWeather[0].temp);
    } catch (err) {
    }
}

const input = document.querySelector('input');
const searchButton = document.getElementById('search-button');
const searchResults = document.getElementById('search-results');
const toggleUnitsButton = document.getElementById('toggleUnits');


toggleUnitsButton.addEventListener('click', function() {
    currentUnitType = currentUnitType == "imperial" ? "metric" : "imperial";    
    populateWeatherHTML();
});

const setCitySelectListeners = (cities) => {
    cityAnchors = document.querySelectorAll('a');
    cityAnchors.forEach(function(anchor) {
        anchor.addEventListener('click', async function() {
            await setWeather(fetchWithCityID(cities[anchor.id].id)); 
            searchResults.innerHTML = "";
        });
    });
}

searchButton.addEventListener('click', async function() {
    let citySearchInput = input.value;
    if (citySearchInput === "") {
        searchResults.innerHTML = "Please enter a city or zip code.";
    } else if (/(^\d{5}$)|(^\d{5}-\d{4}$)/.test(citySearchInput)) {
        setWeather(fetchWithZip(citySearchInput));
    } else {
        let citiesData = await getCities(citySearchInput); 
        citiesData = await citiesData.json();
        if (citiesData.message === "bad query") {
            searchResults.innerHTML = "Invalid query.";
        } else {
            let cities = [];
            citiesData.list.forEach(function(city) {
                cities.push({id: city.id, name: city.name, country: city.sys.country, lat: city.coord.lat, lon: city.coord.lon});
            });
            let searchResultsString = ""
            cities.forEach(function(city, index) {
                searchResultsString += `<li id=${city.id}><a id=${index} href='#'>${city.name}, ${city.country}</a>: (${city.lat}, ${city.lon})</li>`;
            });
            searchResults.innerHTML = searchResultsString;
            setCitySelectListeners(cities);
            if (cities.length == 0) {
                searchResults.innerHTML = "No Results.";
            }
        }
    }
});

setWeather();

