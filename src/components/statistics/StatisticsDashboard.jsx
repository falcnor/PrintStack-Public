import React, { useState, useEffect, useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { StatisticsContext } from '../../contexts/StatisticsContext';
import * as statistics from '../../utils/statistics';
import styles from './StatisticsDashboard.module.css';

/**
 * Business Analytics Dashboard Component
 * Shows comprehensive 3D printing business statistics and analytics
 */
const StatisticsDashboard = ({
  visible = false,
  onClose,
  position = 'full-page',
  autoRefresh = true,
  refreshInterval = 30000,
  showFilamentStats = true,
  showModelStats = true,
  showPrintStats = true,
  showEconomicStats = true,
  showUsagePatterns = true,
  showTrends = true
}) => {
  const {
    filamentStats,
    modelStats,
    printStats,
    usageStats,
    economicStats,
    loading,
    error,
    lastUpdated,
    calculateAllStatistics,
    refreshStatistics
  } = useContext(StatisticsContext);

  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isRealTime, setIsRealTime] = useState(true);
  const [refreshIntervalId, setRefreshIntervalId] = useState(null);

  const handleRefresh = useCallback(() => {
    refreshStatistics();
  }, [refreshStatistics]);

  useEffect(() => {
    if (visible && autoRefresh && isRealTime) {
      handleRefresh();
      const intervalId = setInterval(handleRefresh, refreshInterval);
      setRefreshIntervalId(intervalId);

      return () => {
        clearInterval(intervalId);
      };
    } else if (refreshIntervalId) {
      clearInterval(refreshIntervalId);
      setRefreshIntervalId(null);
    }
  }, [visible, autoRefresh, isRealTime, refreshInterval, handleRefresh, refreshIntervalId]);

  useEffect(() => {
    if (visible) {
      handleRefresh();
    }
  }, [visible, handleRefresh]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatDuration = (hours) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getTrendIndicator = (current, previous) => {
    if (!previous || !current) return null;
    const change = ((current - previous) / previous) * 100;
    if (Math.abs(change) < 0.1) return null;

    return {
      direction: change > 0 ? 'up' : 'down',
      value: Math.abs(change).toFixed(1)
    };
  };

  const renderFilamentStats = () => {
    if (!filamentStats) return null;

    return (
      <div className={styles.statCard}>
        <h3>Filament Inventory</h3>
        <div className={styles.statGrid}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{filamentStats.totalSpools}</div>
            <div className={styles.statLabel}>Total Spools</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{filamentStats.totalWeight.toFixed(1)} kg</div>
            <div className={styles.statLabel}>Total Weight</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{formatCurrency(filamentStats.totalValue)}</div>
            <div className={styles.statLabel}>Total Value</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{filamentStats.averageSpoolWeight.toFixed(1)} kg</div>
            <div className={styles.statLabel}>Avg Weight</div>
          </div>
        </div>

        <div className={styles.materialBreakdown}>
          <h4>Material Breakdown</h4>
          {filamentStats.mostUsedMaterials.map((material, index) => (
            <div key={index} className={styles.materialItem}>
              <div className={styles.materialName}>{material.type}</div>
              <div className={styles.materialCount}>{material.count} spools</div>
              <div className={styles.materialPercentage}>
                {((material.count / filamentStats.totalSpools) * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderModelStats = () => {
    if (!modelStats) return null;

    return (
      <div className={styles.statCard}>
        <h3>Model Library</h3>
        <div className={styles.statGrid}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{modelStats.totalModels}</div>
            <div className={styles.statLabel}>Total Models</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{modelStats.printCount}</div>
            <div className={styles.statLabel}>Times Printed</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{modelStats.averagePrintsPerModel.toFixed(1)}</div>
            <div className={styles.statLabel}>Avg Prints/Model</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{modelStats.printableModels}</div>
            <div className={styles.statLabel}>Printable Models</div>
          </div>
        </div>

        <div className={styles.categoryBreakdown}>
          <h4>Categories</h4>
          {modelStats.mostPrintedCategories.map((category, index) => (
            <div key={index} className={styles.categoryItem}>
              <div className={styles.categoryName}>{category.category}</div>
              <div className={styles.categoryCount}>{category.printCount} prints</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPrintStats = () => {
    if (!printStats) return null;

    return (
      <div className={styles.statCard}>
        <h3>Print History</h3>
        <div className={styles.statGrid}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{printStats.totalPrints}</div>
            <div className={styles.statLabel}>Total Prints</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{(printStats.successRate * 100).toFixed(1)}%</div>
            <div className={styles.statLabel}>Success Rate</div>
          </div>
          <div className={styles.statItem}>{formatDuration(printStats.averagePrintTime)}</div>
            <div className={styles.statLabel}>Avg Print Time</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{formatDuration(printStats.totalPrintTime)}</div>
            <div className={styles.statLabel}>Total Time</div>
          </div>
        </div>

        <div className={styles.qualityBreakdown}>
          <h4>Quality Distribution</h4>
          <div className={styles.qualityBar}>
            {Object.entries(printStats.qualityDistribution || {}).map(([quality, count]) => (
              <div
                key={quality}
                className={styles.qualitySegment}
                style={{
                  width: `${(count / printStats.totalPrints) * 100}%`,
                  backgroundColor: getQualityColor(quality)
                }}
                title={`${quality}: ${count} prints`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderEconomicStats = () => {
    if (!economicStats) return null;

    return (
      <div className={styles.statCard}>
        <h3>Economic Analysis</h3>
        <div className={styles.statGrid}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{formatCurrency(economicStats.totalFilamentInvestment)}</div>
            <div className={styles.statLabel}>Filament Investment</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{formatCurrency(economicStats.averageCostPerPrint)}</div>
            <div className={styles.statLabel}>Cost Per Print</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{formatCurrency(economicStats.filamentValueUsed)}</div>
            <div className={styles.statLabel}>Filament Used Value</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{formatCurrency(economicStats.savingsFromPrinting)}</div>
            <div className={styles.statLabel}>Estimated Savings</div>
          </div>
        </div>

        <div className={styles.roiIndicator}>
          <div className={styles.roiValue}>ROI: {economicStats.returnOnInvestment?.toFixed(1)}%</div>
          <div className={styles.roiDescription}>
            Based on replacement cost multiplier of {economicStats.replacementCostMultiplier}x
          </div>
        </div>
      </div>
    );
  };

  const renderUsagePatterns = () => {
    if (!usageStats) return null;

    return (
      <div className={styles.statCard}>
        <h3>Usage Patterns</h3>
        <div className={styles.patternsGrid}>
          <div className={styles.patternItem}>
            <div className={styles.patternLabel}>Peak Usage Day</div>
            <div className={styles.patternValue}>{usageStats.peakUsageDay?.day || 'N/A'}</div>
            <div className={styles.patternSub}>{usageStats.peakUsageDay?.count || 0} prints</div>
          </div>
          <div className={styles.patternItem}>
            <div className={styles.patternLabel}>Longest Print</div>
            <div className={styles.patternValue}>{formatDuration(usageStats.longestRunningPrint?.duration || 0)}</div>
            <div className={styles.patternSub}>{usageStats.longestRunningPrint?.model || 'N/A'}</div>
          </div>
          <div className={styles.patternItem}>
            <div className={styles.patternLabel}>Monthly Trend</div>
            <div className={styles.patternValue}>{usageStats.monthlyTrend?.direction || 'stable'}</div>
            <div className={styles.patternSub}>{usageStats.monthlyTrend?.percentage?.toFixed(1) || 0}%</div>
          </div>
          <div className={styles.patternItem}>
            <div className={styles.patternLabel}>Favorite Material</div>
            <div className={styles.patternValue}>{usageStats.favoriteMaterial?.material || 'N/A'}</div>
            <div className={styles.patternSub}>{usageStats.favoriteMaterial?.kg || 0} kg used</div>
          </div>
        </div>
      </div>
    );
  };

  const getQualityColor = (quality) => {
    const colors = {
      'Excellent': '#22c55e',
      'Good': '#84cc16',
      'Fair': '#f59e0b',
      'Poor': '#ef4444'
    };
    return colors[quality] || '#6b7280';
  };

  if (!visible) return null;

  return (
    <div className={`${styles.dashboard} ${styles[position]}`}>
      <div className={styles.header}>
        <h2>Business Analytics Dashboard</h2>
        <div className={styles.controls}>
          <div className={styles.toggleGroup}>
            <button
              className={`${styles.toggleBtn} ${isRealTime ? styles.active : ''}`}
              onClick={() => setIsRealTime(!isRealTime)}
            >
              {isRealTime ? '🟢 Live' : '⏸️ Paused'}
            </button>
          </div>
          <button onClick={handleRefresh} className={styles.refreshBtn}>
            🔄 Refresh
          </button>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>
      </div>

      <div className={styles.content}>
        {loading && (
          <div className={styles.loadingIndicator}>
            <div className={styles.spinner}></div>
            Calculating statistics...
          </div>
        )}

        {error && (
          <div className={styles.errorMessage}>
            ⚠️ Error loading statistics: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className={classes.statsContainer}>
              {showFilamentStats && renderFilamentStats()}
              {showModelStats && renderModelStats()}
              {showPrintStats && renderPrintStats()}
              {showEconomicStats && renderEconomicStats()}
              {showUsagePatterns && renderUsagePatterns()}
            </div>

            {lastUpdated && (
              <div className={styles.footer}>
                <div className={styles.lastUpdated}>
                  Last updated: {new Date(lastUpdated).toLocaleString()}
                </div>
                <div className={styles.dataSource}>
                  Data source: LocalStorage ({formatCurrency(economicStats?.totalFilamentInvestment || 0)} total value)
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

StatisticsDashboard.propTypes = {
  visible: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  position: PropTypes.oneOf(['full-page', 'modal', 'sidebar']),
  autoRefresh: PropTypes.bool,
  refreshInterval: PropTypes.number,
  showFilamentStats: PropTypes.bool,
  showModelStats: PropTypes.bool,
  showPrintStats: PropTypes.bool,
  showEconomicStats: PropTypes.bool,
  showUsagePatterns: PropTypes.bool,
  showTrends: PropTypes.bool
};

export default StatisticsDashboard;