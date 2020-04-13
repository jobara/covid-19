var data = {
	resource_id: 'ed270bb8-340b-41f9-a7c6-e8ef587e6d11',
	offset: 55 // offset by 55 because they started reporting ICU cases on April 1, 2020
};

$.ajax({
	url: 'https://data.ontario.ca/api/3/action/datastore_search',
	data: data,
	dataType: 'jsonp',
	cache: true,
	success: function(data) {
		console.log('Total results found: ', data)
	}
});

const CURRENT_ICU_BEDS = 410;
const EXPANDED_ICU_BEDS = 1310;

let parseTime = d3.timeParse("%Y-%m-%dT%H:%M:%S");
let formatTime = d3.timeFormat("%d-%b");

let convertRecord = (record) => {
	return {
		...record,
		"Reported Date": parseTime(record["Reported Date"])
	};
};

let getDate = (record) => record["Reported Date"];
let getICU = (record) => record["Number of patients in ICU with COVID-19"];

const bestCaseData = PROJECTIONS.best.map(convertRecord);
const worstCaseData = PROJECTIONS.worst.map(convertRecord);

let generateChart = () => {
	//Width and height
	const w = 800; //Make this scale with the container
	const h = 450; //Make this scale with the container
	const margin = ({top: 50, right: 30, bottom: 50, left: 40})

	var startDate = d3.min(bestCaseData, getDate);
	var endDate = d3.max(bestCaseData, getDate);

	//Create scale functions
	let xScale = d3.scaleTime()
				.domain([
					d3.timeDay.offset(startDate, -1),  //startDate minus one day, for padding
					endDate
				])
				.range([margin.left, w - margin.right]);

	let yScale = d3.scaleLinear()
				.domain([0, 3800]) // the projections document goes to 3800
				.range([h - margin.bottom, margin.top]);

	let yScaleBar = d3.scaleLinear()
				.domain([0, 3800]) // the projections document goes to 3800
				.range([0, h - margin.bottom]);

	//Define X axis
	let xAxis = d3.axisBottom()
				.scale(xScale)
				.ticks(bestCaseData.length + 2)
				.tickFormat(formatTime)

	//Define Y axis
	let yAxis = d3.axisLeft()
				.scale(yScale)
				.ticks(19);

	let svg = d3.select("main")
			.append("svg")
			.attr("width", w)
			.attr("height", h);

	svg.selectAll("rect")
		.data(bestCaseData)
		.enter()
		.append("rect")
		.attr("x", d => {
			let date = getDate(d);
			return xScale(date);
		})
		.attr("y", d => {
			let inICU = getICU(d)
			return yScale(inICU);
		})
		.attr("width", "10")
		.attr("height", d => {
			let inICU = getICU(d);
			var height = (h - margin.bottom) - yScale(inICU);
			return height;
		})
		.attr("class", (d, i) => `index-${i}`)
		.attr("fill", "rgb(78, 176, 221)");

	//Create X axis
	let xAxisElm = svg.append("g")
		.attr("class", "x axis")
		.attr("transform", `translate(0, ${h - margin.top})`)
		.call(xAxis);

	d3.select(".x.axis").selectAll("text")
		.attr("transform", "rotate(-90) translate(-25, -15)")
		// .attr("transform", `translate(0, 5)`);

	//Create Y axis
	svg.append("g")
		.attr("class", "y axis")
		.attr("transform", `translate(${margin.left}, 0)`)
		.call(yAxis);

};
