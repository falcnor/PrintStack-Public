import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

import { useFilaments } from '../../contexts/FilamentContext.js';
import { useModels } from '../../contexts/ModelContext.js';
import { usePrints } from '../../contexts/PrintContext.js';
import { useFilamentUsage } from '../../hooks/useFilamentUsage.js';
import FilamentUsageManager from '../common/FilamentUsageManager.jsx';
import FormErrorDisplay from '../common/FormErrorDisplay.jsx';
import ModelInfoDisplay from '../common/ModelInfoDisplay.jsx';

import styles from './PrintForm.module.css';

/**
 * Form component for adding/editing print records
 * @param {Object} props - Component props
 * @param {Object} props.print - Print data for editing mode
 * @param {Function} props.onSubmit - Form submission handler
 * @param {Function} props.onCancel - Form cancellation handler
 */
const PrintForm = ({ print, onSubmit, onCancel }) => {
  const { validatePrint } = usePrints();
  const { models } = useModels();
  const { filaments } = useFilaments();

  // Form state
  const [formData, setFormData] = useState({
    modelId: '',
    date: new Date().toISOString()
      .split('T')[0], // Today's date in YYYY-MM-DD format
    qualityRating: '',
    notes: '',
    duration: ''
  });

  const [errors, setErrors] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);

  // Use custom hook for filament usage management
  const {
    filamentUsages,
    addFilamentUsage,
    updateFilamentUsage,
    removeFilamentUsage,
    autoPopulateFromRequirements,
    calculateTotalWeight,
    setFilamentUsages
  } = useFilamentUsage([]);

  // Initialize form data when editing
  useEffect(() => {
    if (print) {
      setFormData({
        modelId: print.modelId || '',
        date: print.date
          ? print.date.split('T')[0]
          : new Date().toISOString()
            .split('T')[0],
        qualityRating: print.qualityRating || '',
        notes: print.notes || '',
        duration: print.duration || ''
      });

      if (print.modelId) {
        const model = models.find(m => m.id === print.modelId);
        setSelectedModel(model);
      }

      if (print.filamentUsages) {
        setFilamentUsages(print.filamentUsages);
      }
    }
  }, [print, models, setFilamentUsages]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    if (name === 'modelId') {
      const model = models.find(m => m.id === value);
      setSelectedModel(model);

      // Auto-populate filament requirements based on model
      if (model && model.requirements) {
        autoPopulateFromRequirements(model.requirements);
      } else {
        setFilamentUsages([]);
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Process form data
    const processedData = {
      ...formData,
      duration: formData.duration ? parseFloat(formData.duration) : null,
      filamentUsages: filamentUsages.map(usage => ({
        ...usage,
        actualWeight: usage.actualWeight ? parseFloat(usage.actualWeight) : null
      }))
    };

    // Validate form data
    const validation = validatePrint(processedData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    onSubmit(processedData);
  };

  // Calculate available filaments for the selected model
  const availableFilaments = selectedModel?.requirements?.map(req => {
    const filament = filaments.find(f => f.id === req.filamentId);
    return {
      ...req,
      filament,
      available: filament?.inStock || false
    };
  }) || [];

  const totalWeight = calculateTotalWeight();

  return (
    <form onSubmit={handleSubmit} className={styles.printForm}>
      {/* Error Display */}
      <FormErrorDisplay errors={errors} />

      {/* Model Selection */}
      <div className={styles.section}>
        <h3>Print Information</h3>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor='modelId'>Model *</label>
            <select
              id='modelId'
              name='modelId'
              value={formData.modelId}
              onChange={handleInputChange}
              required
              className={styles.modelSelect}
            >
              <option value=''>Select a model...</option>
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.category})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor='date'>Print Date *</label>
            <input
              type='date'
              id='date'
              name='date'
              value={formData.date}
              onChange={handleInputChange}
              required
              max={new Date().toISOString()
                .split('T')[0]}
            />
          </div>
        </div>

        <ModelInfoDisplay
          model={selectedModel}
          availableFilaments={availableFilaments}
        />
      </div>

      {/* Print Quality */}
      <div className={styles.section}>
        <h3>Print Quality</h3>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor='qualityRating'>Quality Rating</label>
            <select
              id='qualityRating'
              name='qualityRating'
              value={formData.qualityRating}
              onChange={handleInputChange}
            >
              <option value=''>Select quality...</option>
              <option value='excellent'>Excellent - Perfect print</option>
              <option value='good'>Good - Minor issues</option>
              <option value='fair'>Fair - Noticeable flaws</option>
              <option value='poor'>Poor - Major issues failed</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor='duration'>Actual Print Time (hours)</label>
            <input
              type='number'
              id='duration'
              name='duration'
              value={formData.duration}
              onChange={handleInputChange}
              min='0'
              step='0.1'
              placeholder='2.5'
            />
          </div>
        </div>
      </div>

      {/* Filament Usages */}
      <FilamentUsageManager
        filamentUsages={filamentUsages}
        availableFilaments={availableFilaments}
        onAddFilament={addFilamentUsage}
        onUpdateFilament={updateFilamentUsage}
        onRemoveFilament={removeFilamentUsage}
        onAutoPopulate={() => {
          if (selectedModel?.requirements) {
            autoPopulateFromRequirements(selectedModel.requirements);
          }
        }}
        totalWeight={totalWeight}
      />

      {/* Additional Notes */}
      <div className={styles.section}>
        <h3>Additional Notes</h3>
        <div className={styles.formGroup}>
          <label htmlFor='notes'>Print Notes</label>
          <textarea
            id='notes'
            name='notes'
            value={formData.notes}
            onChange={handleInputChange}
            rows='3'
            placeholder='Notes about print settings, issues, or observations'
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className={styles.actions}>
        <button
          type='button'
          onClick={onCancel}
          className={styles.cancelButton}
        >
          Cancel
        </button>
        <button type='submit' className={styles.submitButton}>
          {print ? 'Update Print' : 'Record Print'}
        </button>
      </div>
    </form>
  );
};

PrintForm.propTypes = {
  print: PropTypes.shape({
    id: PropTypes.string,
    modelId: PropTypes.string,
    date: PropTypes.string,
    qualityRating: PropTypes.string,
    notes: PropTypes.string,
    duration: PropTypes.number,
    filamentUsages: PropTypes.array
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default PrintForm;