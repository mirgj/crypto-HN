import * as r from './rules';

export default {
  getStory: {
    params: {
      storyId: r.idMatch,
    },
  },
  getStories: {
    query: {
      skip: r.skipMatch,
      take: r.takeMatch,
    },
  },
  createStory: {
    body: {
      title: r.titleMatch,
      text: r.textMatch,
      url: r.urlMatch,
    },
  },
  getUser: {
    params: {
      userId: r.idMatch,
    },
  },
  updateUser: {
    body: {
      about: r.textMatch,
      email: r.emailMatch,
    },
    params: {
      userId: r.idMatch,
    },
  },
  createUserOrLogin: {
    body: {
      username: r.usernameMatch,
      password: r.passwordMatch,
    },
  },
  createComment: {
    params: {
      storyId: r.idMatch,
    },
    body: {
      text: r.textMatch,
    },
  },
  vote: {
    params: {
      storyId: r.idMatch,
    },
    body: {
      direction: r.voteDirectionMatch,
    },
  },
};
