export const Errors = {
  DB_ERROR: 'DB not connected',
  INTERNAL_ERROR: 'Internal Server Error',
  API_NOT_FOUND: 'API method not found',
  BAD_REQUEST_ERROR: 'Malformed data. Check your input',
  STORY_NOT_FOUND: 'Story not found. Check the storyId and try again',
};

export const ErrorsCode = {
  API_ERROR: 'API Error',
  UNAUTHORIZED: 'Unauthorized',
  NOT_FOUND: 'Not Found',
  BAD_REQUEST: 'Bad Request',
};

export const HttpStatus = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export const Collections = {
  Users: 'users',
  Stories: 'stories',
  Comments: 'comments',
};
