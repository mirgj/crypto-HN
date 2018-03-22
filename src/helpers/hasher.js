import bcrypt from 'bcrypt';
import config from '../../config';

const compareHash = (inputPassword, dbPassword) => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(inputPassword, dbPassword, (err, success) => {
      if (err) return reject(err);

      return resolve(success);
    });
  });
};

const generateHash = (plainPassword) => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(plainPassword, config.keys.hashSalt, function(err, hash) {
      if (err) return reject(err);

      return resolve(hash);
    });
  });
};

export {
  compareHash,
  generateHash,
};
