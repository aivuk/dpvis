import * as d3 from 'd3'

export default class Treemap {

  constructor (elementID) {
    this.elementID = elementID
    this.treemap = null
    this.div = null
  }

  create () {
    var currentTreemap = document.getElementById(this.elementID)
    this.width = currentTreemap.offsetWidth
    this.height = currentTreemap.offsetHeight
    currentTreemap.innerHTML = ''

    this.treemap = d3.layout.treemap()
      .size([this.width, this.height])
      .sticky(true)
      .sort(function (a, b) { return Math.abs(a.value) - Math.abs(b.value) })
      .value(function (d) { return Math.abs(d.value) })

    this.div = d3.select('.treemap').append('div')
      .style('position', 'relative')
      .style('width', this.width + 'px')
      .style('height', this.height + 'px')
  }

  render (data, dimension) {
    // TODO: remove elements, don't create each time.
    this.create()

    var root = {
      children: []
    }
    for (var i = 0; i < data.cells.length; i += 1) {
      root.children.push({
        name: data.cells[i]['_label'],
        value: data.cells[i]['_value'],
        value_fmt: data.cells[i]['_value_fmt'],
        percentage: data.cells[i]['_percentage'],
        href: data.cells[i]['_url'],
        color: data.cells[i]['_color']
      })
    }

    function positionNode (d) {
      d.style('left', function (d) { return d.x + 'px' })
       .style('top', function (d) { return d.y + 'px' })
       .style('width', function (d) { return Math.max(0, d.dx - 1) + 'px' })
       .style('height', function (d) { return Math.max(0, d.dy - 1) + 'px' })
    }

    d3.select('.tooltip').remove()

    var div = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)

    this.div.datum(root).selectAll('.node')
        .data(this.treemap.nodes)
          .enter().append('a')
            .attr('href', function (d) { return d.href })
            .attr('class', 'node')
            .call(positionNode)
            .style('background', '#fff')
            .classed('big', function (d) { return d.value > data.summary._value / 50 })
            .html(function (d) {
              if (d.percentage < 0.03) {
                return ''
              }
              return d.children ? null : '<span class="amount">' + d.value_fmt + '</span>' + d.name
            })
            .on('mouseover', function (d) {
              d3.select(this).transition().duration(200)
                .style({ 'background': d3.rgb(d.color).darker() })
              div.transition()
                .duration(200)
                .style('opacity', 0.9)
              div.html(`<strong>${d.name}</strong><br>${d.value_fmt}<br><strong>${(d.percentage * 100).toFixed(2)}%</strong>`)
                .style('left', (d3.event.pageX) + 'px')
                .style('top', (d3.event.pageY - 28) + 'px')
            })
            .on('mouseout', function (d) {
              d3.select(this).transition().duration(500)
                .style({'background': d.color})
              div.transition()
                  .duration(500)
                  .style('opacity', 0)
            })
            .transition()
            .duration(500)
            .delay(function (d, i) { return Math.min(i * 30, 1500) })
            .style('background', function (d) { return d.color })
  }
}
