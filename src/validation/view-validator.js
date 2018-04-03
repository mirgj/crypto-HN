import r from './rules';

export default {
  createUserOrLogin: {
    body: {
      username: r.usernameMatch,
      password: r.passwordMatch,
    },
  },
};
