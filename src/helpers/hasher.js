import bcrypt from 'bcrypt';

const salt = 15;

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
    bcrypt.hash(plainPassword, salt, function(err, hash) {
      if (err) return reject(err);

      return resolve(hash);
    });
  });
};

export {
  compareHash,
  generateHash,
};
