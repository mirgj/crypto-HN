const toBaseURL = (fullURL) => {
  return fullURL.replace(/(http(s)?:\/\/)|(\/.*){1}/g, '');
};

const treefy = (comments, log) => {
  let map = {};
  let tree = [];
  if (!comments || comments.length === 0) return tree;

  comments.forEach((element) => {
    if (element._id) {
      map[element._id] = element;
      map[element._id].children = [];
    }
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
  if (!tree || tree.length === 0) return null;

  for (let i = 0; i < tree.length; i++) {
    const element = tree[i];

    if (element._id.toString() === id.toString()) {
      return [ element ];
    }
    const result = subtree(element.children, id);
    if (result) return result;
  }

  return tree;
};

const calculateMinAndMaxIds = (data) => {
  const defaultValue = data && data.length > 0 ? data[0]._id : null;
  let maxId = defaultValue;
  let minId = defaultValue;

  if (data) {
    data.forEach((el) => {
      if (el._id.getTimestamp() < minId.getTimestamp())
        minId = el._id;

      if (el._id.getTimestamp() > maxId.getTimestamp())
        maxId = el._id;
    });
  }

  return {
    min: minId,
    max: maxId,
  };
};

export {
  toBaseURL,
  treefy,
  subtree,
  calculateMinAndMaxIds,
};
