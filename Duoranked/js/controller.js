var duoRankedApp = angular.module('duoRankedApp', []);

duoRankedApp.controller('summonerCtrl', function ($scope, $http) {
	var apiKey = "4a0c7ffc-8dd7-4dd5-8629-c293e3da288a";
	var champs = [];
	var champPromise = $http.get("https://prod.api.pvp.net/api/lol/static-data/na/v1.2/champion?champData=image&api_key=4a0c7ffc-8dd7-4dd5-8629-c293e3da288a");
	champPromise.success( function(data, status, headers, config) {
		for (champ in data.data) {
			//champs.push({ id: data.data[champ].id, champ : data.data[champ]});
			champs[data.data[champ].id] = data.data[champ];
		}
		console.log(champs);
	});


	$scope.data = {};
	$scope.data.v = "4.7.16"; 
	$scope.data.champs = champs;
	$scope.data.doClick = function(item, event) {
		var region = angular.element("#region").val() || "";
		var name = angular.element("#sn-input").val() || "";

		var responsePromise = $http.get("https://prod.api.pvp.net/api/lol/"+region+"/v1.4/summoner/by-name/"+name+"?api_key="+apiKey);

		responsePromise.success( function(data, status, headers, config) {
			$scope.data.summoner = data[name];
			angular.element("#summoner-container").show('fade');

			var statsPromise = $http.get("https://prod.api.pvp.net/api/lol/"+region+"/v1.3/stats/by-summoner/"+$scope.data.summoner.id+"/summary?season=SEASON4&api_key="+apiKey);

			statsPromise.success( function(data, status, headers, config) {
				$scope.data.stats = data["playerStatSummaries"];
			});

			var matchesPromise = $http.get("https://prod.api.pvp.net/api/lol/"+region+"/v1.3/game/by-summoner/"+$scope.data.summoner.id+"/recent?api_key="+apiKey);
			matchesPromise.success( function(data, status, headers, config) {
				$scope.data.matches = data["games"];
			});

			

		});
	}

});