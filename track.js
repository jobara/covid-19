
let fetchData = async () => {
	let data = {
		resource_id: 'ed270bb8-340b-41f9-a7c6-e8ef587e6d11',
		// offset by 42 because projections started on March 19, 2020
		// However they only started reporting ICU cases on April 1, 2020
		offset: 42
	};

	return $.ajax({
		url: 'https://data.ontario.ca/api/3/action/datastore_search',
		data: data,
		dataType: 'jsonp',
		cache: true,
		// success: function(data) {
		// 	console.log('Total results found: ', data)
		// }
	});
};

const parseTime = d3.timeParse("%Y-%m-%dT%H:%M:%S");
const formatTime = d3.timeFormat("%d-%b");

let getICU = (data, index) => {
	return data[index] && data[index]["Number of patients in ICU with COVID-19"];
}

let combine = (best=[{}], worst=[{}], actual=[{}]) => {
	let recordCount = Math.max(best.length, worst.length, actual.length);
	let combined = [];

	for (let i = 0; i < recordCount; i++) {
		let date = (actual[i] || best[i] || worst[i])["Reported Date"];
		combined.push({
			"date": formatTime(parseTime(date)),
			"actual": getICU(actual, i),
			"best case projection": getICU(best, i),
			"worst case projecction": getICU(worst, i)
		});
	}

	return combined;
};

let drawChart = (data, width=800, height=450) => {
	//Width and height
	const w = width; //Make this scale with the container
	const h = height; //Make this scale with the container
	const margin = ({top: 50, right: 30, bottom: 50, left: 40})
	const columns = Object.keys(data[0]);
	const groupKey = columns[0];
	const keys = columns.slice(1);

	let color = d3.scaleOrdinal()
    						.range(["#478541", "#4DAEDB", "#DF6235"])

	let xTimeScale = d3.scaleBand()
										.domain(data.map(record => record[groupKey]))
										.range([margin.left, w - margin.right])
										.paddingInner(0.1);

	let xProjectionsScale = d3.scaleBand()
														.domain(keys)
														.range([0, xTimeScale.bandwidth()])

	let yICUScale = d3.scaleLinear()
										.domain([0, 3800])
										.range([h - margin.bottom, margin.top]);


	let xAxis = g => { g
		.attr("transform", `translate(0,${h - margin.bottom})`)
			.call(d3.axisBottom(xTimeScale).tickSizeOuter(0))
			.call(g => g.select(".domain").remove())
	};

	let yAxis = g => { g
		.attr("transform", `translate(${margin.left},0)`)
			.call(d3.axisLeft(yICUScale).ticks(19))
			.call(g => g.select(".domain").remove())
			.call(g => g.select(".tick:last-of-type text").clone()
				.attr("x", 3)
				.attr("text-anchor", "start")
				.attr("font-weight", "bold")
				.text("ICU Beds Required")
			)
	};

	let legend = svg => {
	  const g = svg
	      .attr("transform", `translate(${w},0)`)
	      .attr("text-anchor", "end")
	      .attr("font-family", "sans-serif")
	      .attr("font-size", 10)
	    .selectAll("g")
	    .data(color.domain().slice().reverse())
	    .join("g")
	      .attr("transform", (d, i) => `translate(0,${i * 20})`);

	  g.append("rect")
	      .attr("x", -19)
	      .attr("width", 19)
	      .attr("height", 19)
	      .attr("fill", color);

	  g.append("text")
	      .attr("x", -24)
	      .attr("y", 9.5)
	      .attr("dy", "0.35em")
	      .text(d => d);
	}

	let svg = d3.select("main")
			.append("svg")
			.attr("preserveAspectRatio", "xMinYMin meet")
			.attr("viewBox", `0 0 ${w} ${h}`);

  svg.append("g")
    .selectAll("g")
    .data(data)
    .join("g")
      .attr("transform", d => `translate(${xTimeScale(d[groupKey])},0)`)
    .selectAll("rect")
    .data(d => keys.map(key => ({key, value: d[key]})))
    .join("rect")
      .attr("x", d => xProjectionsScale(d.key))
      .attr("y", d => yICUScale(d.value))
      .attr("width", xProjectionsScale.bandwidth())
      .attr("height", d => yICUScale(0) - yICUScale(d.value))
      .attr("fill", d => color(d.key));

  svg.append("g")
      .call(xAxis)
			.selectAll("text")
			.attr("transform", "rotate(-90) translate(-25, -15)")

  svg.append("g")
      .call(yAxis);

  svg.append("g")
      .call(legend);
};

let generateChart = async () => {
	let fetched = await fetchData();
	// console.log("fetched:", fetched.result.records);
	let data = combine(PROJECTIONS.best, PROJECTIONS.worst, fetched.result.records);
	drawChart(data);
	// console.log("combined:", data);
}
