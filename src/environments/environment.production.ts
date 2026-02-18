import { EnvironmentType } from '../app/_types/environment-type.type';

export const environment = {
  environmentType: 'PROD' as EnvironmentType,
  geocodeApi: 'https://services.gugik.gov.pl/uug',
  geoStatApi: 'https://geo.stat.gov.pl/api/fts/ref/qq',
  colors: {
    primary: '#1098f7',
    success: '#06bd8c',
    error: '#e0505c',
  },
  sentryDsn:
    'https://069cf899b4e34bae773e06ff484ff274@o4510541561462784.ingest.de.sentry.io/4510541566246992',
  apiUrl: 'https://parkowanko.onrender.com/api',
  googleClientId: '232236974500-cd550dd02vo2cb82qi2e54ai4l8825s5.apps.googleusercontent.com',
};
