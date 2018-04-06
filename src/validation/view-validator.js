import r from './rules';

export default {
  createUserOrLogin: {
    body: {
      username: r.usernameMatch,
      password: r.passwordMatch,
    },
  },
  updateUser: {
    body: {
      about: r.textMatch,
      email: r.emailMatch.allow(''),
    },
    username: {
      userId: r.usernameMatch,
    },
  },
};
