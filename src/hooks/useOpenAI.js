import { useCallback, useEffect, useState } from 'react';
import { getNutritionData, isOpenAIConfigured, parseFoodInput } from '../services/openaiService.js';

export const useOpenAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mocked, setMocked] = useState(true);

  useEffect(() => {
    isOpenAIConfigured().then((configured) => setMocked(!configured));
  }, []);

  const parse = useCallback(async (input) => {
    setLoading(true);
    setError(null);
    try {
      return await parseFoodInput(input);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const lookupNutrition = useCallback(async (foodItems) => {
    setLoading(true);
    setError(null);
    try {
      return await getNutritionData(foodItems);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { parse, lookupNutrition, loading, error, mocked };
};
