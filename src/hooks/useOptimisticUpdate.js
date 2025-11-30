import { useState, useCallback, useRef } from 'react';
import { useApp } from '../contexts/AppContext';

/**
 * Hook for optimistic updates that provides immediate UI feedback
 * while persisting changes to storage in the background
 * @param {string} entityType - Type of entity ('filament', 'model', 'print')
 * @returns {Object} Optimistic update functions and state
 */
export const useOptimisticUpdate = (entityType) => {
  const {
    [`add${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`]: addEntity,
    [`update${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`]: updateEntity,
    [`delete${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`]: deleteEntity,
    [entityType + 's']: entities
  } = useApp();

  const [optimisticState, setOptimisticState] = useState({
    isUpdating: false,
    pendingOperations: [],
    error: null
  });

  const pendingOperationsRef = useRef([]);

  /**
   * Execute an operation with optimistic update
   * @param {Function} operation - The actual operation to execute
   * @param {Function} optimisticAction - The optimistic action for immediate UI update
   * @param {Function} rollbackAction - Rollback action if operation fails
   * @param {Object} payload - Operation payload
   * @returns {Promise} Operation result
   */
  const executeOptimistic = useCallback(async (
    operation,
    optimisticAction,
    rollbackAction,
    payload
  ) => {
    const operationId = Date.now().toString();

    // Add to pending operations
    const operationData = { id: operationId, type: 'pending', entityType, payload };
    pendingOperationsRef.current.push(operationData);

    setOptimisticState(prev => ({
      ...prev,
      isUpdating: true,
      pendingOperations: [...prev.pendingOperations, operationData]
    }));

    try {
      // Execute optimistic action immediately for instant UI feedback
      optimisticAction(payload);

      // Execute the actual operation asynchronously
      const result = await operation(payload);

      // Remove from pending operations on success
      pendingOperationsRef.current = pendingOperationsRef.current.filter(op => op.id !== operationId);

      setOptimisticState(prev => ({
        ...prev,
        isUpdating: pendingOperationsRef.current.length > 0,
        pendingOperations: pendingOperationsRef.current,
        error: null
      }));

      return { success: true, data: result };
    } catch (error) {
      // Rollback the optimistic change on error
      rollbackAction(payload);

      // Remove from pending operations and set error
      pendingOperationsRef.current = pendingOperationsRef.current.filter(op => op.id !== operationId);

      setOptimisticState(prev => ({
        ...prev,
        isUpdating: pendingOperationsRef.current.length > 0,
        pendingOperations: pendingOperationsRef.current,
        error: error.message || 'Operation failed'
      }));

      throw error;
    }
  }, [entityType]);

  /**
   * Add entity with optimistic update
   */
  const addOptimistic = useCallback(async (newEntity) => {
    const tempId = `temp_${Date.now()}`;
    const tempEntity = {
      ...newEntity,
      id: tempId,
      _isOptimistic: true,
      createdAt: new Date().toISOString()
    };

    return executeOptimistic(
      (data) => Promise.resolve(addEntity(data)),
      (data) => addEntity(tempEntity), // Optimistic add with temp ID
      (data) => deleteEntity(tempId), // Rollback: delete the temp entity
      newEntity
    );
  }, [executeOptimistic, addEntity, deleteEntity]);

  /**
   * Update entity with optimistic update
   */
  const updateOptimistic = useCallback(async (updatedEntity) => {
    const originalEntity = entities.find(e => e.id === updatedEntity.id);

    return executeOptimistic(
      (data) => Promise.resolve(updateEntity(data)),
      (data) => updateEntity(data), // Optimistic update
      (data) => updateEntity(originalEntity), // Rollback: restore original
      updatedEntity
    );
  }, [executeOptimistic, updateEntity, entities]);

  /**
   * Delete entity with optimistic update
   */
  const deleteOptimistic = useCallback(async (entityId) => {
    const originalEntity = entities.find(e => e.id === entityId);

    return executeOptimistic(
      (data) => Promise.resolve(deleteEntity(data)),
      (data) => deleteEntity(data), // Optimistic delete
      (data) => addEntity(originalEntity), // Rollback: restore original
      entityId
    );
  }, [executeOptimistic, deleteEntity, addEntity, entities]);

  /**
   * Batch operations with optimistic updates
   */
  const batchOptimistic = useCallback(async (operations) => {
    const operationsWithIds = operations.map(op => ({
      ...op,
      id: Date.now().toString() + Math.random(),
      originalEntity: op.type === 'update' || op.type === 'delete'
        ? entities.find(e => e.id === op.payload.id)
        : null
    }));

    pendingOperationsRef.current.push(...operationsWithIds);

    setOptimisticState(prev => ({
      ...prev,
      isUpdating: true,
      pendingOperations: [...prev.pendingOperations, ...operationsWithIds]
    }));

    try {
      // Execute all optimistic actions
      operationsWithIds.forEach(operation => {
        switch (operation.type) {
          case 'add':
            addOptimistic(operation.payload);
            break;
          case 'update':
            updateOptimistic(operation.payload);
            break;
          case 'delete':
            deleteOptimistic(operation.payload);
            break;
        }
      });

      // Execute all actual operations
      const results = await Promise.all(
        operations.map(op => {
          switch (op.type) {
            case 'add':
              return addEntity(op.payload);
            case 'update':
              return updateEntity(op.payload);
            case 'delete':
              return deleteEntity(op.payload);
            default:
              return Promise.resolve();
          }
        })
      );

      // Clear pending operations
      pendingOperationsRef.current = pendingOperationsRef.current.filter(
        op => !operationsWithIds.some(temp => temp.id === op.id)
      );

      setOptimisticState(prev => ({
        ...prev,
        isUpdating: false,
        pendingOperations: pendingOperationsRef.current,
        error: null
      }));

      return { success: true, results };
    } catch (error) {
      // Rollback all operations
      operationsWithIds.forEach(operation => {
        const { type, originalEntity, payload } = operation;
        switch (type) {
          case 'add':
            // optimistic add needs rollback
            deleteEntity(`temp_${operation.id}`);
            break;
          case 'update':
            if (originalEntity) updateEntity(originalEntity);
            break;
          case 'delete':
            if (originalEntity) addEntity(originalEntity);
            break;
        }
      });

      pendingOperationsRef.current = pendingOperationsRef.current.filter(
        op => !operationsWithIds.some(temp => temp.id === op.id)
      );

      setOptimisticState(prev => ({
        ...prev,
        isUpdating: false,
        pendingOperations: pendingOperationsRef.current,
        error: error.message || 'Batch operation failed'
      }));

      throw error;
    }
  }, [addOptimistic, updateOptimistic, deleteOptimistic, addEntity, updateEntity, deleteEntity, entities]);

  /**
   * Clear optimistic state
   */
  const clearOptimisticState = useCallback(() => {
    pendingOperationsRef.current = [];
    setOptimisticState({
      isUpdating: false,
      pendingOperations: [],
      error: null
    });
  }, []);

  /**
   * Get entities mixed with optimistic additions
   */
  const getEntitiesWithOptimistic = useCallback(() => {
    const optimisticAdditions = optimisticState.pendingOperations
      .filter(op => op.type === 'pending' && !entities.some(e => e.id === op.tempId))
      .map(op => ({
        ...op.payload,
        id: op.tempId,
        _isOptimistic: true
      }));

    return [...entities, ...optimisticAdditions];
  }, [entities, optimisticState.pendingOperations]);

  return {
    // State
    isUpdating: optimisticState.isUpdating,
    pendingOperations: optimisticState.pendingOperations,
    error: optimisticState.error,

    // Optimistic actions
    addOptimistic,
    updateOptimistic,
    deleteOptimistic,
    batchOptimistic,

    // Utilities
    clearOptimisticState,
    getEntitiesWithOptimistic
  };
};

/**
 * Enhanced hook for forms with optimistic updates
 */
export const useFormWithOptimism = (entityType, initialFormState, validationSchema) => {
  const optimisticUpdate = useOptimisticUpdate(entityType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const submitWithOptimism = useCallback(async (formData, mode = 'create') => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let result;
      switch (mode) {
        case 'create':
          result = await optimisticUpdate.addOptimistic(formData);
          break;
        case 'update':
          result = await optimisticUpdate.updateOptimistic(formData);
          break;
        case 'delete':
          result = await optimisticUpdate.deleteOptimistic(formData.id);
          break;
        default:
          throw new Error(`Unknown submit mode: ${mode}`);
      }

      return result;
    } catch (error) {
      setSubmitError(error.message || 'Operation failed');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [optimisticUpdate]);

  return {
    ...optimisticUpdate,
    isSubmitting,
    submitError,
    submitWithOptimism
  };
};

export default useOptimisticUpdate;