import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

import { validateFilament } from '../../utils/dataUtils.js';

import styles from './FilamentForm.module.css';

const MATERIAL_TYPES = [
  'PLA',
  'PETG',
  'ABS',
  'TPU',
  'Wood',
  'Carbon Fiber',
  'Metal',
  'Silk',
  'Glow',
  'Other'
];

/**
 * Form component for adding and editing filament information
 * @param {Object} props - Component props
 * @param {Function} props.onSubmit - Callback function when form is submitted
 * @param {Function} props.onCancel - Callback function when form is cancelled
 * @param {Object} props.initialData - Initial form data for editing
 * @param {boolean} props.isEdit - Whether this is an edit form or add form
 */
const FilamentForm = ({
  onSubmit,
  onCancel,
  initialData = {},
  isEdit = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    material: 'PLA',
    color: '',
    weight: '',
    remainingWeight: '',
    cost: '',
    diameter: '1.75',
    temperature: '',
    notes: '',
    ...initialData
  });

  const [errors, setErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);

  const handleInputChange = e => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]:
        type === 'number' ? (value === '' ? '' : parseFloat(value)) : value
    }));

    // Clear errors for this field when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    setIsSubmitting(true);

    try {
      const validation = validateFilament(formData);
      console.log('Validation result:', validation);

      if (!validation.isValid) {
        console.log('Validation errors:', validation.errors);
        setErrors(validation.errors);
        setIsSubmitting(false);
        return;
      }

      console.log('Calling onSubmit with validated data');
      await onSubmit(formData);
      console.log('onSubmit completed successfully');
    } catch (error) {
      console.error('Error in form submission:', error);
      setErrors([`Failed to save filament: ${error.message}`]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isSubmitting) return;
    onCancel();
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.header}>
        <h2>{isEdit ? 'Edit Filament' : 'Add New Filament'}</h2>
        <button
          type='button'
          onClick={handleCancel}
          className={styles.closeButton}
          aria-label='Close form'
        >
          ×
        </button>
      </div>

      {errors.length > 0 && (
        <div className={styles.errors} role='alert'>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formFields}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor='name'>Name *</label>
              <input
                type='text'
                id='name'
                name='name'
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder='e.g., Blue Silk PLA'
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor='material'>Material *</label>
              <select
                id='material'
                name='material'
                value={formData.material}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
              >
                {MATERIAL_TYPES.map(material => (
                  <option key={material} value={material}>
                    {material}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor='color'>Color</label>
              <input
                type='text'
                id='color'
                name='color'
                value={formData.color}
                onChange={handleInputChange}
                placeholder='e.g., Blue'
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor='diameter'>Diameter (mm)</label>
              <select
                id='diameter'
                name='diameter'
                value={formData.diameter}
                onChange={handleInputChange}
                disabled={isSubmitting}
              >
                <option value='1.75'>1.75 mm</option>
                <option value='2.85'>2.85 mm</option>
                <option value='3.00'>3.00 mm</option>
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor='weight'>Total Weight (g)</label>
              <input
                type='number'
                id='weight'
                name='weight'
                value={formData.weight}
                onChange={handleInputChange}
                min='0'
                step='0.1'
                placeholder='e.g., 1000'
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor='remainingWeight'>Remaining Weight (g)</label>
              <input
                type='number'
                id='remainingWeight'
                name='remainingWeight'
                value={formData.remainingWeight}
                onChange={handleInputChange}
                min='0'
                step='0.1'
                placeholder='e.g., 850'
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor='cost'>Cost ($)</label>
              <input
                type='number'
                id='cost'
                name='cost'
                value={formData.cost}
                onChange={handleInputChange}
                min='0'
                step='0.01'
                placeholder='e.g., 24.99'
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor='temperature'>Print Temperature (°C)</label>
              <input
                type='number'
                id='temperature'
                name='temperature'
                value={formData.temperature}
                onChange={handleInputChange}
                min='0'
                step='1'
                placeholder='e.g., 210'
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <div className={styles.notesSection}>
          <label htmlFor='notes'>Notes</label>
          <textarea
            id='notes'
            name='notes'
            value={formData.notes}
            onChange={handleInputChange}
            rows={2}
            placeholder='Additional notes about this filament...'
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.actions}>
          <button
            type='button'
            onClick={handleCancel}
            className={styles.cancelButton}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type='submit'
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Saving...'
              : isEdit
                ? 'Update Filament'
                : 'Add Filament'}
          </button>
        </div>
      </form>
    </div>
  );
};

FilamentForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialData: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    material: PropTypes.string,
    color: PropTypes.string,
    weight: PropTypes.number,
    remainingWeight: PropTypes.number,
    cost: PropTypes.number,
    supplier: PropTypes.string,
    purchaseDate: PropTypes.string,
    temperature: PropTypes.shape({
      nozzle: PropTypes.number,
      bed: PropTypes.number
    }),
    diameter: PropTypes.number,
    notes: PropTypes.string
  }),
  isEdit: PropTypes.bool
};

export default FilamentForm;
