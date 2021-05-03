import { KnobConfig } from './../panel-charts/chart-configuration-models/knob-config';
import { TreeMapConfig } from './../panel-charts/chart-configuration-models/treeMap-config';
import { EdaBlankPanelComponent } from '../eda-blank-panel.component';
import { ChartConfig } from '../panel-charts/chart-configuration-models/chart-config';
import { ChartJsConfig } from '../panel-charts/chart-configuration-models/chart-js-config';
import { KpiConfig } from '../panel-charts/chart-configuration-models/kpi-config';
import { MapConfig } from '../panel-charts/chart-configuration-models/map-config';
import { SankeyConfig } from '../panel-charts/chart-configuration-models/sankey-config';
import { FunnelConfig } from '../panel-charts/chart-configuration-models/funnel.config';

import { TableConfig } from '../panel-charts/chart-configuration-models/table-config';
import { ScatterConfig } from '../panel-charts/chart-configuration-models/scatter-config';

export const ChartsConfigUtils = {

  setConfig: (ebp: EdaBlankPanelComponent) => {

    let tableRows: number;
    let config: any = null;

    if (ebp.panelChart.componentRef && ['table', 'crosstable'].includes(ebp.panelChart.props.chartType)) {
      tableRows = ebp.panelChart.componentRef.instance.inject.rows || 10;
      config =
      {
        withColTotals: ebp.panelChart.componentRef.instance.inject.withColTotals,
        withColSubTotals: ebp.panelChart.componentRef.instance.inject.withColSubTotals,
        withRowTotals: ebp.panelChart.componentRef.instance.inject.withRowTotals,
        withTrend: ebp.panelChart.componentRef.instance.inject.withTrend,
        resultAsPecentage: ebp.panelChart.componentRef.instance.inject.resultAsPecentage,
        onlyPercentages: ebp.panelChart.componentRef.instance.inject.onlyPercentages,
        visibleRows: tableRows,
        sortedSerie: ebp.panelChart.componentRef.instance.inject.sortedSerie,
        sortedColumn: ebp.panelChart.componentRef.instance.inject.sortedColumn,
        styles : ebp.panelChart.componentRef.instance.inject.styles
      }

    } else if (ebp.panelChart.componentRef && ebp.panelChart.props.chartType === 'kpi') {

      config =
      {
        sufix: ebp.panelChart.componentRef.instance.inject.sufix,
        alertLimits: ebp.panelChart.componentRef.instance.inject.alertLimits
      }

    } else if (['geoJsonMap', 'coordinatesMap'].includes(ebp.panelChart.props.chartType)) {
      config =  ebp.panelChart.props.config.getConfig() ;
    }
    else if (["parallelSets", "treeMap", "scatterPlot", "funnel"].includes(ebp.panelChart.props.chartType)) {

      config =
      {
        colors: ebp.panelChart.componentRef ? ebp.panelChart.componentRef.instance.colors : []
      }
    }

    else if (ebp.panelChart.props.chartType === 'knob') {
  
      config = {
        color: ebp.panelChart.componentRef ? ebp.panelChart.componentRef.instance.color : ebp.panelChart.props.config.getConfig()['color'],
        limits: ebp.panelChart.componentRef ? ebp.panelChart.componentRef.instance.limits : ebp.panelChart.props.config.getConfig()['limits']
      };
    }

    else{
      config = { 
        colors: ebp.panelChart.props.config && ebp.panelChart.props.config.getConfig() ? ebp.panelChart.props.config.getConfig()['colors'] : [], 
        chartType: ebp.panelChart.props.chartType, 
        addTrend: ebp.panelChart.props.config && ebp.panelChart.props.config.getConfig() ? ebp.panelChart.props.config.getConfig()['addTrend'] : false
      };
  }
    return new ChartConfig(config);

  },

  /**
  * Returns a configuration object for this type
  * @param type chart type
  */
  setVoidChartConfig: (type: string) => {

    if (['table', 'crosstable'].includes(type)) {

      return new TableConfig(false, false, 10, false, false, false, false, null, null, null);

    }
    else if (['bar', 'line', 'piechart', 'doughnut'].includes(type)) {

      return new ChartJsConfig(null, type, false);

    } else if (type === 'parallelSets') {

      return new SankeyConfig([]);

    } else if (type === 'treeMap') {

      return new TreeMapConfig([]);

    } else if (type === 'scatterPlot') {
      return new ScatterConfig([]);
    }
    else if (type === 'funnel') {
      return new FunnelConfig([]);
    }
    else if (type === 'knob') {

      return new KnobConfig(null, null);
    }
    else {
      return new KpiConfig('', []);
    }
  },

  recoverConfig: (type: string, config: TableConfig | KpiConfig | ChartJsConfig | MapConfig | SankeyConfig | TreeMapConfig | KnobConfig | FunnelConfig) => {

    if (['table', 'crosstable'].includes(type)) {
      return new ChartConfig(config);
    }
    else if (['bar', 'line', 'pie', 'doughnut', 'barline', 'horizontalBar'].includes(type)) {
      return new ChartConfig(config);
    }
    else if (type === 'kpi') {
      return new ChartConfig(config);
    }
    else if (type === 'geoJsonMap') {
      return new ChartConfig(config);
    }
    else if (type === 'coordinatesMap') {
      return new ChartConfig(config);
    }
    else if (type === 'parallelSets') {
      return new ChartConfig(config);

    } 
    else if (type === 'treeMap') {
      return new ChartConfig(config);

    } 
    else if (type === 'scatterPlot') {
      return new ChartConfig(config);

    }
    else if(type === 'knob'){
      return new ChartConfig(config);
    }
    else if (type === 'funnel') {
      return new ChartConfig(config);
    }

  }

}