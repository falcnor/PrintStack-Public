import React, { useContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ModelContext } from '../../contexts/ModelContext';
import { PrintContext } from '../../contexts/PrintContext';
import { StatisticsContext } from '../../contexts/StatisticsContext';
import * as statistics from '../../utils/statistics';
import styles from './PrintableModels.module.css';

/**
 * Printable Models Analysis Component
 * Analyzes and displays detailed statistics about printable models
 */
const PrintableModels = ({
  visible = false,
  onClose,
  showPrintedModels = true,
  showUnPrintedModels = true,
  showDetailedAnalysis = true,
  sortBy = 'name',
  filterByCategory = 'all',
  filterByStatus = 'all'
}) => {
  const { models } = useContext(ModelContext);
  const { prints } = useContext(PrintContext);
  const { modelStats, calculateModelAnalytics } = useContext(StatisticsContext);

  const [selectedModel, setSelectedModel] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Analyze models with their print history
  const analyzedModels = useMemo(() => {
    if (!models.length) return [];

    return models.map(model => {
      const modelPrints = prints.filter(print => print.modelId === model.id);

      return {
        ...model,
        printCount: modelPrints.length,
        totalPrintTime: modelPrints.reduce((sum, print) => sum + (print.duration || 0), 0),
        successRate: modelPrints.length > 0
          ? modelPrints.filter(print => print.status === 'completed').length / modelPrints.length
          : null,
        averageQuality: modelPrints.length > 0
          ? modelPrints.reduce((sum, print) => sum + (print.quality || 0), 0) / modelPrints.length
          : null,
        totalFilamentUsed: modelPrints.reduce((sum, print) => sum + (print.filamentUsed || 0), 0),
        lastPrintDate: modelPrints.length > 0
          ? new Date(Math.max(...modelPrints.map(p => new Date(p.date))))
          : null,
        isPrintable: Boolean(model.requirements && Object.keys(model.requirements).length > 0),
        favoriteFilament: getFavoriteFilament(modelPrints),
        hasPrints: modelPrints.length > 0,
        printHistory: modelPrints
      };
    });
  }, [models, prints]);

  function getFavoriteFilament(modelPrints) {
    if (!modelPrints.length) return null;

    const filamentUsage = {};
    modelPrints.forEach(print => {
      if (print.filamentUsed && print.filamentType) {
        filamentUsage[print.filamentType] = (filamentUsage[print.filamentType] || 0) + print.filamentUsed;
      }
    });

    const maxUsage = Math.max(...Object.values(filamentUsage));
    return Object.entries(filamentUsage).find(([_, usage]) => usage === maxUsage)?.[0] || null;
  }

  // Filter and sort models
  const filteredModels = useMemo(() => {
    return analyzedModels
      .filter(model => {
        // Search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          return model.name.toLowerCase().includes(searchLower) ||
                 model.description?.toLowerCase().includes(searchLower) ||
                 model.category?.toLowerCase().includes(searchLower);
        }

        // Category filter
        if (filterByCategory !== 'all' && model.category !== filterByCategory) {
          return false;
        }

        // Status filter
        if (filterByStatus === 'printed' && !model.hasPrints) return false;
        if (filterByStatus === 'unprinted' && model.hasPrints) return false;

        // Printable filter
        if (!showUnPrintedModels && !model.hasPrints) return false;
        if (!showPrintedModels && model.hasPrints) return false;

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'printCount':
            return b.printCount - a.printCount;
          case 'totalPrintTime':
            return b.totalPrintTime - a.totalPrintTime;
          case 'successRate':
            return (b.successRate || 0) - (a.successRate || 0);
          case 'quality':
            return (b.averageQuality || 0) - (a.averageQuality || 0);
          case 'dateAdded':
            return new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0);
          case 'lastPrint':
            const dateA = a.lastPrintDate?.getTime() || 0;
            const dateB = b.lastPrintDate?.getTime() || 0;
            return dateB - dateA;
          default:
            return 0;
        }
      });
  }, [analyzedModels, searchTerm, filterByCategory, filterByStatus, showPrintedModels, showUnPrintedModels, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredModels.length / itemsPerPage);
  const paginatedModels = filteredModels.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const categories = useMemo(() => {
    const cats = [...new Set(models.map(m => m.category).filter(Boolean))];
    return cats.sort();
  }, [models]);

  const formatDuration = (hours) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatFilament = (grams) => {
    if (grams < 1000) return `${grams}g`;
    return `${(grams / 1000).toFixed(1)}kg`;
  };

  const getQualityLabel = (quality) => {
    if (!quality && quality !== 0) return 'N/A';
    if (quality >= 4.5) return 'Excellent';
    if (quality >= 3.5) return 'Good';
    if (quality >= 2.5) return 'Fair';
    return 'Poor';
  };

  const getQualityColor = (quality) => {
    if (!quality && quality !== 0) return '#6b7280';
    if (quality >= 4.5) return '#22c55e';
    if (quality >= 3.5) return '#84cc16';
    if (quality >= 2.5) return '#f59e0b';
    return '#ef4444';
  };

  const getSuccessRateColor = (rate) => {
    if (!rate) return '#6b7280';
    if (rate >= 0.9) return '#22c55e';
    if (rate >= 0.7) return '#f59e0b';
    return '#ef4444';
  };

  const renderStatsOverview = () => {
    const printedModels = analyzedModels.filter(m => m.hasPrints);
    const unprintedModels = analyzedModels.filter(m => !m.hasPrints);
    const successfulModels = printedModels.filter(m => (m.successRate || 0) >= 0.9);

    return (
      <div className={styles.statsOverview}>
        <div className={styles.statItem}>
          <div className={styles.statValue}>{analyzedModels.length}</div>
          <div className={styles.statLabel}>Total Models</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statValue}>{printedModels.length}</div>
          <div className={styles.statLabel}>Printed</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statValue}>{unprintedModels.length}</div>
          <div className={styles.statLabel}>Unprinted</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statValue}>{successfulModels.length}</div>
          <div className={styles.statLabel}>Successfully Printed</div>
        </div>
      </div>
    );
  };

  const renderModelCard = (model) => {
    return (
      <div
        key={model.id}
        className={styles.modelCard}
        onClick={() => setSelectedModel(model)}
      >
        <div className={styles.modelHeader}>
          <h3 className={styles.modelName}>{model.name}</h3>
          <div className={styles.modelStatus}>
            {model.hasPrints && <span className={styles.printedBadge}>Printed</span>}
            {!model.hasPrints && <span className={styles.unprintedBadge}>Unprinted</span>}
          </div>
        </div>

        <div className={styles.modelMeta}>
          {model.category && (
            <div className={styles.category}>{model.category}</div>
          )}
          {model.dateAdded && (
            <div className={styles.dateAdded}>
              Added {new Date(model.dateAdded).toLocaleDateString()}
            </div>
          )}
        </div>

        <div className={styles.modelMetrics}>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Print Count</div>
            <div className={styles.metricValue}>{model.printCount}</div>
          </div>

          {model.totalPrintTime > 0 && (
            <div className={styles.metric}>
              <div className={styles.metricLabel}>Total Time</div>
              <div className={styles.metricValue}>{formatDuration(model.totalPrintTime)}</div>
            </div>
          )}

          {model.successRate !== null && (
            <div className={styles.metric}>
              <div className={styles.metricLabel}>Success Rate</div>
              <div
                className={styles.metricValue}
                style={{ color: getSuccessRateColor(model.successRate) }}
              >
                {(model.successRate * 100).toFixed(0)}%
              </div>
            </div>
          )}

          {model.averageQuality !== null && (
            <div className={styles.metric}>
              <div className={styles.metricLabel}>Avg Quality</div>
              <div
                className={styles.metricValue}
                style={{ color: getQualityColor(model.averageQuality) }}
              >
                {model.averageQuality.toFixed(1)}/5.0
              </div>
            </div>
          )}
        </div>

        {model.favoriteFilament && (
          <div className={styles.favoriteFilament}>
            <span className={styles.filamentLabel}>Favorite Filament:</span>
            <span className={styles.filamentType}>{model.favoriteFilament}</span>
          </div>
        )}

        {model.lastPrintDate && (
          <div className={styles.lastPrint}>
            Last printed: {model.lastPrintDate.toLocaleDateString()}
          </div>
        )}
      </div>
    );
  };

  const renderDetailedAnalysis = () => {
    if (!selectedModel) return null;

    return (
      <div className={styles.detailedAnalysis}>
        <div className={styles.analysisHeader}>
          <h3>{selectedModel.name}</h3>
          <button onClick={() => setSelectedModel(null)} className={styles.closeBtn}>✕</button>
        </div>

        <div className={styles.analysisContent}>
          {selectedModel.description && (
            <div className={styles.description}>
              <h4>Description</h4>
              <p>{selectedModel.description}</p>
            </div>
          )}

          <div className={styles.printHistory}>
            <h4>Print History ({selectedModel.printCount} prints)</h4>
            <div className={styles.printList}>
              {selectedModel.printHistory.map(print => (
                <div key={print.id} className={styles.printItem}>
                  <div className={styles.printDate}>
                    {new Date(print.date).toLocaleDateString()}
                  </div>
                  <div className={styles.printStatus}>
                    <span
                      className={`${styles.status} ${styles[print.status]}`}
                    >
                      {print.status}
                    </span>
                  </div>
                  <div className={styles.printQuality}>
                    Quality: {getQualityLabel(print.quality)} ({print.quality}/5)
                  </div>
                  {print.duration && (
                    <div className={styles.printDuration}>
                      {formatDuration(print.duration)}
                    </div>
                  )}
                  {print.filamentUsed && (
                    <div className={styles.printFilament}>
                      {formatFilament(print.filamentUsed)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {selectedModel.requirements && Object.keys(selectedModel.requirements).length > 0 && (
            <div className={styles.requirements}>
              <h4>Requirements</h4>
              <div className={styles.requirementList}>
                {Object.entries(selectedModel.requirements).map(([key, value]) => (
                  <div key={key} className={styles.requirementItem}>
                    <span className={styles.requirementKey}>{key}:</span>
                    <span className={styles.requirementValue}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!visible) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Printable Models Analysis</h2>
        <button onClick={onClose} className={styles.closeBtn}>✕</button>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchControl}>
          <input
            type="text"
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <select
          value={filterByCategory}
          onChange={(e) => setFilterByCategory(e.target.value)}
          className={styles.select}
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={filterByStatus}
          onChange={(e) => setFilterByStatus(e.target.value)}
          className={styles.select}
        >
          <option value="all">All Status</option>
          <option value="printed">Printed</option>
          <option value="unprinted">Unprinted</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className={styles.select}
        >
          <option value="name">Name</option>
          <option value="printCount">Print Count</option>
          <option value="totalPrintTime">Total Time</option>
          <option value="successRate">Success Rate</option>
          <option value="quality">Quality</option>
          <option value="dateAdded">Date Added</option>
          <option value="lastPrint">Last Print</option>
        </select>
      </div>

      {showDetailedAnalysis && renderStatsOverview()}

      <div className={styles.modelsContainer}>
        <div className={styles.modelsList}>
          <div className={styles.modelGrid}>
            {paginatedModels.map(renderModelCard)}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={styles.pageBtn}
              >
                    Previous
              </button>
              <span className={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={styles.pageBtn}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {showDetailedAnalysis && renderDetailedAnalysis()}
      </div>
    </div>
  );
};

PrintableModels.propTypes = {
  visible: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  showPrintedModels: PropTypes.bool,
  showUnPrintedModels: PropTypes.bool,
  showDetailedAnalysis: PropTypes.bool,
  sortBy: PropTypes.string,
  filterByCategory: PropTypes.string,
  filterByStatus: PropTypes.string
};

export default PrintableModels;