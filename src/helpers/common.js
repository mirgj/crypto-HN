const toBaseURL = (fullURL) => {
  return fullURL.replace(/(http(s)?:\/\/)|(\/.*){1}/g, '');
};

const treefy = (comments) => {
  let map = {};
  let tree = [];

  comments.forEach((element) => {
    map[element._id] = element;
    map[element._id].children = [];
  });

  for (let _id in map) {
    if (map.hasOwnProperty(_id)) {
      const element = map[_id];

      if (element.parent) {
        map[element.parent].children.push(element);
      } else {
        tree.push(element);
      }
    }
  }

  return tree;
};

export {
  toBaseURL,
  treefy,
};
