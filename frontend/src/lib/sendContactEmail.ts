import { fetchApi } from './apiClient';

export const sendContactEmail = async (name: string, email: string, message: string) => {
  const { error } = await fetchApi('/contacts', {
    method: 'POST',
    body: JSON.stringify({ name, email, message }),
  });
  return !error;
};
