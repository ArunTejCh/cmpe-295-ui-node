var baseUrl = 'http://ec2-54-190-197-42.us-west-2.compute.amazonaws.com/';
	var historical = "", constituents = [];
	new Promise(function(resolve, reject) {
		$.getJSON(baseUrl + '/indexes', function(data){
			console.log(`got data ${data}`);
			resolve(data);
		});
	}).then(function(data){
		console.log(`got data in resolve as ${data}`);
		var prom = new Promise(function(resolve, reject){
			$.getJSON(baseUrl+ '/indexes/' + data[0]+'/historical', function(hist){
				console.log(`got historical data as ${hist}`);
				resolve([data, hist]);
			});
		})
		
		return prom;
	}).then(function(values){
		console.log(`got resolve historical data as ${values[1]}`);
		var prom = new Promise(function(resolve, reject){
			$.getJSON(baseUrl+ '/indexes/' + values[0][0]+'/stocks', function(stocks){
				console.log(`got stocks data as ${stocks}`);
				values.push(stocks);
				resolve(values);
			});
		})
		return prom;
	}).then(function(values){
		var prom = new Promise(function(resolve, reject){
			$.getJSON(baseUrl+ '/indexes/' + values[0][0]+'/targets', function(targets){
				console.log(`got targets data as ${targets}`);
				values.push(targets);
				resolve(values);
			});
		})
		
		return prom;
	}).then(function(values){
		var promises = [];
		promises.push(Promise.resolve(values));		
		for(let s of values[2]){
			promises.push(new Promise(function(resolve, reject){
				$.getJSON(baseUrl+ '/stocks/' + s + '/historical', function(data){
					console.log(`got stocks historical data as ${data}`);
					resolve([s, data]);
				});
			}));
		}
		return Promise.all(promises);
	}).then(function(values){
		console.log(`got values as ${values}`);
		var data = values[0][1];
		var targetData = values[0][3];
		var dataArray = [];
		var targets = [];
		var groupingUnits = [ [ 'week', // unit name
			[ 1 ] // allowed multiples
		], [ 'month', [ 1, 2, 3, 4, 6 ] ] ];
		for(let i = 0; i < data.length; i++){
			dataArray.push([data[i].date, data[i].open, data[i].high, data[i].low, data[i].close]);
		}
		
		for(let i = 0; i < targetData.length; i++){
			targets.push([targetData[i].date, (targetData[i].target + 1)]);			
		}
		Highcharts.stockChart('container', {
			rangeSelector : {
				selected : 2
			},
			plotOptions: {
	        	column: {
	            	zones: [{
	                	value: 2, // Values up to 10 (not including) ...
	                    color: 'red' // ... have the color blue.
	                },{
	                	value: 3,
	                	color: 'black' // Values from 10 (including) and up have the color red
	                },{
	                	color: 'green' // Values from 10 (including) and up have the color red
	                }]
	            }
	        },
			title : {
				text : 'BankNifty Stock Index'
			},
			subtitle : {
				text : 'historical data'
			},
			legend: {
		        layout: 'vertical',
		        verticalAlign: 'middle',
		        align: 'right',
		        enabled: true
		    },yAxis: [{
	            labels: {
	                align: 'right',
	                x: -3
	            },
	            title: {
	                text: 'Index Price'
	            },
	            height: '90%',
	            lineWidth: 2,
	            resize: {
	                enabled: true
	            }
	        }, {
	            labels: {
	                align: 'right',
	                x: -3
	            },
	            title: {
	                text: 'Targets'
	            },
	            top: '95%',
	            height: '5%',
	            offset: 0,
	            lineWidth: 2
	        }],
			series : [ {
				type : 'candlestick',
				id : 'bnknifty',
				name : 'BankNifty',
				yAxis : 0,
				data : dataArray,
				dataGrouping : {
					units : groupingUnits
				}
			}, {
	            type: 'column',
	            name: 'Targets',
	            data: targets,
	            yAxis: 1,
	            dataGrouping: {
	                units: groupingUnits
	            }
	        } , {
	            type: 'bb',
	            linkedTo: 'bnknifty'
	        },  {
	            type: 'ema',
	            linkedTo: 'bnknifty',
	            lineWidth: 1,
	            dashStyle: 'longdash',
	            params: {
	                period: 30
	            }
	        }]
		});
		var stockSeries = [];
		for(let i = 1; i < values.length; i++){
			let name = values[i][0];
			let data = [];
			
			for(let j = 0; j < values[i][1].length; j++){
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
			rangeSelector : {
				selected : 2
			},
			title : {
				text : 'BankNifty Constituent Stocks'
			},
			subtitle : {
				text : 'historical data'
			},
			legend: {
				layout: 'vertical',
		        verticalAlign: 'middle',
		        align: 'right',
		        enabled: true
		    },
			series : stockSeries/* ,
	        drilldown:[
	        	series:[{
	        		id: 'Constituent stocks',
	        		data:[
	        			values[1][0]: 
	        		]
	        	}]
	        ] */
		});
	});
