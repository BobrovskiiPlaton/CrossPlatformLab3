import {SpaceX} from "./api/spacex";
import * as d3 from "d3";
import * as Geo from './geo.json'

// Глобальные переменные для хранения данных
let allLaunches = [];
let allLaunchpads = [];
let launchpadsGeoJSON = null;

document.addEventListener("DOMContentLoaded", setup)

function setup(){
    const spaceX = new SpaceX();
    
    // 1. Получаем launchpads
    spaceX.launchpads().then(launchpads => {
        allLaunchpads = launchpads;
        console.log('Получены launchpads:', launchpads);
        renderLaunchpads(launchpads);
        
        launchpadsGeoJSON = convertToGeoJSON(launchpads);
        drawMap(launchpadsGeoJSON);
    });
    
    // 2. Получаем launches
    spaceX.launches().then(launches => {
        allLaunches = launches;
        console.log('Получены launches:', launches.length);
        renderLaunches(launches);
    });
}

// Находит launchpad по ID запуска
function findLaunchpadForLaunch(launch) {
    if (!launch.launchpad) return null;
    
    // Ищем площадку по ID
    const launchpad = allLaunchpads.find(pad => pad.id === launch.launchpad);
    return launchpad;
}

// добавляем обработчики hover
function renderLaunches(launches){
    const container = document.getElementById("listContainer");
    const title = document.createElement("h2");
    title.textContent = "🚀 Запуски:";
    container.appendChild(title);
    
    const list = document.createElement("ul");
    list.style.cursor = "pointer"; // меняем курсор при наведении
    
    launches.forEach(launch => {
        const item = document.createElement("li");
        item.textContent = launch.name;
        item.style.padding = "8px";
        item.style.margin = "2px 0";
        item.style.borderRadius = "4px";
        item.style.transition = "all 0.3s ease"; // плавные переходы
        
        // Наведение мышкой
        item.addEventListener('mouseenter', function() {
            // Подсвечиваем этот элемент
            item.style.backgroundColor = "#e3f2fd";
            item.style.borderLeft = "4px solid #2196f3";
            
            // Находим соответствующую стартовую площадку
            const launchpad = findLaunchpadForLaunch(launch);
            if (launchpad) {
                highlightLaunchpadOnMap(launchpad.id);
            }
        });
        
        // отвод мышки
        item.addEventListener('mouseleave', function() {
            // Убираем подсветку
            item.style.backgroundColor = "";
            item.style.borderLeft = "";
            
            // Убираем подсветку на карте
            resetLaunchpadHighlights();
        });
        
        list.appendChild(item);
    });
    
    container.appendChild(list);
}

// Подсвечивает стартовую площадку на карте
function highlightLaunchpadOnMap(launchpadId) {
    // Убираем все подсветки
    resetLaunchpadHighlights();
    
    // Находим индекс площадки в GeoJSON
    const launchpadIndex = allLaunchpads.findIndex(pad => pad.id === launchpadId);
    if (launchpadIndex === -1) return;
    
    // Подсвечиваем точку на карте
    d3.selectAll(".launchpad-point")
        .filter((d, i) => i === launchpadIndex)
        .attr("r", 12) // увеличиваем размер
        .attr("fill", "#ff5722")
        .attr("stroke", "#d84315")
        .attr("stroke-width", 3)
        .style("opacity", 1);
}

// Убирает подсветку со всех площадок
function resetLaunchpadHighlights() {
    d3.selectAll(".launchpad-point")
        .attr("r", 6) // возвращаем нормальный размер
        .attr("fill", "red")
        .attr("stroke", "darkred")
        .attr("stroke-width", 2)
        .style("opacity", 0.9);
}

function renderLaunchpads(launchpads){
    const container = document.getElementById("listContainer");
    
    const title = document.createElement("h2");
    title.textContent = "Стартовые площадки:";
    
    const list = document.createElement("ul");
    
    launchpads.forEach(pad => {
        const item = document.createElement("li");
        item.textContent = pad.name;
        list.appendChild(item);
    });
    
    container.appendChild(title);
    container.appendChild(list);
}

function convertToGeoJSON(launchpads) {
    const features = launchpads.map((launchpad, index) => {
        const longitude = launchpad.longitude;
        const latitude = launchpad.latitude;
        
        if (!latitude || !longitude) return null;
        
        return {
            "type": "Feature",
            "id": index,
            "properties": {
                "name": launchpad.name,
                "status": launchpad.status,
                "locality": launchpad.locality,
                "region": launchpad.region,
                "launchpadId": launchpad.id // сохраняем оригинальный ID
            },
            "geometry": {
                "type": "Point",
                "coordinates": [longitude, latitude]
            }
        };
    }).filter(feature => feature !== null);
    
    return {
        "type": "FeatureCollection",
        "features": features
    };
}

function drawMap(launchpadsGeoJSON) {
    const width = 800;
    const height = 500;
    const margin = {top: 20, right: 20, bottom: 20, left: 20};
    
    d3.select('#map').html('');
    
    const svg = d3.select('#map').append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const projection = d3.geoMercator()
        .scale(120)
        .center([0, 20])
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // 1. Карта мира
    svg.append("g")
        .selectAll("path")
        .data(Geo.features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("fill", "#f0f0f0")
        .style("stroke", "#ffffff")
        .style("stroke-width", 0.5);

    // 2. Точки launchpads
    if (launchpadsGeoJSON && launchpadsGeoJSON.features) {
        svg.selectAll(".launchpad-point")
            .data(launchpadsGeoJSON.features)
            .enter()
            .append("circle")
            .attr("class", "launchpad-point")
            .attr("cx", d => {
                const coords = projection(d.geometry.coordinates);
                return coords ? coords[0] : 0;
            })
            .attr("cy", d => {
                const coords = projection(d.geometry.coordinates);
                return coords ? coords[1] : 0;
            })
            .attr("r", 6)
            .attr("fill", "red")
            .attr("stroke", "darkred")
            .attr("stroke-width", 2)
            .style("opacity", 0.9)
            .append("title")
            .text(d => `${d.properties.name}\n${d.properties.locality}, ${d.properties.region}`);
    }
    
    svg.append("text")
        .attr("x", 10)
        .attr("y", 20)
        .style("font-size", "12px")
        .style("font-weight", "bold");
}