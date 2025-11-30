import PropTypes from 'prop-types';
import React, { memo } from 'react';

import styles from './SkeletonLoader.module.css';

/**
 * Base skeleton element with customizable width and height
 * @param {Object} props - Component props
 * @param {string} props.width - Width of skeleton (CSS value)
 * @param {string} props.height - Height of skeleton (CSS value)
 * @param {string} props.variant - Style variant ('text', 'circular', 'rectangular')
 * @param {string} props.className - Additional CSS class
 * @param {boolean} props.animate - Whether to show loading animation
 */
const SkeletonElement = ({
  width = '100%',
  height = '16px',
  variant = 'text',
  className = '',
  animate = true
}) => {
  const classNames = [
    styles.skeleton,
    styles[variant],
    animate ? styles.animate : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classNames}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
};

/**
 * Text skeleton with multiple lines
 * @param {Object} props - Component props
 * @param {number} props.lines - Number of text lines
 * @param {string} props.baseWidth - Base width for first line
 * @param {string} props.lastLineWidth - Width of last line (different from base)
 */
const TextSkeleton = ({
  lines = 3,
  baseWidth = '100%',
  lastLineWidth = '70%',
  animate = true
}) => {
  return (
    <div className={styles.textSkeleton}>
      {Array.from({ length: lines }, (index) => {
        const isLastLine = index === lines - 1;
        const width = isLastLine ? lastLineWidth : baseWidth;

        return (
          <SkeletonElement
            key={index}
            width={width}
            height="16px"
            variant="text"
            animate={animate}
            className={styles.textLine}
          />
        );
      })}
    </div>
  );
};

/**
 * Card skeleton for entity cards
 * @param {Object} props - Component props
 * @param {boolean} props.showImage - Whether to show image placeholder
 * @param {boolean} props.showTitle - Whether to show title placeholder
 * @param {boolean} props.showSubtitle - Whether to show subtitle placeholder
 * @param {boolean} props.showActions - Whether to show action buttons placeholder
 */
const CardSkeleton = ({
  showImage = true,
  showTitle = true,
  showSubtitle = true,
  showActions = true,
  animate = true
}) => {
  return (
    <div className={styles.cardSkeleton}>
      {showImage && (
        <SkeletonElement
          width="100%"
          height="120px"
          variant="rectangular"
          animate={animate}
          className={styles.cardImage}
        />
      )}
      <div className={styles.cardContent}>
        {showTitle && (
          <SkeletonElement
            width="80%"
            height="20px"
            variant="text"
            animate={animate}
            className={styles.cardTitle}
          />
        )}
        {showSubtitle && (
          <SkeletonElement
            width="60%"
            height="16px"
            variant="text"
            animate={animate}
            className={styles.cardSubtitle}
          />
        )}
        <TextSkeleton lines={2} baseWidth="100%" lastLineWidth="85%" animate={animate} />
      </div>
      {showActions && (
        <div className={styles.cardActions}>
          <SkeletonElement
            width="80px"
            height="32px"
            variant="rectangular"
            animate={animate}
          />
          <SkeletonElement
            width="80px"
            height="32px"
            variant="rectangular"
            animate={animate}
          />
        </div>
      )}
    </div>
  );
};

/**
 * List skeleton for sidebar lists or menus
 * @param {Object} props - Component props
 * @param {number} props.items - Number of list items
 * @param {boolean} props.showIcons - Whether to show icon placeholders
 * @param {boolean} props.showBadges - Whether to show badge placeholders
 */
const ListSkeleton = ({ items = 5, showIcons = false, showBadges = false, animate = true }) => {
  return (
    <div className={styles.listSkeleton}>
      {Array.from({ length: items }, (_, index) => (
        <div key={index} className={styles.listItem}>
          {showIcons && (
            <SkeletonElement
              width="20px"
              height="20px"
              variant="circular"
              animate={animate}
              className={styles.listIcon}
            />
          )}
          <div className={styles.listContent}>
            <SkeletonElement
              width="120px"
              height="16px"
              variant="text"
              animate={animate}
            />
            <SkeletonElement
              width="80px"
              height="14px"
              variant="text"
              animate={animate}
              className={styles.listSubtitle}
            />
          </div>
          {showBadges && (
            <SkeletonElement
              width="32px"
              height="20px"
              variant="rectangular"
              animate={animate}
              className={styles.listBadge}
            />
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Form skeleton for forms with various input types
 * @param {Object} props - Component props
 * @param {number} props.fields - Number of form fields
 * @param {boolean} props.showButtons - Whether to show form buttons
 * @param {Object} props.fieldConfig - Configuration for field types
 */
const FormSkeleton = ({
  fields = 4,
  showButtons = true,
  fieldConfig = {},
  animate = true
}) => {
  const defaultFieldConfig = {
    input: 0.6,  // 60% inputs
    select: 0.25, // 25% selects
    textarea: 0.15 // 15% textareas
  };

  const config = { ...defaultFieldConfig, ...fieldConfig };
  const fieldTypes = Array.from({ length: fields }, (_, index) => {
    const rand = Math.random();
    if (rand < config.input) return 'input';
    if (rand < config.input + config.select) return 'select';
    return 'textarea';
  });

  return (
    <div className={styles.formSkeleton}>
      {fieldTypes.map((type, index) => (
        <div key={index} className={styles.formField}>
          <SkeletonElement
            width="120px"
            height="16px"
            variant="text"
            animate={animate}
            className={styles.fieldLabel}
          />

          {type === 'textarea' ? (
            <SkeletonElement
              width="100%"
              height="80px"
              variant="rectangular"
              animate={animate}
              className={styles.textareaField}
            />
          ) : (
            <SkeletonElement
              width="100%"
              height="36px"
              variant="rectangular"
              animate={animate}
              className={styles.inputField}
            />
          )}

          <SkeletonElement
            width="60%"
            height="14px"
            variant="text"
            animate={animate}
            className={styles.fieldHelper}
          />
        </div>
      ))}

      {showButtons && (
        <div className={styles.formActions}>
          <SkeletonElement
            width="100px"
            height="40px"
            variant="rectangular"
            animate={animate}
          />
          <SkeletonElement
            width="100px"
            height="40px"
            variant="rectangular"
            animate={animate}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Dashboard skeleton with multiple content sections
 * @param {Object} props - Component props
 * @param {boolean} props.showStats - Whether to show stats cards
 * @param {boolean} props.showCharts - Whether to show chart placeholders
 * @param {boolean} props.showTables - Whether to show table skeletons
 */
const DashboardSkeleton = ({
  showStats = true,
  showCharts = true,
  showTables = true,
  animate = true
}) => {
  return (
    <div className={styles.dashboardSkeleton}>
      {showStats && (
        <div className={styles.statsSection}>
          <div className={styles.sectionHeader}>
            <SkeletonElement width="200px" height="24px" variant="text" animate={animate} />
          </div>
          <div className={styles.statsGrid}>
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className={styles.statCard}>
                <SkeletonElement
                  width="40px"
                  height="40px"
                  variant="circular"
                  animate={animate}
                  className={styles.statIcon}
                />
                <div className={styles.statContent}>
                  <SkeletonElement width="60px" height="24px" variant="text" animate={animate} />
                  <SkeletonElement width="80px" height="16px" variant="text" animate={animate} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.contentSection}>
        <div className={styles.contentGrid}>
          {showCharts && (
            <div className={styles.chartColumn}>
              <div className={styles.sectionHeader}>
                <SkeletonElement width="150px" height="20px" variant="text" animate={animate} />
              </div>
              <div className={styles.chartCard}>
                <SkeletonElement
                  width="100%"
                  height="200px"
                  variant="rectangular"
                  animate={animate}
                />
              </div>
            </div>
          )}

          {showTables && (
            <div className={styles.tableColumn}>
              <div className={styles.sectionHeader}>
                <SkeletonElement width="150px" height="20px" variant="text" animate={animate} />
              </div>
              <div className={styles.tableCard}>
                <TextSkeleton lines={3} baseWidth="100%" lastLineWidth="85%" animate={animate} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Conditional skeleton that shows based on loading state
 * @param {Object} props - Component props
 * @param {boolean} props.loading - Whether to show skeleton
 * @param {React.ReactNode} props.children - Content to show when not loading
 * @param {React.Component} props.skeleton - Custom skeleton component
 * @param {string} props.fallbackType - Type of fallback skeleton
 */
const ConditionalSkeleton = ({
  loading,
  children,
  skeleton = null,
  fallbackType = 'text'
}) => {
  if (loading) {
    if (skeleton) return skeleton;

    // Fallback skeleton based on type
    switch (fallbackType) {
      case 'card':
        return <CardSkeleton />;
      case 'list':
        return <ListSkeleton />;
      case 'table':
        return <TableSkeleton rows={5} columns={4} />;
      case 'form':
        return <FormSkeleton />;
      default:
        return <TextSkeleton />;
    }
  }

  return children;
};

// Export all skeleton components
export {
  SkeletonElement,
  TextSkeleton,
  CardSkeleton,
  ListSkeleton,
  FormSkeleton,
  DashboardSkeleton,
  ConditionalSkeleton
};

// Re-export TableSkeleton from existing component for convenience
export { default as TableSkeleton } from './TableSkeleton';

// Set PropTypes
SkeletonElement.propTypes = {
  width: PropTypes.string,
  height: PropTypes.string,
  variant: PropTypes.oneOf(['text', 'circular', 'rectangular']),
  className: PropTypes.string,
  animate: PropTypes.bool
};

TextSkeleton.propTypes = {
  lines: PropTypes.number,
  baseWidth: PropTypes.string,
  lastLineWidth: PropTypes.string,
  animate: PropTypes.bool
};

CardSkeleton.propTypes = {
  showImage: PropTypes.bool,
  showTitle: PropTypes.bool,
  showSubtitle: PropTypes.bool,
  showActions: PropTypes.bool,
  animate: PropTypes.bool
};

ListSkeleton.propTypes = {
  items: PropTypes.number,
  showIcons: PropTypes.bool,
  showBadges: PropTypes.bool,
  animate: PropTypes.bool
};

FormSkeleton.propTypes = {
  fields: PropTypes.number,
  showButtons: PropTypes.bool,
  fieldConfig: PropTypes.object,
  animate: PropTypes.bool
};

DashboardSkeleton.propTypes = {
  showStats: PropTypes.bool,
  showCharts: PropTypes.bool,
  showTables: PropTypes.bool,
  animate: PropTypes.bool
};

ConditionalSkeleton.propTypes = {
  loading: PropTypes.bool.isRequired,
  children: PropTypes.node,
  skeleton: PropTypes.node,
  fallbackType: PropTypes.oneOf(['text', 'card', 'list', 'table', 'form'])
};

export default {
  SkeletonElement,
  TextSkeleton,
  CardSkeleton,
  ListSkeleton,
  FormSkeleton,
  DashboardSkeleton,
  ConditionalSkeleton
};