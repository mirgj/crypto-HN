import { MongoClient } from 'mongodb';

const state = {
  db: null,
};

const connect = async(url) => {
  if (state.db) return state.db;
  state.db = await MongoClient.connect(url);
};

const get = () => {
  return state.db;
};

const close = async() => {
  if (state.db) {
    await state.db.close();

    state.db = null;
  }
};

export {
  state,
  connect,
  get,
  close,
};
