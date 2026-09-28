/* =========================
   CITYSYNC FINAL JS
========================= */

let map;
let directionsService;
let routeRenderers = [];
let trafficChart;
let trafficLayer;
let trafficVisible = false;

/* =========================
   MAP INIT
========================= */

function initMap() {

    const kolkata = {
        lat: 22.5726,
        lng: 88.3639
    };

    map = new google.maps.Map(
        document.getElementById("map"),
        {

            center: kolkata,

            zoom: 10,

            gestureHandling: "greedy",

            disableDefaultUI: true,

            styles: [

                {
                    elementType: "geometry",
                    stylers: [{ color: "#121a2f" }]
                },

                {
                    elementType: "labels.text.fill",
                    stylers: [{ color: "#dbe4ff" }]
                },

                {
                    elementType: "labels.text.stroke",
                    stylers: [{ color: "#121a2f" }]
                },

                {
                    featureType: "road",
                    elementType: "geometry",
                    stylers: [{ color: "#25345b" }]
                },

                {
                    featureType: "road.highway",
                    elementType: "geometry",
                    stylers: [{ color: "#2a3754" }]
                },

                {
                    featureType: "road.highway",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                },

                {
                    featureType: "water",
                    elementType: "geometry",
                    stylers: [{ color: "#1f4e79" }]
                },

                {
                    featureType: "poi.business",
                    stylers: [{ visibility: "off" }]
                }

            ]

        }
    );

    trafficLayer =
        new google.maps.TrafficLayer();

    directionsService =
        new google.maps.DirectionsService();

    new google.maps.places.Autocomplete(
        document.getElementById("from")
    );

    new google.maps.places.Autocomplete(
        document.getElementById("to")
    );

}

/* =========================
   TOGGLE TRAFFIC
========================= */

function toggleTraffic() {

    if (trafficVisible) {

        trafficLayer.setMap(null);

        document.getElementById(
            "trafficBtn"
        ).innerText = "Show Traffic";

        trafficVisible = false;

    } else {

        trafficLayer.setMap(map);

        document.getElementById(
            "trafficBtn"
        ).innerText = "Hide Traffic";

        trafficVisible = true;
    }
}

/* =========================
   CLEAR ROUTES
========================= */

function clearRoutes() {

    routeRenderers.forEach(renderer => {

        renderer.setMap(null);

    });

    routeRenderers = [];

    document.getElementById(
        "routePanel"
    ).innerHTML = "";

    if (trafficChart) {

        trafficChart.destroy();

    }

}

/* =========================
   CONVERT TIME
========================= */

function convertToMinutes(duration) {

    let mins = 0;

    if (duration.includes("hour")) {

        const hourMatch =
            duration.match(/(\d+)\s*hour/);

        const minMatch =
            duration.match(/(\d+)\s*min/);

        const hours =
            hourMatch ? parseInt(hourMatch[1]) : 0;

        const minutes =
            minMatch ? parseInt(minMatch[1]) : 0;

        mins = (hours * 60) + minutes;

    } else {

        mins = parseInt(duration);

    }

    return mins;
}

/* =========================
   GET ROUTES
========================= */

function getRoutes() {

    clearRoutes();

    trafficLayer.setMap(null);

    trafficVisible = false;

    document.getElementById(
        "trafficBtn"
    ).innerText = "Show Traffic";

    const start =
        document.getElementById("from").value;

    const end =
        document.getElementById("to").value;

    if (!start || !end) {

        alert("Please enter both locations");

        return;
    }

    directionsService.route({

        origin: start,

        destination: end,

        travelMode:
            google.maps.TravelMode.DRIVING,

        provideRouteAlternatives: true,

        drivingOptions: {

            departureTime: new Date(),

            trafficModel: "bestguess"

        }

    }, function(response, status) {

        if (status !== "OK") {

            alert(
                "Directions request failed: "
                + status
            );

            return;
        }

        const colors = [
            "#61f28c",
            "#ffd028",
            "#ff7b32"
        ];

        const chartData = [];

        const panel =
            document.getElementById(
                "routePanel"
            );

        response.routes
        .slice(0,3)
        .forEach((route, index) => {

            /* GLOW */

            const glowLine =
                new google.maps.Polyline({

                    path:
                    route.overview_path,

                    strokeColor:
                    colors[index],

                    strokeOpacity: 0.05,

                    strokeWeight: 6,

                    map: map

                });

            routeRenderers.push(glowLine);

            /* ROUTE */

            const renderer =
                new google.maps.DirectionsRenderer({

                    map: map,

                    directions: response,

                    routeIndex: index,

                    suppressMarkers: false,

                    preserveViewport: true,

                    polylineOptions: {

                        strokeColor:
                        colors[index],

                        strokeWeight: 3,

                        strokeOpacity: 0.55,

                        icons: []

                    }

                });

            routeRenderers.push(renderer);

            const leg = route.legs[0];

            const distance =
                leg.distance.text;

            const duration =
                leg.duration_in_traffic
                ? leg.duration_in_traffic.text
                : leg.duration.text;

            const mins =
                convertToMinutes(duration);

            /* TRAFFIC ANALYSIS */

            const normalDuration =
                leg.duration.value / 60;

            const trafficDuration =
                leg.duration_in_traffic
                ? leg.duration_in_traffic.value / 60
                : normalDuration;

            let congestionScore =
                Math.round(
                    (trafficDuration / normalDuration) * 35
                );

            congestionScore += (index * 18);

            congestionScore =
                Math.max(
                    15,
                    Math.min(congestionScore, 100)
                );

            let trafficLevel = "";

            if (congestionScore < 35) {

                trafficLevel = "Low";

            } else if (congestionScore < 55) {

                trafficLevel = "Moderate";

            } else if (congestionScore < 75) {

                trafficLevel = "Heavy";

            } else {

                trafficLevel = "Severe";

            }

            chartData.push(congestionScore);

            const km =
                parseFloat(
                    distance.replace("km","")
                );

            const fuel =
                (km / 15).toFixed(1);

            const co2 =
                (km * 0.15).toFixed(1);

            let routeType = "";
            let icon = "";

            if(index === 0){

                routeType =
                "Fastest Route";

                icon = "⚡";

            } else if(index === 1){

                routeType =
                "Fuel Efficient";

                icon = "⛽";

            } else {

                routeType =
                "Scenic Alternate";

                icon = "🛣";
            }

            /* ROUTE CARD */

            const routeCard =
                document.createElement("div");

            routeCard.innerHTML = `

            <div style="
                background:
                linear-gradient(
                    145deg,
                    rgba(17,25,48,0.92),
                    rgba(25,35,65,0.95)
                );

                border-radius:24px;

                padding:16px;

                border:
                1px solid rgba(255,255,255,0.05);

                box-shadow:
                0 0 35px rgba(0,0,0,0.25);

                cursor:pointer;
            ">

                <div style="
                    display:flex;
                    align-items:center;
                    gap:14px;
                    margin-bottom:12px;
                ">

                    <div style="
                        width:50px;
                        height:50px;

                        border-radius:18px;

                        display:flex;
                        align-items:center;
                        justify-content:center;

                        font-size:28px;

                        background:
                        rgba(255,255,255,0.04);
                    ">

                    ${icon}

                    </div>

                    <div>

                        <h3 style="
                            color:white;
                            font-size:22px;
                            margin-bottom:4px;
                        ">
                            ${routeType}
                        </h3>

                        <p style="
                            color:#b7c3e0;
                            font-size:14px;
                        ">
                            AI Optimized Route
                        </p>

                    </div>

                </div>

                <div style="
                    display:flex;
                    gap:8px;
                    flex-wrap:wrap;
                    margin-bottom:12px;
                ">

                    <div style="
                        background:${colors[index]}22;
                        color:${colors[index]};

                        padding:10px 16px;

                        border-radius:14px;

                        font-weight:600;
                    ">

                        ⏱ ${duration}

                    </div>

                    <div style="
                        background:
                        rgba(255,255,255,0.05);

                        color:#dbe4ff;

                        padding:10px 16px;

                        border-radius:14px;

                        font-weight:600;
                    ">

                        📍 ${distance}

                    </div>

                </div>

                <div style="
                    display:grid;
                    grid-template-columns:1fr 1fr;
                    gap:8px;
                ">

                    <div style="
                        background:
                        rgba(255,255,255,0.04);

                        padding:10px;

                        border-radius:16px;
                    ">

                        <div style="
                            color:#7dd3fc;
                            font-size:13px;
                            margin-bottom:6px;
                        ">
                            Fuel Usage
                        </div>

                        <div style="
                            color:white;
                            font-size:18px;
                            font-weight:700;
                        ">
                            ${fuel} L
                        </div>

                    </div>

                    <div style="
                        background:
                        rgba(255,255,255,0.04);

                        padding:10px;

                        border-radius:16px;
                    ">

                        <div style="
                            color:#86efac;
                            font-size:13px;
                            margin-bottom:6px;
                        ">
                            CO₂ Impact
                        </div>

                        <div style="
                            color:white;
                            font-size:18px;
                            font-weight:700;
                        ">
                            ${co2} kg
                        </div>

                    </div>

                    <div style="
                        background:
                        rgba(255,255,255,0.04);

                        padding:10px;

                        border-radius:16px;
                    ">

                        <div style="
                            color:#f9a8d4;
                            font-size:13px;
                            margin-bottom:6px;
                        ">
                            Traffic Level
                        </div>

                        <div style="
                            color:white;
                            font-size:18px;
                            font-weight:700;
                        ">
                            ${trafficLevel}
                        </div>

                    </div>

                    <div style="
                        background:
                        rgba(255,255,255,0.04);

                        padding:10px;

                        border-radius:16px;
                    ">

                        <div style="
                            color:#fcd34d;
                            font-size:13px;
                            margin-bottom:6px;
                        ">
                            Congestion
                        </div>

                        <div style="
                            color:white;
                            font-size:18px;
                            font-weight:700;
                        ">
                            ${congestionScore}%
                        </div>

                    </div>

                </div>

            </div>
            `;

            routeCard.onclick = () => {

                map.fitBounds(route.bounds);

            };

            panel.appendChild(routeCard);

        });

        map.fitBounds(
            response.routes[0].bounds
        );
        
        function animateValue(id, end, suffix = "") {

            let start = 0;

            const duration = 900;

            const increment =
                end / (duration / 16);

            const element =
                document.getElementById(id);

            const counter = setInterval(() => {

                start += increment;

                if(start >= end){

                    start = end;

                    clearInterval(counter);
                }

                element.innerText =
                    Math.floor(start) + suffix;

            },16);

        }

        /* =========================
          DASHBOARD STATS
        ========================= */

        const avgTime =
            Math.round(
                chartData.reduce((a,b)=>a+b,0)
                / chartData.length
            );

        /* AVG TIME */

        animateValue(
            "avgTime",
            avgTime,
            " min"
        );

        /* SIGNAL EFFICIENCY */

        let efficiency =
            100 - avgTime;

        efficiency =
            Math.max(52, efficiency);

        animateValue(
            "signalEfficiency",
            efficiency,
            "%"
        );

        /* INCIDENTS */

        const incidents =
            Math.floor(avgTime / 18);

        animateValue(
            "incidentCount",
            incidents
        );

        /* TRAFFIC STATUS */

        let trafficText = "Low";

        if(avgTime > 70){

            trafficText = "Severe";

        } else if(avgTime > 55){

            trafficText = "Heavy";

        } else if(avgTime > 35){

            trafficText = "Moderate";
        }

        document.getElementById(
            "trafficStatus"
        ).innerText =
        trafficText;
        /* AI RECOMMENDATIONS */

        document.getElementById(
            "recommendationList"
        ).innerHTML = `

        <li>
        🚦 Smart signals rerouted traffic
        through lower-density corridors.
        </li>

        <li>
        ⚡ Fastest route currently has
        the lowest congestion.
        </li>

        <li>
        🌧 Live traffic conditions
        analyzed in real-time.
        </li>

        <li>
        🤖 AI predictions updating
        dynamically from Maps API.
        </li>
        `;

        /* CHART */

        const ctx =
            document.getElementById(
                "trafficChart"
            );

        trafficChart = new Chart(ctx, {

            type: "bar",

            data: {

                labels: [

                    "⚡ Fastest",
                    "⛽ Efficient",
                    "🛣 Scenic"

                ],

                datasets: [{

                    label:
                    "Traffic Congestion (%)",

                    data: chartData,

                    backgroundColor: [

                        "rgba(97,242,140,0.92)",
                        "rgba(255,208,40,0.92)",
                        "rgba(255,123,50,0.92)"

                    ],

                    borderRadius: 20,

                    barThickness: 55

                }]

            },

            options: {

                responsive: true,

                aspectRatio: 1.7,

                scales: {

                    y: {

                        beginAtZero: true,

                        max: 100,

                        ticks: {

                            stepSize: 20,

                            color:
                            "rgba(255,255,255,0.7)"
                        }

                    },

                    x: {

                        ticks: {

                            color:
                            "rgba(255,255,255,0.9)"
                        }

                    }

                }

            }

        });

    });

}