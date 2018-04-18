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

      if (element.parent && map[element.parent]) {
        map[element.parent].children.push(element);
      } else {
        tree.push(element);
      }
    }
  }

  return tree;
};


const subtree = (tree, id) => {
  if (tree.length === 0) return null;

  for (let i = 0; i < tree.length; i++) {
    const element = tree[i];

    if (element._id.toString() === id) {
      return [ element ];
    }
    const result = subtree(element.children, id);
    if (result) return result;
  }
};

export {
  toBaseURL,
  treefy,
  subtree,
};
