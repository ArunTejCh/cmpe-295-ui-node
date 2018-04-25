let baseUrl = 'http://ec2-54-190-197-42.us-west-2.compute.amazonaws.com/';
let historical = "", constituents = [];
new Promise(function (resolve, reject) {
    $.getJSON(baseUrl + '/indexes', function (data) {
        console.log(`got data ${data}`);
        resolve(data);
    });
}).then(function (data) {
    console.log(`got data in resolve as ${data}`);
    let prom = new Promise(function (resolve, reject) {
        $.getJSON(baseUrl + '/indexes/' + data[0] + '/historical', function (hist) {
            console.log(`got historical data as ${hist}`);
            resolve([data, hist]);
        });
    })

    return prom;
}).then(function (values) {
    console.log(`got resolve historical data as ${values[1]}`);
    let prom = new Promise(function (resolve, reject) {
        $.getJSON(baseUrl + '/indexes/' + values[0][0] + '/stocks', function (stocks) {
            console.log(`got stocks data as ${stocks}`);
            values.push(stocks);
            resolve(values);
        });
    })
    return prom;
}).then(function (values) {
    let prom = new Promise(function (resolve, reject) {
        $.getJSON(baseUrl + '/indexes/' + values[0][0] + '/targets', function (targets) {
            console.log(`got targets data as ${targets}`);
            values.push(targets);
            resolve(values);
        });
    })

    return prom;
}).then(function (values) {
    let prom = new Promise(function (resolve, reject) {
        $.getJSON(baseUrl + '/indexes/' + values[0][0] + '/prediction', function (predictions) {
            console.log(`got predictions data as ${predictions}`);
            values.push(predictions);
            resolve(values);
        });
    })

    return prom;
}).then(function (values) {
    let promises = [];
    promises.push(Promise.resolve(values));
    for (let s of values[2]) {
        promises.push(new Promise(function (resolve, reject) {
            $.getJSON(baseUrl + '/stocks/' + s + '/historical', function (data) {
                console.log(`got stocks historical data as ${data}`);
                resolve([s, data]);
            });
        }));
    }
    return Promise.all(promises);
}).then(function (values) {
    console.log(`got values as ${values}`);
    let data = values[0][1];
    let targetData = values[0][3];
    let predictions = [], predictionsData = values[0][4], predictionsDataArray = [];
    let predictedCloseValues = [], predictedActions = [], pSize = predictionsData.length;
    let dataArray = [];
    let targets = [];
    let groupingUnits = [['week', // unit name
        [1] // allowed multiples
    ], ['month', [1, 2, 3, 4, 6]]];
    for (let i = 0; i < data.length; i++) {
        dataArray.push([data[i].date, data[i].open, data[i].high, data[i].low, data[i].close]);
        let j = i - data.length + pSize;
        if(j >= 0){
            predictionsDataArray.push([data[i].date, data[i].open, data[i].high, data[i].low, data[i].close]);
            predictedCloseValues.push([predictionsData[j].date, predictionsData[j].close]);
            predictedActions.push([predictionsData[j].date, predictionsData[j].predictions]);
        }
    }

    for (let i = 0; i < targetData.length; i++) {
        targets.push([targetData[i].date, (targetData[i].target)]);
    }
    Highcharts.stockChart('container', {
        rangeSelector: {
            selected: 2,
            verticalAlign: 'bottom'
        },
        plotOptions: {
            /*column: {
                zones: [{
                    value: 2, // Values up to 10 (not including) ...
                    color: 'red' // ... have the color blue.
                }, {
                    value: 3,
                    color: 'black' // Values from 10 (including) and up have the color red
                }, {
                    color: 'green' // Values from 10 (including) and up have the color red
                }]
            },*/
            series: {
                showInLegend: true
            }
        },
        title: {
            text: 'BankNifty Stock Index'
        },
        subtitle: {
            text: 'historical data'
        },
        legend: {
            layout: 'vertical',
            verticalAlign: 'middle',
            align: 'right',
            enabled: true
        }, yAxis: [{
            title: {
                text: 'Stock Data'
            },
            lineWidth: 2
        }, {
            title: {
                text: 'Predictions'
            },
            opposite: true,
        }],
        series: [{
            type: 'candlestick',
            id: 'bnknifty',
            name: 'BankNifty',
            yAxis: 0,
            data: dataArray,
            dataGrouping: {
                units: groupingUnits
            }
        }, {
            type: 'line',
            name: 'Targets',
            data: targets,
            yAxis: 1,
            dataGrouping: {
                units: groupingUnits
            }
        }, {
            type: 'line',
            name: 'Actions',
            data: predictedActions,
            yAxis: 1,
            dataGrouping: {
                units: groupingUnits
            }
        }, {
            type: 'bb',
            name: 'Bollinger Bands',
            linkedTo: 'bnknifty'
        }, {
            type: 'ema',
            name: 'EMA 30',
            linkedTo: 'bnknifty',
            lineWidth: 1,
            dashStyle: 'longdash',
            params: {
                period: 30
            }
        }, {
            type: 'ema',
            name: 'EMA 100',
            linkedTo: 'bnknifty',
            lineWidth: 1,
            dashStyle: 'longdash',
            params: {
                period: 100
            }
        }]
    });
    let stockSeries = [];
    for (let i = 1; i < values.length; i++) {
        let name = values[i][0];
        let data = [];

        for (let j = 0; j < values[i][1].length; j++) {
            data.push([values[i][1][j].date, values[i][1][j].close]);
        }

        stockSeries.push({
            name: name,
            data: data,
            tooltip: {
                valueDecimals: 2
            }
        })
    }

    Highcharts.stockChart('stocks', {
        rangeSelector: {
            selected: 2
        },
        title: {
            text: 'BankNifty Constituent Stocks'
        },
        subtitle: {
            text: 'historical data'
        },
        legend: {
            layout: 'vertical',
            verticalAlign: 'middle',
            align: 'right',
            enabled: true
        },
        series: stockSeries/* ,
	        drilldown:[
	        	series:[{
	        		id: 'Constituent stocks',
	        		data:[
	        			values[1][0]: 
	        		]
	        	}]
	        ] */
    });

    Highcharts.StockChart({
        chart: {
            renderTo: 'prediction-container',
            alignTicks: false
        },

        rangeSelector: {
            selected: 1
        },

        title: {
            text: 'AAPL Historical'
        },

        yAxis: [{
            title: {
                text: 'OHLC'
            },
            lineWidth: 2
        }, {
            title: {
                text: 'Predictions'
            },
            opposite: true,
        }],

        navigator: {
            enabled: false
        },

        series: [{
            type: 'candlestick',
            name: 'AAPL',
            data: predictionsDataArray,
            yAxis: 1,
            dataGrouping: {
                units: groupingUnits
            }
        }, {
            type: 'line',
            name: 'Actions',
            data: predictedActions,
            yAxis: 0,
            dataGrouping: {
                units: groupingUnits
            }
        }]
    });
});
