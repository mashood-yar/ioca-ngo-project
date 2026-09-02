
import 'dotenv/config';
import { uploadBase64Image } from './backend/_lib/upload';

async function run() {
  try {
    const base64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    const res = await uploadBase64Image(base64, 'test');
    console.log('SUCCESS:', res);
  } catch(e: any) {
    console.error('ERROR:', e.message);
  }
}
run();

