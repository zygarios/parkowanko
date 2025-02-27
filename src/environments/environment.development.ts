import { EnvironmentType } from '../app/_types/environment-type.model';
import { envShared } from './env-shared';

export const environment = {
  ...envShared,
  environmentType: 'DEV' as EnvironmentType,
  apiUrl: 'https://parkowanko.onrender.com/api',
};
