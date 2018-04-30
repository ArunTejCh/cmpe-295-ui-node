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
    let actualTargets = [], predictedActions = [], pSize = predictionsData.length, profitData = [];
    let dataArray = [];
    let targets = [];
    let predictionsPlus = [], predictionsMinus=[];
    let groupingUnits = [['week', // unit name
        [1] // allowed multiples
    ], ['month', [1, 2, 3, 4, 6]]];
    for (let i = 0; i < data.length; i++) {
        dataArray.push([data[i].date, data[i].open, data[i].high, data[i].low, data[i].close]);
        let j = i - data.length + pSize;
        if(j >= 0){
            predictionsDataArray.push([predictionsData[j].date, predictionsData[j].open, predictionsData[j].high, predictionsData[j].low, predictionsData[j].close]);
            predictedActions.push([predictionsData[j].date, predictionsData[j].predictions]);
            predictionsPlus.push([predictionsData[j].date, predictionsData[j].ema10plus5]);
            predictionsMinus.push([predictionsData[j].date, predictionsData[j].ema10minus5]);
            profitData.push([predictionsData[j].date, predictionsData[j].net_profit])
        }
    }

    $('#current-position').html((predictionsData[predictionsData.length - 1].current_position).toUpperCase());
    $('#net-profit').html((predictionsData[predictionsData.length - 1].net_profit).toFixed(2));
    if(predictionsData[predictionsData.length - 1].net_profit >= 0){
        $('#net-profit').addClass('green-font');
    }else{
        $('#net-profit').addClass('red-font');
    }
    $('#buy-hold').html((predictionsData[predictionsData.length - 1].close - predictionsData[0].close).toFixed(2));
    if((predictionsData[predictionsData.length - 1].close - predictionsData[0].close) >= 0){
        $('#buy-hold').addClass('green-font');
    }else{
        $('#buy-hold').addClass('red-font');
    }
    for (let i = 0; i < targetData.length; i++) {
        targets.push([targetData[i].date, (targetData[i].target)]);
        if(targetData.length - i < 60){
            actualTargets.push([targetData[i].date, targetData[i].target]);
        }
    }
    Highcharts.stockChart('container', {
        rangeSelector: {
            selected: 1,
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
        },{
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

    Highcharts.stockChart('stocks-container', {
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
        },legend: {
            layout: 'vertical',
            verticalAlign: 'middle',
            align: 'right',
            enabled: true
        },
        rangeSelector: {
            selected: 1
        },

        title: {
            text: 'Long/Short points'
        },

        yAxis: [{
            title: {
                text: 'BankNifty'
            },
            lineWidth: 2
        }, {
            title: {
                text: 'Net Profit'
            },
            opposite: true,
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
            name: 'profits',
            id: 'profits',
            data: predictionsDataArray,
            yAxis: 0,
            dataGrouping: {
                units: groupingUnits
            }
        },{
            type: 'flags',
            name: 'Flags on series',
            data: [{
                x: 1513209600000,
                title: 'On series'
            }],
            onSeries: 'profits',
            shape: 'squarepin'
        }, {
            type: 'line',
            name: 'ema10plus5',
            data: predictionsPlus,
            yAxis: 0,
            color: '#7CB5EC',
            dataGrouping: {
                units: groupingUnits
            }
        }, {
            type: 'line',
            name: 'ema10minus5',
            data: predictionsMinus,
            yAxis: 0,
            color: '#7CB5EC',
            dataGrouping: {
                units: groupingUnits
            }
        }, {
            type: 'ema',
            name: 'EMA 10',
            linkedTo: 'profits',
            lineWidth: 0.5,
            color: '#7CB5EC',
            marker: {
                enabled: false
            },
            params: {
                period: 10
            }
        }, {
            type: 'line',
            name: 'Actions',
            data: predictedActions,
            yAxis: 2,
            lineWidth: 1,
            dataGrouping: {
                units: groupingUnits
            }
        }, {
            type: 'line',
            name: 'Profit Data',
            data: profitData,
            yAxis: 1,
            lineWidth: 4,
            color: 'green',
            dataGrouping: {
                units: groupingUnits
            }
        }]
    });

    Highcharts.stockChart('profit-container', {
        rangeSelector: {
            selected: 1
        },
        title: {
            text: 'Profit change over time'
        },
        series: [{
            name: 'Net Profits',
            data: profitData,
            tooltip: {
                valueDecimals: 2
            }
        }]
    });
    $('.chart-wrapper').hide();
    $('#prediction-container-wrapper').css('display', 'inline-block');
});


$(document).ready(function(){
    $('#graph-selector button').click(function() {
        $(this).addClass('active').siblings().removeClass('active');
        let val = $(this).val();
        $('.chart-wrapper').hide();
        if(val === 'ls'){
            $('#prediction-container-wrapper').css('display', 'inline-block');
        }else if(val === 'his'){
            $('#container-wrapper').css('display', 'inline-block');
        }else if(val == 'profit'){
            $('#profit-container-wrapper').css('display', 'inline-block');
        }else if(val === 'stocks'){
            $('#stocks-container-wrapper').css('display', 'inline-block');
        }
    });
});
