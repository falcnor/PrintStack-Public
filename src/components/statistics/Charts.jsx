import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import styles from './Charts.module.css';

/**
 * Custom Chart Components Built with SVG
 * Provides data visualization without external dependencies
 */

/**
 * Generic Chart Component - Base class for all charts
 */
const Chart = ({ title, subtitle, data, width = 400, height = 300, className = '', children }) => {
  const chartRef = useRef(null);

  return (
    <div className={`${styles.chart} ${className}`} ref={chartRef}>
      {(title || subtitle) && (
        <div className={styles.chartHeader}>
          {title && <h3 className={styles.chartTitle}>{title}</h3>}
          {subtitle && <p className={styles.chartSubtitle}>{subtitle}</p>}
        </div>
      )}
      <div className={styles.chartContent}>
        {children}
      </div>
    </div>
  );
};

/**
 * Bar Chart Component
 */
export const BarChart = ({
  title,
  data,
  width = 400,
  height = 300,
  colorScale = '#3b82f6',
  showLabels = true,
  showValues = true,
  maxBars = 10,
  orientation = 'vertical' // 'vertical' or 'horizontal'
}) => {
  const [hoveredBar, setHoveredBar] = useState(null);

  // Process data and limit to maxBars
  const processedData = Array.isArray(data)
    ? data.slice(0, maxBars)
    : Object.entries(data).slice(0, maxBars).map(([label, value]) => ({ label, value }));

  if (!processedData.length) {
    return (
      <Chart title={title} width={width} height={height}>
        <div className={styles.noData}>No data available</div>
      </Chart>
    );
  }

  const maxValue = Math.max(...processedData.map(d => d.value || 0));
  const margin = { top: 20, right: 30, bottom: 60, left: 50 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const getBarWidth = () => {
    if (orientation === 'horizontal') {
      return (chartWidth / processedData.length) * 0.7;
    }
    return chartWidth / processedData.length * 0.7;
  };

  const getBarHeight = (value) => {
    if (orientation === 'horizontal') {
      return chartHeight / processedData.length * 0.7;
    }
    return (value / maxValue) * chartHeight;
  };

  const getX = (index, value) => {
    if (orientation === 'horizontal') {
      return margin.left;
    }
    return margin.left + (index * (chartWidth / processedData.length));
  };

  const getY = (index, value) => {
    if (orientation === 'horizontal') {
      return margin.top + (index * (chartHeight / processedData.length));
    }
    return chartHeight + margin.top - getBarHeight(value);
  };

  return (
    <Chart title={title} width={width} height={height}>
      <svg width={width} height={height}>
        {/* Grid lines */}
        {Array.from({ length: 5 }).map((_, i) => {
          const value = (maxValue / 4) * i;
          const y = orientation === 'vertical'
            ? margin.top + chartHeight - (value / maxValue) * chartHeight
            : margin.top;

          if (orientation === 'vertical') {
            return (
              <g key={i}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + chartWidth}
                  y2={y}
                  className={styles.gridLine}
                />
                <text
                  x={margin.left - 10}
                  y={y + 5}
                  textAnchor="end"
                  className={styles.gridLabel}
                >
                  {Math.round(value)}
                </text>
              </g>
            );
          }
          return null;
        })}

        {/* Bars */}
        {processedData.map((item, index) => {
          const barWidth = getBarWidth();
          const barHeight = getBarHeight(item.value || 0);
          const x = orientation === 'horizontal' ? margin.left : getX(index, item.value);
          const y = getY(index, item.value);

          // Calculate color intensity
          const intensity = 0.3 + (0.7 * ((item.value || 0) / maxValue));
          const color = typeof colorScale === 'function' ? colorScale(item.value || 0) : colorScale;

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barHeight}
                height={barWidth}
                fill={color}
                fillOpacity={hoveredBar === index ? 1 : intensity}
                className={styles.bar}
                onMouseEnter={() => setHoveredBar(index)}
                onMouseLeave={() => setHoveredBar(null)}
              />
              {showValues && (hoveredBar === index || processedData.length <= 5) && (
                <text
                  x={orientation === 'horizontal' ? x + barHeight + 5 : x + barHeight / 2}
                  y={orientation === 'horizontal' ? y + barWidth / 2 : y - 5}
                  className={styles.barLabel}
                  textAnchor={orientation === 'horizontal' ? 'start' : 'middle'}
                >
                  {item.value}
                </text>
              )}
              {showLabels && (
                <text
                  x={orientation === 'horizontal' ? margin.left - 10 : x + barHeight / 2}
                  y={orientation === 'horizontal' ? y + barWidth / 2 : margin.top + chartHeight + 20}
                  className={styles.axisLabel}
                  textAnchor={orientation === 'horizontal' ? 'end' : 'middle'}
                  transform={orientation === 'horizontal' ? `rotate(-45, ${margin.left - 10}, ${y + barWidth / 2})` : undefined}
                >
                  {item.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </Chart>
  );
};

/**
 * Pie Chart Component
 */
export const PieChart = ({
  title,
  data,
  width = 400,
  height = 300,
  colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6b7280'],
  showLabels = true,
  showPercentages = true,
  innerRadius = 0 // Set >0 for donut chart
}) => {
  const [activeSegment, setActiveSegment] = useState(null);

  // Process data
  const processedData = Array.isArray(data)
    ? data
    : Object.entries(data).map(([label, value]) => ({ label, value }));

  if (!processedData.length) {
    return (
      <Chart title={title} width={width} height={height}>
        <div className={styles.noData}>No data available</div>
      </Chart>
    );
  }

  const total = processedData.reduce((sum, item) => sum + (item.value || 0), 0);
  const radius = Math.min(width, height) / 2 - 40;
  const cx = width / 2;
  const cy = height / 2;

  let currentAngle = -Math.PI / 2; // Start from top

  const segments = processedData.map((item, index) => {
    const value = item.value || 0;
    const percentage = (value / total) * 100;
    const angle = (value / total) * 2 * Math.PI;

    const segment = {
      ...item,
      percentage,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      color: colors[index % colors.length],
      index
    };

    currentAngle += angle;
    return segment;
  });

  // Calculate SVG path for pie segment
  const createPath = (segment) => {
    const startAngle = segment.startAngle;
    const endAngle = segment.endAngle;

    const x1 = cx + Math.cos(startAngle) * radius;
    const y1 = cy + Math.sin(startAngle) * radius;
    const x2 = cx + Math.cos(endAngle) * radius;
    const y2 = cy + Math.sin(endAngle) * radius;

    let path;
    if (innerRadius > 0) {
      const innerX1 = cx + Math.cos(startAngle) * innerRadius;
      const innerY1 = cy + Math.sin(startAngle) * innerRadius;
      const innerX2 = cx + Math.cos(endAngle) * innerRadius;
      const innerY2 = cy + Math.sin(endAngle) * innerRadius;

      path = [
        `M ${innerX1} ${innerY1}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${endAngle - startAngle > Math.PI ? 1 : 0} 1 ${x2} ${y2}`,
        `L ${innerX2} ${innerY2}`,
        `A ${innerRadius} ${innerRadius} 0 ${endAngle - startAngle > Math.PI ? 1 : 0} 0 ${innerX1} ${innerY1}`,
        'Z'
      ].join(' ');
    } else {
      path = [
        `M ${cx} ${cy}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${endAngle - startAngle > Math.PI ? 1 : 0} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
    }

    return path;
  };

  return (
    <Chart title={title} width={width} height={height}>
      <svg width={width} height={height}>
        {/* Pie segments */}
        {segments.map((segment) => {
          const isActive = activeSegment === segment.index;
          const offset = isActive ? 5 : 0;
          const middleAngle = (segment.startAngle + segment.endAngle) / 2;
          const offsetX = Math.cos(middleAngle) * offset;
          const offsetY = Math.sin(middleAngle) * offset;

          return (
            <g key={segment.index}>
              <path
                d={createPath(segment)}
                fill={segment.color}
                stroke="white"
                strokeWidth={2}
                transform={`translate(${offsetX}, ${offsetY})`}
                className={styles.pieSegment}
                onMouseEnter={() => setActiveSegment(segment.index)}
                onMouseLeave={() => setActiveSegment(null)}
                style={{ cursor: 'pointer' }}
              />

              {/* Labels */}
              {showLabels && segment.percentage > 5 && (
                <g
                  transform={`translate(${cx + Math.cos(middleAngle) * (radius * 0.7) + offsetX}, ${cy + Math.sin(middleAngle) * (radius * 0.7) + offsetY})`}
                >
                  <text
                    textAnchor="middle"
                    className={styles.pieLabel}
                  >
                    {showPercentages ? `${segment.percentage.toFixed(1)}%` : segment.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Legend */}
        {segments.length > 1 && (
          <g className={styles.legend}>
            {segments.map((segment, index) => (
              <g
                key={index}
                transform={`translate(10, ${20 + index * 25})`}
                onMouseEnter={() => setActiveSegment(index)}
                onMouseLeave={() => setActiveSegment(null)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={0}
                  y={0}
                  width={15}
                  height={15}
                  fill={segment.color}
                  stroke={activeSegment === index ? '#333' : 'white'}
                  strokeWidth={activeSegment === index ? 2 : 1}
                />
                <text
                  x={20}
                  y={12}
                  className={styles.legendLabel}
                >
                  {segment.label} ({segment.percentage.toFixed(1)}%)
                </text>
              </g>
            ))}
          </g>
        )}
      </svg>

      {/* Tooltip */}
      {activeSegment !== null && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipContent}>
            <strong>{segments[activeSegment].label}</strong><br />
            Value: {segments[activeSegment].value}<br />
            {segments[activeSegment].percentage.toFixed(1)}%
          </div>
        </div>
      )}
    </Chart>
  );
};

/**
 * Line Chart Component
 */
export const LineChart = ({
  title,
  data,
  width = 400,
  height = 300,
  color = '#3b82f6',
  showDots = true,
  showGrid = true,
  smooth = false
}) => {
  // Process data
  const processedData = Array.isArray(data) ? data : [];

  if (!processedData.length) {
    return (
      <Chart title={title} width={width} height={height}>
        <div className={styles.noData}>No data available</div>
      </Chart>
    );
  }

  const margin = { top: 20, right: 30, bottom: 50, left: 50 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const xValues = processedData.map((d, i) => d.x || i);
  const yValues = processedData.map(d => d.y || d.value || 0);

  const maxValue = Math.max(...yValues);
  const minValue = Math.min(...yValues);

  const getX = (index) => margin.left + (index / (processedData.length - 1)) * chartWidth;
  const getY = (value) => margin.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;

  // Create path for line
  const createPath = () => {
    if (smooth) {
      // Create smooth curve using quadratic bezier curves
      const points = processedData.map((d, i) => ({
        x: getX(i),
        y: getY(d.y || d.value || 0)
      }));

      let path = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const cp1x = (points[i - 1].x + points[i].x) / 2;
        const cp1y = points[i - 1].y;
        const cp2x = cp1x;
        const cp2y = points[i].y;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i].x} ${points[i].y}`;
      }
      return path;
    } else {
      // Create straight line
      return processedData.map((d, i) => {
        const x = getX(i);
        const y = getY(d.y || d.value || 0);
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      }).join(' ');
    }
  };

  return (
    <Chart title={title} width={width} height={height}>
      <svg width={width} height={height}>
        {/* Grid */}
        {showGrid && (
          <g>
            {Array.from({ length: 5 }).map((_, i) => {
              const value = minValue + ((maxValue - minValue) / 4) * i;
              const y = getY(value);
              return (
                <g key={i}>
                  <line
                    x1={margin.left}
                    y1={y}
                    x2={margin.left + chartWidth}
                    y2={y}
                    className={styles.gridLine}
                  />
                  <text
                    x={margin.left - 10}
                    y={y + 5}
                    textAnchor="end"
                    className={styles.gridLabel}
                  >
                    {Math.round(value)}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* Line */}
        <path
          d={createPath()}
          fill="none"
          stroke={color}
          strokeWidth={2}
          className={styles.line}
        />

        {/* Dots */}
        {showDots && processedData.map((d, i) => {
          const x = getX(i);
          const y = getY(d.y || d.value || 0);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={4}
              fill={color}
              stroke="white"
              strokeWidth={2}
              className={styles.dot}
            >
              <title>{d.label || `Point ${i + 1}: ${d.y || d.value || 0}`}</title>
            </circle>
          );
        })}

        {/* X-axis labels */}
        {processedData.map((d, i) => {
          const x = getX(i);
          return (
            <text
              key={i}
              x={x}
              y={margin.top + chartHeight + 20}
              textAnchor="middle"
              className={styles.axisLabel}
            >
              {d.label || i + 1}
            </text>
          );
        })}
      </svg>
    </Chart>
  );
};

/**
 * Progress Bar Component
 */
export const ProgressBar = ({
  title,
  value,
  max = 100,
  color = '#3b82f6',
  showPercentage = true,
  size = 'medium', // 'small', 'medium', 'large'
  animated = true
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const heightClasses = {
    small: styles.progressSmall,
    medium: styles.progressMedium,
    large: styles.progressLarge
  };

  return (
    <div className={styles.progressContainer}>
      {(title || showPercentage) && (
        <div className={styles.progressHeader}>
          {title && <span className={styles.progressTitle}>{title}</span>}
          {showPercentage && <span className={styles.progressPercentage}>{percentage.toFixed(1)}%</span>}
        </div>
      )}
      <div className={`${styles.progressBar} ${heightClasses[size]}`} max={max}>
        <div
          className={`${styles.progressFill} ${animated ? styles.progressAnimated : ''}`}
          style={{
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
      <div className={styles.progressLabels}>
        <span className={styles.progressLabelLeft}>0</span>
        <span className={styles.progressLabelRight}>{max}</span>
      </div>
    </div>
  );
};

/**
 * Mini Chart Components for Dashboard
 */
export const MiniBarChart = ({ data, height = 60, color = '#3b82f6' }) => {
  if (!data || !data.length) return null;

  const max = Math.max(...data.map(d => d.value || d));
  const width = 200;
  const barWidth = width / data.length;

  return (
    <svg width={width} height={height}>
      {data.map((item, index) => {
        const value = item.value || item;
        const barHeight = (value / max) * (height - 10);
        return (
          <rect
            key={index}
            x={index * barWidth}
            y={height - barHeight}
            width={barWidth * 0.7}
            height={barHeight}
            fill={color}
            opacity={0.8}
          />
        );
      })}
    </svg>
  );
};

export const MiniSparkline = ({ data, width = 100, height = 30, color = '#3b82f6' }) => {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / (max - min)) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
      />
    </svg>
  );
};

Chart.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  data: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  width: PropTypes.number,
  height: PropTypes.number,
  className: PropTypes.string,
  children: PropTypes.node
};

BarChart.propTypes = {
  title: PropTypes.string,
  data: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  colorScale: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  showLabels: PropTypes.bool,
  showValues: PropTypes.bool,
  maxBars: PropTypes.number,
  orientation: PropTypes.oneOf(['vertical', 'horizontal'])
};

PieChart.propTypes = {
  title: PropTypes.string,
  data: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  colors: PropTypes.array,
  showLabels: PropTypes.bool,
  showPercentages: PropTypes.bool,
  innerRadius: PropTypes.number
};

LineChart.propTypes = {
  title: PropTypes.string,
  data: PropTypes.array.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  color: PropTypes.string,
  showDots: PropTypes.bool,
  showGrid: PropTypes.bool,
  smooth: PropTypes.bool
};

ProgressBar.propTypes = {
  title: PropTypes.string,
  value: PropTypes.number.isRequired,
  max: PropTypes.number,
  color: PropTypes.string,
  showPercentage: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  animated: PropTypes.bool
};