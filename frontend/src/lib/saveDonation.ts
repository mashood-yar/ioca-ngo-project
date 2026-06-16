import { fetchApi } from './apiClient';

export const saveDonation = async (
  donorName: string, 
  email: string, 
  phone: string, 
  paymentMethod: string, 
  amount: number, 
  message: string,
  userId?: string
) => {
  const { data, error } = await fetchApi<{ id: string }>('/donations', {
    method: 'POST',
    body: JSON.stringify({
      donorName,
      email,
      phone,
      paymentMethod,
      amount,
      message,
      userId,
    }),
  });
  return { success: !error, data };
};
