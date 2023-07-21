import Fingerprint2 from 'fingerprintjs2';

export const getDeviceId = () => {
  return new Promise((resolve, reject) => {
    Fingerprint2.get((components) => {
      const values = components.map((component) => component.value);
      const deviceId = Fingerprint2.x64hash128(values.join(''), 31);
      resolve(deviceId);
    });
  });
};

export const getUserDetail = () => {
  const user = localStorage.getItem('user');
  if(user){
    return JSON.parse(user);
  }
};
