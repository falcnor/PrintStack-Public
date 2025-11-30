import PropTypes from 'prop-types';
import React from 'react';

import styles from './FilamentUsageManager.module.css';

/**
 * Component to manage filament usage entries in forms
 * @param {Object} props - Component props
 * @param {Array} props.filamentUsages - Array of filament usage objects
 * @param {Array} props.availableFilaments - Available filament options
 * @param {Function} props.onAddFilament - Handler for adding new filament usage
 * @param {Function} props.onUpdateFilament - Handler for updating filament usage
 * @param {Function} props.onRemoveFilament - Handler for removing filament usage
 * @param {Function} props.onAutoPopulate - Handler for auto-populating from model requirements
 * @param {number} props.totalWeight - Total weight of all filament usages
 */
const FilamentUsageManager = ({
  filamentUsages = [],
  availableFilaments = [],
  onAddFilament,
  onUpdateFilament,
  onRemoveFilament,
  onAutoPopulate,
  totalWeight = 0
}) => {
  const handleFilamentChange = (index, field) => (event) => {
    const { value } = event.target;
    onUpdateFilament(index, field, value);
  };

  return (
    <div className={styles.filamentSection}>
      <h3>Filament Usages</h3>

      {filamentUsages.length === 0 ? (
        <div className={styles.noFilaments}>
          <p>No filament usages added</p>
          {availableFilaments.length > 0 && (
            <button
              type="button"
              onClick={onAutoPopulate}
              className={styles.autoPopulateButton}
            >
              Auto-populate from Model Requirements
            </button>
          )}
        </div>
      ) : (
        <div className={styles.filamentUsages}>
          {filamentUsages.map((usage, index) => {
            const filament = availableFilaments.find(
              f => f.filamentId === usage.filamentId
            )?.filament;

            return (
              <div key={usage.id} className={styles.filamentUsage}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Filament *</label>
                    <select
                      value={usage.filamentId}
                      onChange={handleFilamentChange(index, 'filamentId')}
                      required
                    >
                      <option value="">Select Filament...</option>
                      {availableFilaments.map(req => (
                        <option
                          key={req.filamentId}
                          value={req.filamentId}
                          disabled={!req.available}
                          className={!req.available ? styles.disabled : ''}
                        >
                          {req.filament
                            ? `${req.filament.colorName || req.filament.color} (${req.materialType}) - ${req.filament.brand}`
                            : `${req.materialType} - Not Available`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Material Type *</label>
                    <input
                      type="text"
                      value={usage.materialType}
                      onChange={handleFilamentChange(index, 'materialType')}
                      placeholder="PLA, PETG, etc."
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Actual Weight (g) *</label>
                    <input
                      type="number"
                      value={usage.actualWeight}
                      onChange={handleFilamentChange(index, 'actualWeight')}
                      min="0"
                      step="0.1"
                      placeholder="10.5"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveFilament(index)}
                    className={styles.removeButton}
                  >
                    Remove
                  </button>
                </div>

                {filament && (
                  <div className={styles.filamentInfo}>
                    <span className={styles.filamentDetails}>
                      {filament.colorName || filament.color} (
                      {filament.materialType}) - {filament.brand}
                    </span>
                    {filament.weight && (
                      <span className={styles.remainingWeight}>
                        {filament.weight}g available
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={onAddFilament}
        className={styles.addButton}
      >
        + Add Filament Usage
      </button>

      {/* Total Weight Display */}
      {filamentUsages.length > 0 && (
        <div className={styles.totalWeight}>
          <strong>Total Weight Used:</strong>{' '}
          {totalWeight.toFixed(1)}g
        </div>
      )}
    </div>
  );
};

FilamentUsageManager.propTypes = {
  filamentUsages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      filamentId: PropTypes.string,
      materialType: PropTypes.string,
      actualWeight: PropTypes.string
    })
  ).isRequired,
  availableFilaments: PropTypes.arrayOf(
    PropTypes.shape({
      filamentId: PropTypes.string.isRequired,
      materialType: PropTypes.string.isRequired,
      filament: PropTypes.shape({
        colorName: PropTypes.string,
        color: PropTypes.string,
        materialType: PropTypes.string,
        brand: PropTypes.string,
        weight: PropTypes.number
      }),
      available: PropTypes.bool
    })
  ).isRequired,
  onAddFilament: PropTypes.func.isRequired,
  onUpdateFilament: PropTypes.func.isRequired,
  onRemoveFilament: PropTypes.func.isRequired,
  onAutoPopulate: PropTypes.func.isRequired,
  totalWeight: PropTypes.number
};

export default FilamentUsageManager;