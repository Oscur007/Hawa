import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import compression from "compression";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app=express();
const port = process.env.PORT || 8080;
const mainURL = process.env.URL;
const key = process.env.API_KEY;

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(compression());
app.use(express.static(path.resolve(__dirname , process.env.FRONTEND)));

const generateForecast = (forecastData, days) => {
    let data = new Array(days);
    for(let i=0 ; i<days ; i++)
    {
        data[i]={
            max_c : forecastData.forecastday[i].day.maxtemp_c,
            min_c : forecastData.forecastday[i].day.mintemp_c,
            max_f : forecastData.forecastday[i].day.maxtemp_f,
            min_f : forecastData.forecastday[i].day.mintemp_f,
            icon : forecastData.forecastday[i].day.condition.icon
        }
    }
    return data;
};

const generateRecentForecast = (forecastData, hour , hours) => {
    let data = new Array(hours);
    for(let i=0 ; i<hours ; i++)
    {
        data[i]={
            temp_c : forecastData.forecastday[Math.floor((hour+i+1)/24)].hour[(hour+i+1)%24].temp_c,
            temp_f : forecastData.forecastday[Math.floor((hour+i+1)/24)].hour[(hour+i+1)%24].temp_f,
            icon : forecastData.forecastday[Math.floor((hour+i+1)/24)].hour[(hour+i+1)%24].condition.icon,
            time : String(new Date(forecastData.forecastday[Math.floor((hour+i+1)/24)].hour[(hour+i+1)%24].time).getHours()).padStart(2 , '0')+" : 00"
        }
    }
    return data;
};

app.post("/api" , async (req , res) => {
    try
    {
        const position=req.body.city;
        const url=mainURL+"key="+key+"&q="+position+"&days=3&aqi=no";
        const response = await fetch(url);
        const data = await response.json();
        if(!response.ok)
        {
            res.status(400).json({error : data.error.message});
            return ;
        }
        const hour = new Date(data.location.localtime).getHours();
        const resData = {
            name : data.location.name,
            country : data.location.country,
            time : data.location.localtime,
            temp_c : data.current.temp_c,
            temp_f : data.current.temp_f,
            feelslike_c : data.current.feelslike_c,
            feelslike_f : data.current.feelslike_f,
            condition_text : data.current.condition.text,
            condition_icon : data.current.condition.icon,
            wind_kph : data.current.wind_kph,
            wind_mph : data.current.wind_mph,
            pressure_mb : data.current.pressure_mb,
            pressure_in : data.current.pressure_in,
            humidity : data.current.humidity,
            cloud : data.current.cloud,
            forecast : generateForecast(data.forecast , 3),
            recentForecast : generateRecentForecast(data.forecast , hour , 6)
        }
        res.status(200).send(resData);
    }
    catch(error)
    {
        console.log("error is " , error);
        res.json({error : "Internal Server Error"}).status(500);
    }
})

app.use("*" , (req , res) => {
    res.sendFile(path.resolve(__dirname , process.env.FRONTEND , "index.html"));
})

app.listen(port);