(function() {

	function getData(str, fn) {
		d3.request(`http://api.football-data.org/v1/competitions/426/${str}`)
			.header("X-Auth-Token", "40ea3488e6be4f4d94300abdbc2f92af")
			.get()
			.responseType('json')
			.response(fn);
	}

	setBarChart();

	function setBarChart() {
		getData("leagueTable", renderBarChart);

		function renderBarChart(res) {
			data = JSON.parse(res.responseText);
			console.log(data);

			const margin = {top: 30, right: 20, bottom: 150, left: 60},
				width = 1240 - margin.left - margin.right,
				height = 640 - margin.top - margin.bottom;

			const x = d3.scaleBand()
				.rangeRound([0, width], .2)
				.padding(0.1);

			const y = d3.scaleLinear()
				.range([height, 0]);

			const xAxis = d3.axisBottom()
					.scale(x);

			const yAxis = d3.axisLeft()
				.scale(y)
				.ticks(30)
				.tickSize(-width);

			const svg = d3.select(".bar-char-example").append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform",
					"translate(" + margin.left + "," + margin.top + ")");

			x.domain(data.standing.map(d => d.teamName));
			y.domain([0, d3.max(data.standing, (d) => d.points)]);

			svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis)
				.selectAll("text")
				.style("text-anchor", "end")
				.attr("dx", "-.8em")
				.attr("dy", "-.55em")
				.attr("transform", " translate(15,5) rotate(-40)");

			svg.append("g")
				.attr("class", "y axis")
				.call(yAxis)
				.append("text")
				.attr("y", -15)
				.attr("dy", ".71em")
				.style("text-anchor", "end")
				.text("Points")
				.attr("y", -15);

			function rankTeams(n) {
				const rank = [
					"#e7ba52",
					"#3182bd", "#3182bd", "#3182bd",
					"#e6550d", "#e6550d",
					"#b5cf6b", "#b5cf6b", "#b5cf6b", "#b5cf6b", "#b5cf6b", "#b5cf6b", "#b5cf6b", "#b5cf6b", "#b5cf6b", "#b5cf6b", "#b5cf6b",
					"#636363", "#636363", "#636363"
				];
				return rank[n % rank.length];
			}

			svg.selectAll("bar")
				.data(data.standing)
				.enter().append("rect")
				.attr("class", "bar")
				.attr("x", d => x(d.teamName))
				.attr("width", x.bandwidth())
				.attr("y", d => y(d.points))
				.attr("height", d => height - y(d.points))
				.attr("fill", (d, i) => rankTeams(i));

			function renderLegend() {
				const qualifyingZone = [
					"zones",
					{zone: "Leader", color: "#e7ba52"},
					{zone: "Champions League", color: "#3182bd"},
					{zone: "Europa League", color: "#e6550d"},
					{zone: "Stay in League", color: "#b5cf6b"},
					{zone: "Relegation", color: "#636363"}
				];

				const legend = svg.append("rect")
					.attr("class", "legend")
					.attr("x", width - 180)
					.attr("width", 180)
					.attr("height", 142);

				const legendRect = svg.selectAll(".legend")
					.data(qualifyingZone)
					.enter().append("g")
					.attr("class", "legendRect")
					.attr("x", width - 180)
					.attr("width", 180)
					.attr("height", 180)
					.attr("transform", (d, i) => "translate(0," + i * 21 + ")");

				legendRect.append("rect")
					.attr("x", width - 170)
					.attr("width", 18)
					.attr("height", 18)
					.style("fill", d => d.color);

				legendRect.append("text")
					.attr("x", width - 145)
					.attr("y", 10)
					.attr("dy", ".35em")
					.text(d => d.zone);

			}

			renderLegend();

			function sortData(data) {
				x.domain(data.standing.map(d => d.teamName));
				y.domain([0, d3.max(data.standing, (d) => d.points)]);

				const b = d3.select(".bar-char-example").transition();

				b.selectAll(".bar")
					.duration(750)
					.attr("x", d => x(d.teamName));

				b.selectAll(".x.axis")
					.duration(0)
					.attr("transform", "translate(0," + height + ")")
					.call(xAxis)
					.selectAll("text")
					.style("text-anchor", "end")
					.attr("dx", "-.8em")
					.attr("dy", "-.55em")
					.attr("transform", " translate(15,5) rotate(-40)");
			}

			function sortByAlphabet(data) {
				data.standing.sort((a, b) => {
					if (a.teamName < b.teamName) return -1;
					if (a.teamName > b.teamName) return 1;
					return 0;
				});
				sortData(data);
			}

			function sortByPosition(data) {
				data.standing.sort((a, b) => a.position - b.position);
				sortData(data);
			}

			d3.select(".sortPosition")
				.on("click", () => sortByPosition(data));

			d3.select(".sortAlphabet")
				.on("click", () => sortByAlphabet(data));
		}
	}

	setHierarchyChart();

	function setHierarchyChart() {
		getData("teams", renderHierarchyChart);

		function renderHierarchyChart(res) {
			data = JSON.parse(res.responseText);
			console.log(data);

			const width = 960,
				height = 640,
				radius = Math.min(width, height) / 2;

			const color = d3.scaleOrdinal(d3.schemeCategory20);

			const arc = d3.arc()
				.outerRadius(radius - 10)
				.innerRadius(100);

			const labelArc = d3.arc()
				.outerRadius(radius - 40)
				.innerRadius(radius - 40);

			function parseSMV(str) {
				return parseInt(str.slice(0,-2).split(",").join(""));
			}

			data.teams.forEach(d => {
				d.squadMarketValue = parseSMV(d.squadMarketValue)/1000000;
			});

			function sortBySMV(data) {
				data.teams.sort((a, b) => a.squadMarketValue - b.squadMarketValue);
			}

			sortBySMV(data);

			const svg = d3.select(".hierarchy-example").append("svg")
				.attr("width", width)
				.attr("height", height)
				.append("g")
				.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

			const pie = d3.pie()
				.sort(null)
				.value(d => d.squadMarketValue);

			const tooltip = d3.select(".hierarchy-example").append("div")
				.attr("class", "tooltip")
				.style("opacity", 0);

			const g = svg.selectAll(".arc")
				.data(pie(data.teams))
				.enter().append("g")
				.attr("class", "arc");

			g.append("path")
				.attr("d", arc)
				.style("fill", (d,i) => color(i))
				.on("mouseover", d => {
					tooltip.transition()
						.duration(200)
						.style("opacity", .9);
					tooltip.html( `${d.data.name}<br/><img class="tooltip-image" src="${d.data.crestUrl}" alt="${d.data.code}">${d.data.squadMarketValue} millions €`)
						.style("left", (d3.event.pageX) + "px")
						.style("top", (d3.event.pageY - 28) + "px");
				})
				.on("mouseout", () => {
					tooltip.transition()
						.duration(500)
						.style("opacity", 0);
				});

			g.append("text")
				.attr("class", "arc-text")
				.style("text-anchor", "middle")
				.attr("transform", d => `translate( ${labelArc.centroid(d)})`)
				.attr("dy", ".1em")
				.text(d => d.data.code || d.data.shortName.slice(0,3).toUpperCase());
		}
    }

	document.querySelector(".toggle-chart").addEventListener("click", () => {
		document.querySelector(".bar-char-example").classList.toggle('hidden');
		document.querySelector(".hierarchy-example").classList.toggle('hidden');
	});

})();


