import { Component, OnInit } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import {
  select,
  selectAll,
  scaleBand,
  scaleLinear,
  scaleOrdinal,
  max,
  stack,
  sum,
  axisBottom,
  axisLeft,
  ScaleOrdinal,
} from "d3";

export interface Category {
  category: string;
  subcategory: string;
  value: number;
}

export const COLOR_PALETTE = [
  "#0fb5ae",
  "#4046ea",
  "#f68511",
  "#de3d82",
  "#adadad",
];

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent implements OnInit {
  title = "d3-stacked-bar";
  rawData: Category[] = [
    { category: "2020", subcategory: "Öffentliche Einrichtungen", value: 10 },
    { category: "2020", subcategory: "Öffentliche Beleuchtung", value: 20 },
    { category: "2020", subcategory: "Kein Objekttyp", value: 30 },
    { category: "2021", subcategory: "Öffentliche Einrichtungen", value: 20 },
    { category: "2021", subcategory: "Öffentliche Beleuchtung", value: 30 },
    { category: "2021", subcategory: "Kein Objekttyp", value: 10 },
    { category: "2022", subcategory: "Öffentliche Einrichtungen", value: 20 },
    { category: "2022", subcategory: "Öffentliche Beleuchtung", value: 55 },
    { category: "2022", subcategory: "Kein Objekttyp", value: 35 },
    { category: "2023", subcategory: "Öffentliche Einrichtungen", value: 23 },
    { category: "2023", subcategory: "Öffentliche Beleuchtung", value: 65 },
    { category: "2023", subcategory: "Kein Objekttyp", value: 45 },
    { category: "2024", subcategory: "Öffentliche Einrichtungen", value: 3 },
    { category: "2024", subcategory: "Öffentliche Beleuchtung", value: 15 },
    { category: "2024", subcategory: "Kein Objekttyp", value: 83 },
  ];
  groups = ["2020", "2021", "2022", "2023", "2024"];
  subgroups = [...new Set(this.rawData.map((d) => d.subcategory))];
  colorScale?: ScaleOrdinal<string, unknown, never>;

  ngOnInit(): void {
    this.createStackedBarChart();
    this.createLegend();
  }

  private createStackedBarChart(): void {
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const x = { margin: { top: 4 } };
    const width = 500 - margin.left - margin.right;
    const height = 280 - margin.top - margin.bottom;

    const svg = select("#chart-container")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    // Group data by category
    const groupedData = this.rawData.reduce(function (acc: any, cur: Category) {
      acc[cur.category] = acc[cur.category] || [];
      acc[cur.category].push(cur);
      return acc;
    }, {});

    const stackData = stack()
      .keys(this.subgroups)
      .value(
        (d: any, key) => d.find((v: any) => v.subcategory === key)?.value || 0
      )(
      // Extract values for each subcategory
      Object.values(groupedData)
    );

    const maxDataValue = max(
      Object.values(groupedData).map((data: any) => {
        return data.reduce((d: any, c: any) => d + c.value, 0);
      })
    ) as number;

    const xScale = scaleBand()
      .domain(this.groups)
      .range([0, width])
      .padding(0.2);

    const yScale = scaleLinear().domain([0, maxDataValue]).range([height, 0]);

    this.colorScale = scaleOrdinal()
      .domain(this.subgroups)
      .range(COLOR_PALETTE);

    svg
      .append("g")
      .attr("transform", `translate(0,${height + x.margin.top})`)
      .call(axisBottom(xScale).tickSizeInner(-10));

    // svg.append("g").call(axisLeft(yScale));

    svg
      .append("g")
      .selectAll("g")
      .data(stackData)
      .join("g")
      .attr("fill", (d: any) => this.colorScale?.(d.key) as string)
      .attr("class", (d, i) => "myRect " + d.key.trim().replace(/\s/g, ""))
      .selectAll("rect")
      .data((d) => d as any)
      .join("rect")
      .attr("x", (d: any, i) => xScale(d.data[0].category)!)
      .attr("y", (d: any, i) => yScale(d[1]))
      .attr("height", (d: any, i) => yScale(d[0]) - yScale(d[1]))
      .attr("width", () => xScale.bandwidth())
      // .attr("stroke", "grey")
      .on("mouseover", this.chartMouseOver)
      .on("mouseleave", this.chartMouseOut)
      .on("click", this.chartClick);
  }

  private createLegend(): void {
    const legend = select("#chart-legend")
      .append("div")
      .attr("class", "legend")
      .attr("transform", "translate(10, 20)");

    const legendItems = legend
      .selectAll(".legend-item")
      .data(this.subgroups)
      .join("g")
      .attr("class", "legend-item")
      .on("mouseover", this.chartMouseOver)
      .on("mouseout", this.chartMouseOut);

    const legendSvg = legendItems
      .append("svg")
      .attr("width", 12)
      .attr("height", 12)
      //.style("float", "right")
      .style("margin-right", 4)
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("rx", 2)
      .attr("ry", 2)
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", (d: any) => this.colorScale?.(d) as string);

    legendItems
      .append("text")
      .text((d) => d)
      .attr("class", "legend-text")
      .style("alignment-baseline", "middle");
  }

  private chartMouseOver(event: any, d: any): void {
    const datum = select(event.target.parentNode).datum() as {
      key: string;
    };

    const subCategory =
      datum?.key?.trim().replace(/\s/g, "") || d?.trim().replace(/\s/g, "");

    selectAll(".myRect").style("opacity", 0.25); // set the opacity to 30%
    selectAll("." + subCategory).style("opacity", 1); // highlight the selected subcategory

    select("#chart-legend")
      .selectAll(".legend-item")
      .filter(
        (ld: string | any): boolean =>
          ld?.trim().replace(/\s/g, "") === subCategory
      )
      .style("background", "#ededed");
  }

  private chartMouseOut(event: any, d: any): void {
    selectAll(".myRect").style("opacity", 1);

    select("#chart-legend")
      .selectAll(".legend-item")
      .style("background", "#ffffff");
  }

  private chartClick(event: any): void {
    const datum = select(event.target.parentNode).datum() as {
      key: string;
    };

    console.log("clicked", datum.key);
  }
}
