const toBaseURL = (fullURL) => {
  return fullURL.replace(/(http(s)?:\/\/)|(\/.*){1}/g, '');
};

export {
  toBaseURL,
};
