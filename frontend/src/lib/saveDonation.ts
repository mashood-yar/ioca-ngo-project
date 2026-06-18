import { fetchApi } from './apiClient';

export const saveDonation = async (
  donorName: string, 
  email: string, 
  phone: string, 
  paymentMethod: string, 
  amount: number, 
  message: string,
  userId?: string,
  projectId?: string,
  transactionId?: string
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
      projectId,
      transactionId,
    }),
  });
  return { success: !error, data };
};
